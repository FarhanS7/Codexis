import { DiffParserService } from './diff-parser.service';
import { Hunk } from './diff.types';
import {
  MODIFIED_FILE_DIFF,
  NEW_FILE_DIFF,
  DELETED_FILE_DIFF,
  RENAMED_FILE_DIFF,
  BINARY_FILE_DIFF,
  MULTI_HUNK_DIFF,
  generateLargeDiff,
} from './__fixtures__/diffs';

describe('DiffParserService', () => {
  let parser: DiffParserService;

  beforeEach(() => {
    parser = new DiffParserService();
  });

  // ── parse() tests ─────────────────────────────────────────────────────────

  describe('parse()', () => {
    it('parses a modified file: correct filePath, changeType, hunks, and line types', () => {
      const result = parser.parse(MODIFIED_FILE_DIFF);

      expect(result).toHaveLength(1);
      expect(result[0].filePath).toBe('src/auth.ts');
      expect(result[0].changeType).toBe('modified');
      expect(result[0].hunks).toHaveLength(1);

      const lines = result[0].hunks[0].lines;
      const deletedLines = lines.filter((l) => l.type === 'deleted');
      const addedLines = lines.filter((l) => l.type === 'added');
      const contextLines = lines.filter((l) => l.type === 'context');

      expect(deletedLines).toHaveLength(1);
      expect(deletedLines[0].content).toContain('OldService');

      expect(addedLines).toHaveLength(2);
      expect(addedLines[0].content).toContain('NewService');
      expect(addedLines[1].content).toContain('AnotherService');

      expect(contextLines.length).toBeGreaterThan(0);
    });

    it('parses a modified file: hunk header numbers are correct', () => {
      const result = parser.parse(MODIFIED_FILE_DIFF);
      const hunk = result[0].hunks[0];

      expect(hunk.originalStart).toBe(10);
      expect(hunk.originalCount).toBe(7);
      expect(hunk.modifiedStart).toBe(10);
      expect(hunk.modifiedCount).toBe(9);
    });

    it('parses a modified file: modifiedLineMap contains entries for added and context lines', () => {
      const result = parser.parse(MODIFIED_FILE_DIFF);
      const map = result[0].modifiedLineMap;

      expect(Object.keys(map).length).toBeGreaterThan(0);

      // Verify each line's mapping properties
      const hunkLines = result[0].hunks[0].lines;
      hunkLines.forEach((l) => {
        if (l.type === 'deleted') {
          expect(l.modifiedLineNum).toBeUndefined();
        } else {
          expect(l.modifiedLineNum).toBeDefined();
          expect(map[l.modifiedLineNum!]).toBe(l.modifiedLineNum);
        }
      });
    });


    it('parses a new file: changeType=added, all hunk lines are added', () => {
      const result = parser.parse(NEW_FILE_DIFF);

      expect(result).toHaveLength(1);
      expect(result[0].changeType).toBe('added');
      expect(result[0].filePath).toBe('src/new-feature.ts');
      expect(result[0].hunks).toHaveLength(1);

      const lines = result[0].hunks[0].lines;
      expect(lines).toHaveLength(3);
      expect(lines.every((l) => l.type === 'added')).toBe(true);
    });

    it('parses a new file: hunk header @@ -0,0 +1,3 @@ is parsed correctly', () => {
      const result = parser.parse(NEW_FILE_DIFF);
      const hunk = result[0].hunks[0];

      expect(hunk.originalStart).toBe(0);
      expect(hunk.originalCount).toBe(0);
      expect(hunk.modifiedStart).toBe(1);
      expect(hunk.modifiedCount).toBe(3);
    });

    it('parses a deleted file: changeType=deleted, all hunk lines are deleted', () => {
      const result = parser.parse(DELETED_FILE_DIFF);

      expect(result).toHaveLength(1);
      expect(result[0].changeType).toBe('deleted');
      expect(result[0].filePath).toBe('src/old-file.ts');
      expect(result[0].hunks).toHaveLength(1);

      const lines = result[0].hunks[0].lines;
      expect(lines).toHaveLength(3);
      expect(lines.every((l) => l.type === 'deleted')).toBe(true);
    });

    it('parses a renamed file: changeType=renamed, filePath and oldFilePath both set', () => {
      const result = parser.parse(RENAMED_FILE_DIFF);

      expect(result).toHaveLength(1);
      expect(result[0].changeType).toBe('renamed');
      expect(result[0].filePath).toBe('src/authentication.ts');
      expect(result[0].oldFilePath).toBe('src/auth.ts');

      expect(result[0].hunks).toHaveLength(1);
      const deletedLines = result[0].hunks[0].lines.filter((l) => l.type === 'deleted');
      expect(deletedLines[0].content).toContain('export class Auth');
    });

    it('handles binary files: changeType=binary, hunks=[], no crash', () => {
      const result = parser.parse(BINARY_FILE_DIFF);

      expect(result).toHaveLength(1);
      expect(result[0].changeType).toBe('binary');
      expect(result[0].hunks).toHaveLength(0);
      expect(result[0].originalLines).toEqual([]);
      expect(result[0].modifiedLines).toEqual([]);
    });

    it('parses a multi-hunk diff: both hunks captured with correct line numbers', () => {
      const result = parser.parse(MULTI_HUNK_DIFF);

      expect(result).toHaveLength(1);
      expect(result[0].hunks).toHaveLength(2);

      const hunk1 = result[0].hunks[0];
      expect(hunk1.originalStart).toBe(1);
      expect(hunk1.modifiedStart).toBe(1);

      const hunk2 = result[0].hunks[1];
      expect(hunk2.originalStart).toBe(10);
      expect(hunk2.modifiedStart).toBe(10);
    });

    it('does not crash on an empty string input', () => {
      expect(() => parser.parse('')).not.toThrow();
      expect(parser.parse('')).toEqual([]);
    });

    it('returns the correct number of files for a multi-file diff', () => {
      const combinedDiff = MODIFIED_FILE_DIFF + '\n' + DELETED_FILE_DIFF;
      const result = parser.parse(combinedDiff);
      expect(result).toHaveLength(2);
    });
  });

  // ── reconstructModifiedFile() tests ─────────────────────────────────────────

  describe('reconstructModifiedFile()', () => {
    it('applies a hunk with delete + add + context correctly (two-pointer)', () => {
      const original = 'line1\nline2\nline3\nline4\nline5';
      const hunks: Hunk[] = [
        {
          originalStart: 2,
          originalCount: 2,
          modifiedStart: 2,
          modifiedCount: 2,
          lines: [
            { type: 'deleted', content: 'line2', originalLineNum: 2 },
            { type: 'added', content: 'line2-modified', modifiedLineNum: 2 },
            { type: 'context', content: 'line3', originalLineNum: 3, modifiedLineNum: 3 },
          ],
        },
      ];

      const result = parser.reconstructModifiedFile(original, hunks);
      expect(result).toEqual(['line1', 'line2-modified', 'line3', 'line4', 'line5']);
    });

    it('handles a new file (empty originalContent, all added lines)', () => {
      const hunks: Hunk[] = [
        {
          originalStart: 0,
          originalCount: 0,
          modifiedStart: 1,
          modifiedCount: 3,
          lines: [
            { type: 'added', content: 'export function newFeature() {', modifiedLineNum: 1 },
            { type: 'added', content: "  return 'hello';", modifiedLineNum: 2 },
            { type: 'added', content: '}', modifiedLineNum: 3 },
          ],
        },
      ];

      const result = parser.reconstructModifiedFile('', hunks);
      expect(result).toEqual([
        'export function newFeature() {',
        "  return 'hello';",
        '}',
      ]);
    });

    it('handles a deleted file (all deleted lines, result is empty)', () => {
      const original = 'line1\nline2\nline3';
      const hunks: Hunk[] = [
        {
          originalStart: 1,
          originalCount: 3,
          modifiedStart: 0,
          modifiedCount: 0,
          lines: [
            { type: 'deleted', content: 'line1', originalLineNum: 1 },
            { type: 'deleted', content: 'line2', originalLineNum: 2 },
            { type: 'deleted', content: 'line3', originalLineNum: 3 },
          ],
        },
      ];

      const result = parser.reconstructModifiedFile(original, hunks);
      expect(result).toEqual([]);
    });

    it('handles a hunk in the middle: copies pre-hunk and post-hunk lines correctly', () => {
      const lines = Array.from({ length: 10 }, (_, i) => `line${i + 1}`);
      const original = lines.join('\n');

      const hunks: Hunk[] = [
        {
          originalStart: 4,
          originalCount: 3,
          modifiedStart: 4,
          modifiedCount: 2,
          lines: [
            { type: 'deleted', content: 'line4', originalLineNum: 4 },
            { type: 'deleted', content: 'line5', originalLineNum: 5 },
            { type: 'added', content: 'line4-5-merged', modifiedLineNum: 4 },
            { type: 'context', content: 'line6', originalLineNum: 6, modifiedLineNum: 5 },
          ],
        },
      ];

      const result = parser.reconstructModifiedFile(original, hunks);
      expect(result).toEqual([
        'line1', 'line2', 'line3',           // Pre-hunk
        'line4-5-merged', 'line6',            // Modified hunk content
        'line7', 'line8', 'line9', 'line10', // Post-hunk tail
      ]);
    });

    it('handles two non-adjacent hunks: gap lines between hunks are copied from original', () => {
      const original = Array.from({ length: 20 }, (_, i) => `line${i + 1}`).join('\n');

      const hunks: Hunk[] = [
        {
          originalStart: 2,
          originalCount: 1,
          modifiedStart: 2,
          modifiedCount: 1,
          lines: [
            { type: 'deleted', content: 'line2', originalLineNum: 2 },
            { type: 'added', content: 'line2-new', modifiedLineNum: 2 },
          ],
        },
        {
          originalStart: 18,
          originalCount: 1,
          modifiedStart: 18,
          modifiedCount: 1,
          lines: [
            { type: 'deleted', content: 'line18', originalLineNum: 18 },
            { type: 'added', content: 'line18-new', modifiedLineNum: 18 },
          ],
        },
      ];

      const result = parser.reconstructModifiedFile(original, hunks);

      expect(result[1]).toBe('line2-new');
      expect(result[5]).toBe('line6');
      expect(result[10]).toBe('line11');
      expect(result[17]).toBe('line18-new');
      expect(result[18]).toBe('line19');
      expect(result[19]).toBe('line20');
    });

    it('returns [] for empty originalContent and empty hunks', () => {
      expect(parser.reconstructModifiedFile('', [])).toEqual([]);
    });
  });

  // ── Performance tests ─────────────────────────────────────────────────────

  describe('performance', () => {
    it('parses a 500-line diff in under 50ms (O(n) state machine benchmark)', () => {
      const largeDiff = generateLargeDiff(500);

      const start = Date.now();
      const result = parser.parse(largeDiff);
      const elapsed = Date.now() - start;

      expect(result).toHaveLength(1);
      expect(result[0].hunks).toHaveLength(1);
      expect(result[0].hunks[0].lines).toHaveLength(1000);

      expect(elapsed).toBeLessThan(50);
    });

    it('reconstructs a 500-line modified file in under 50ms (two-pointer benchmark)', () => {
      const originalContent = Array.from(
        { length: 500 },
        (_, i) => `const old${i} = ${i};`,
      ).join('\n');

      const hunks: Hunk[] = [
        {
          originalStart: 100,
          originalCount: 100,
          modifiedStart: 100,
          modifiedCount: 100,
          lines: Array.from({ length: 100 }, (_, i) => ({
            type: 'added' as const,
            content: `const new${i + 100} = ${i + 101};`,
            modifiedLineNum: 100 + i,
          })).concat(
            Array.from({ length: 100 }, (_, i) => ({
              type: 'deleted' as const,
              content: `const old${i + 100} = ${i + 100};`,
              originalLineNum: 100 + i,
            })),
          ),
        },
      ];

      const start = Date.now();
      const result = parser.reconstructModifiedFile(originalContent, hunks);
      const elapsed = Date.now() - start;

      expect(result).toHaveLength(500);
      expect(elapsed).toBeLessThan(50);
    });
  });
});
