import { Observable } from 'rxjs';
import { ParsedFile } from '../github/diff.types';
import { RawSuggestion, ValidatedSuggestion } from './review.types';

const SKIP_PATHS = ['node_modules/', 'dist/', '.generated.', '.min.js', 'vendor/'];

/**
 * Estimates token count using the ~4 chars/token heuristic.
 * Accurate within ±15% for English code/prose.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * human-readable diff text format optimized for LLM prompting
 */
function formatFileForPrompt(file: ParsedFile): string {
  const header = `=== File: ${file.filePath} (${file.changeType})${
    file.oldFilePath ? ` renamed from ${file.oldFilePath}` : ''
  } ===\n`;

  const hunkText = file.hunks
    .map((hunk) => {
      const hunkHeader = `@@ -${hunk.originalStart},${hunk.originalCount} +${hunk.modifiedStart},${hunk.modifiedCount} @@\n`;
      const linesText = hunk.lines
        .map((l) => {
          if (l.type === 'added') return `+ ${l.content}`;
          if (l.type === 'deleted') return `- ${l.content}`;
          return `  ${l.content}`;
        })
        .join('\n');
      return hunkHeader + linesText;
    })
    .join('\n');

  return header + hunkText;
}

/**
 * Greedy bin packing: group parsed files into chunks that fit within maxTokens.
 * Each chunk is a string of concatenated file diffs.
 */
export function chunkDiff(
  parsedFiles: ParsedFile[],
  maxTokens = 6000,
): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const file of parsedFiles) {
    if (file.changeType === 'binary') continue; // skip binary files

    const fileContent = formatFileForPrompt(file);
    const fileTokens = estimateTokens(fileContent);

    if (fileTokens > maxTokens) {
      // Single file exceeds max — send as its own oversized chunk (LLM will handle/truncate)
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentTokens = 0;
      }
      chunks.push(fileContent.trim());
      continue;
    }

    if (currentTokens + fileTokens > maxTokens) {
      // Current chunk would overflow — seal it, start new
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = fileContent;
      currentTokens = fileTokens;
    } else {
      currentChunk += '\n\n' + fileContent;
      currentTokens += fileTokens;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Guards against LLM hallucinations — line numbers that don't exist,
 * files not in the diff, or deleted lines.
 */
export function validateSuggestion(
  s: RawSuggestion,
  parsedFiles: ParsedFile[],
): boolean {
  if (!s.file || typeof s.line !== 'number') return false;

  // Rule 1: Skip auto-generated, library, or lock files
  if (SKIP_PATHS.some((p) => s.file.includes(p))) return false;

  // Normalize path (remove leading ./ if LLM adds it)
  const normalizedFile = s.file.replace(/^\.\//, '');

  // Rule 2: File must exist in the parsed diff
  const file = parsedFiles.find(
    (f) => f.filePath === normalizedFile || f.oldFilePath === normalizedFile,
  );
  if (!file) return false;

  // Rule 3: Line number must be within bounds of modified file
  if (s.line < 1 || s.line > file.modifiedLines.length) return false;

  // Rule 4: Line must be a changed or context line (not deleted)
  // Deleted lines don't exist in the modified file — suggestions on them are hallucinations
  const lineIsModified = file.hunks.some((hunk) =>
    hunk.lines.some((l) => l.modifiedLineNum === s.line && l.type !== 'deleted'),
  );
  if (!lineIsModified) return false;

  // Rule 5: Body must not be empty and should have minimum meaningful content
  if (!s.body || s.body.trim().length < 10) return false;

  return true;
}

/**
 * Removes duplicate suggestions using a HashSet on a composite key.
 */
export function deduplicateSuggestions(
  all: RawSuggestion[],
): ValidatedSuggestion[] {
  const seen = new Set<string>();
  const result: ValidatedSuggestion[] = [];

  for (const s of all) {
    const key = `${s.file}:${s.line}:${s.severity}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...s, dedupeKey: key });
  }

  return result;
}

/**
 * Bridges AsyncGenerator (what Vercel AI SDK returns) to
 * RxJS Observable (what NestJS @Sse() expects).
 */
export function asyncGeneratorToObservable<T>(
  gen: AsyncGenerator<T>,
): Observable<T> {
  return new Observable<T>((subscriber) => {
    (async () => {
      try {
        for await (const value of gen) {
          if (subscriber.closed) break;
          subscriber.next(value);
        }
        subscriber.complete();
      } catch (err) {
        subscriber.error(err);
      } finally {
        await gen.return(undefined); // cleanup — release the AbortController
      }
    })();
  });
}
