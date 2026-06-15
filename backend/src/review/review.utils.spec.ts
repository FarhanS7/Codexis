import {
  estimateTokens,
  chunkDiff,
  validateSuggestion,
  deduplicateSuggestions,
} from './review.utils';
import { ParsedFile } from '../github/diff.types';
import { RawSuggestion } from './review.types';

describe('Review Utilities', () => {
  describe('estimateTokens', () => {
    it('should return the ceiling of length divided by 4', () => {
      expect(estimateTokens('hello world')).toBe(3); // 11 / 4 = 2.75 -> 3
      expect(estimateTokens('')).toBe(0);
      expect(estimateTokens('a'.repeat(4000))).toBe(1000);
    });
  });

  describe('chunkDiff', () => {
    function makeFile(
      filePath: string,
      charCount: number,
      changeType: 'modified' | 'added' | 'deleted' | 'binary' = 'modified',
    ): ParsedFile {
      return {
        filePath,
        changeType,
        originalLines: [],
        modifiedLines: [],
        modifiedLineMap: {},
        hunks: [
          {
            originalStart: 1,
            originalCount: 1,
            modifiedStart: 1,
            modifiedCount: 1,
            lines: [
              {
                type: 'context',
                content: 'x'.repeat(charCount),
                originalLineNum: 1,
                modifiedLineNum: 1,
              },
            ],
          },
        ],
      };
    }

    it('should put everything into one chunk when total tokens are under limit', () => {
      const files = [makeFile('a.ts', 400), makeFile('b.ts', 400)]; // ~200 tokens
      const chunks = chunkDiff(files, 1000);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toContain('=== File: a.ts');
      expect(chunks[0]).toContain('=== File: b.ts');
    });

    it('should split into multiple chunks when total exceeds maxTokens', () => {
      const files = [
        makeFile('a.ts', 3200), // ~800 tokens
        makeFile('b.ts', 3200), // ~800 tokens
      ];
      const chunks = chunkDiff(files, 1000); // Max 1000 tokens per chunk -> they must split
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toContain('=== File: a.ts');
      expect(chunks[1]).toContain('=== File: b.ts');
    });

    it('should skip binary files', () => {
      const files = [
        makeFile('a.ts', 400),
        makeFile('img.png', 400, 'binary'),
      ];
      const chunks = chunkDiff(files, 1000);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toContain('=== File: a.ts');
      expect(chunks[0]).not.toContain('img.png');
    });

    it('should handle single file exceeding maxTokens as its own oversized chunk', () => {
      const files = [
        makeFile('huge.ts', 8000), // ~2000 tokens
      ];
      const chunks = chunkDiff(files, 1000);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toContain('=== File: huge.ts');
    });
  });

  describe('validateSuggestion', () => {
    function makeSampleParsedFiles(): ParsedFile[] {
      return [
        {
          filePath: 'src/auth.ts',
          changeType: 'modified',
          originalLines: Array.from({ length: 20 }, (_, i) => `line ${i + 1}`),
          modifiedLines: Array.from({ length: 21 }, (_, i) => `line ${i + 1}`),
          modifiedLineMap: {},
          hunks: [
            {
              originalStart: 5,
              originalCount: 2,
              modifiedStart: 5,
              modifiedCount: 3,
              lines: [
                {
                  type: 'context',
                  content: 'line 5',
                  originalLineNum: 5,
                  modifiedLineNum: 5,
                },
                {
                  type: 'deleted',
                  content: 'line 6 deleted',
                  originalLineNum: 6,
                },
                {
                  type: 'added',
                  content: 'line 6 added',
                  modifiedLineNum: 6,
                },
                {
                  type: 'added',
                  content: 'line 7 added',
                  modifiedLineNum: 7,
                },
              ],
            },
          ],
        },
      ];
    }

    it('should return false for line numbers out of bounds', () => {
      const parsedFiles = makeSampleParsedFiles();
      const s: RawSuggestion = {
        file: 'src/auth.ts',
        line: 999,
        severity: 'bug',
        body: 'Possible null pointer dereference',
      };
      expect(validateSuggestion(s, parsedFiles)).toBe(false);
    });

    it('should return false for skipped paths (e.g. node_modules)', () => {
      const parsedFiles = makeSampleParsedFiles();
      const s: RawSuggestion = {
        file: 'node_modules/lodash/index.js',
        line: 1,
        severity: 'style',
        body: 'Check style rules',
      };
      expect(validateSuggestion(s, parsedFiles)).toBe(false);
    });

    it('should return false for files not in parsed files list', () => {
      const parsedFiles = makeSampleParsedFiles();
      const s: RawSuggestion = {
        file: 'src/nonexistent.ts',
        line: 5,
        severity: 'bug',
        body: 'Bug in nonexistent file',
      };
      expect(validateSuggestion(s, parsedFiles)).toBe(false);
    });

    it('should return false for suggestions on lines not modified (e.g. unchanged line far away or deleted)', () => {
      const parsedFiles = makeSampleParsedFiles();

      // Line 15 is context but not in any hunk
      const s1: RawSuggestion = {
        file: 'src/auth.ts',
        line: 15,
        severity: 'style',
        body: 'Fix style spacing',
      };
      expect(validateSuggestion(s1, parsedFiles)).toBe(false);
    });

    it('should return true for valid suggestions on added or context lines within hunks', () => {
      const parsedFiles = makeSampleParsedFiles();

      // Line 6 was added
      const s: RawSuggestion = {
        file: 'src/auth.ts',
        line: 6,
        severity: 'bug',
        body: 'Null check is missing here, please add it.',
      };
      expect(validateSuggestion(s, parsedFiles)).toBe(true);
    });

    it('should return false for comments with very short body length', () => {
      const parsedFiles = makeSampleParsedFiles();
      const s: RawSuggestion = {
        file: 'src/auth.ts',
        line: 6,
        severity: 'bug',
        body: 'short',
      };
      expect(validateSuggestion(s, parsedFiles)).toBe(false);
    });
  });

  describe('deduplicateSuggestions', () => {
    it('should remove exact duplicate suggestions with same file, line, and severity', () => {
      const s1: RawSuggestion = {
        file: 'src/auth.ts',
        line: 10,
        severity: 'bug',
        body: 'Body 1',
      };
      const s2: RawSuggestion = {
        file: 'src/auth.ts',
        line: 10,
        severity: 'bug',
        body: 'Body 2',
      };

      const result = deduplicateSuggestions([s1, s2]);
      expect(result).toHaveLength(1);
      expect(result[0].body).toBe('Body 1'); // Keeps first seen suggestion
      expect(result[0].dedupeKey).toBe('src/auth.ts:10:bug');
    });

    it('should keep suggestions on the same line if severities differ', () => {
      const s1: RawSuggestion = {
        file: 'src/auth.ts',
        line: 10,
        severity: 'bug',
        body: 'Body 1',
      };
      const s2: RawSuggestion = {
        file: 'src/auth.ts',
        line: 10,
        severity: 'style',
        body: 'Body 2',
      };

      const result = deduplicateSuggestions([s1, s2]);
      expect(result).toHaveLength(2);
    });
  });
});
