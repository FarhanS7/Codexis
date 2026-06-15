import { Injectable, Logger } from '@nestjs/common';
import { ParsedFile, Hunk, HunkLine, DiffChangeType } from './diff.types';

@Injectable()
export class DiffParserService {
  private readonly logger = new Logger(DiffParserService.name);

  /**
   * Parse a raw unified diff string into structured ParsedFile[].
   *
   * Algorithm: Linear scan state machine — O(n) single pass, no backtracking.
   * All state is LOCAL to this method (thread-safe for concurrent NestJS requests).
   *
   * @param rawDiff - Raw unified diff string from GitHub API
   *                  (Accept: application/vnd.github.v3.diff)
   * @returns Array of parsed files with hunks, originalLines placeholder, and modifiedLineMap
   */
  parse(rawDiff: string): ParsedFile[] {
    const files: ParsedFile[] = [];
    const lines = rawDiff.split('\n');

    // ── Local state — ALL mutable state is scoped to this call ────────────
    // This is intentional: DiffParserService is a NestJS singleton.
    // Class-level state would create race conditions under concurrent requests.
    let currentFile: Partial<ParsedFile> | null = null;
    let currentHunk: Partial<Hunk> | null = null;
    let originalLineCounter = 0; // 1-indexed, tracks position in original file
    let modifiedLineCounter = 0; // 1-indexed, tracks position in modified file

    for (const line of lines) {
      // ─── NEW FILE ─────────────────────────────────────────────────────────
      if (line.startsWith('diff --git ')) {
        // Emit the previous file before starting a new one
        if (currentFile) {
          if (currentHunk) {
            currentFile.hunks!.push(this.finalizeHunk(currentHunk));
            currentHunk = null;
          }
          files.push(this.finalizeFile(currentFile));
        }

        // Initialize a new file — changeType defaults to 'modified',
        // overridden below if metadata lines indicate 'added', 'deleted', etc.
        currentFile = {
          hunks: [],
          originalLines: [],   // Populated in getFullParsedDiff() via getFileContent()
          modifiedLines: [],   // Populated in getFullParsedDiff() via reconstructModifiedFile()
          modifiedLineMap: {},
          changeType: 'modified',
        };
        originalLineCounter = 0;
        modifiedLineCounter = 0;
        continue;
      }

      // Skip any lines that appear before the first "diff --git" header
      // (e.g., git metadata lines at the very top of the diff output)
      if (!currentFile) continue;

      // ─── FILE METADATA ────────────────────────────────────────────────────
      if (line.startsWith('--- a/')) {
        // For deleted files, the "--- a/" line has the only meaningful file path.
        // Set it on currentFile now; "+++ b/" will overwrite if the file is modified.
        currentFile.filePath = line.slice(6); // Remove "--- a/"
        continue;
      }

      if (line.startsWith('+++ b/')) {
        // Canonical current file path — strip the "+++ b/" prefix (6 chars)
        currentFile.filePath = line.slice(6);
        continue;
      }

      if (line.startsWith('+++ /dev/null')) {
        // Deleted file — the modified side is /dev/null (file was removed)
        currentFile.changeType = 'deleted';
        continue;
      }

      if (line.startsWith('--- /dev/null')) {
        // New file — the original side is /dev/null (file was created)
        currentFile.changeType = 'added';
        continue;
      }

      if (line.startsWith('rename from ')) {
        // Rename metadata: "rename from old/path.ts" — strip 12 chars
        currentFile.oldFilePath = line.slice(12);
        currentFile.changeType = 'renamed';
        continue;
      }

      if (line.startsWith('rename to ')) {
        // Rename destination: "rename to new/path.ts" — strip 10 chars
        currentFile.filePath = line.slice(10);
        continue;
      }

      if (line.startsWith('Binary files')) {
        // Binary file — no text diff possible, mark and skip all hunk processing
        currentFile.changeType = 'binary';
        continue;
      }

      // Skip any remaining lines for binary files (shouldn't be any, but defensive)
      if (currentFile.changeType === 'binary') continue;

      // Skip index lines ("index abc123..def456 100644") — no useful data for us
      if (line.startsWith('index ')) continue;

      // Skip "new file mode" and "deleted file mode" git metadata lines
      if (line.startsWith('new file mode') || line.startsWith('deleted file mode')) continue;

      // Skip "similarity index" lines for renames
      if (line.startsWith('similarity index')) continue;

      // ─── HUNK HEADER ──────────────────────────────────────────────────────
      if (line.startsWith('@@ ')) {
        // Emit the previous hunk if we have one
        if (currentHunk) {
          currentFile.hunks!.push(this.finalizeHunk(currentHunk));
        }

        const parsed = this.parseHunkHeader(line);
        currentHunk = {
          ...parsed,
          lines: [],
        };

        // Reset line counters to the start positions declared in the hunk header
        // These are 1-indexed in the diff format
        originalLineCounter = parsed.originalStart;
        modifiedLineCounter = parsed.modifiedStart;
        continue;
      }

      // Skip hunk body lines if we're not inside a hunk
      // (e.g., extra metadata lines between the file header and first @@)
      if (!currentHunk) continue;

      // ─── HUNK BODY ────────────────────────────────────────────────────────
      // IMPORTANT: Check '+++' and '---' BEFORE '+' and '-' to avoid misclassifying
      // file metadata lines that appear before @@ as hunk body lines.

      if (line.startsWith('+')) {
        // Added line — only in modified file, not in original
        const hunkLine: HunkLine = {
          type: 'added',
          content: line.slice(1), // Remove the '+' prefix
          modifiedLineNum: modifiedLineCounter,
        };
        currentHunk.lines!.push(hunkLine);

        // Record in modifiedLineMap — added lines appear in Monaco's modified model
        currentFile.modifiedLineMap![modifiedLineCounter] = modifiedLineCounter;
        modifiedLineCounter++;
        continue;
      }

      if (line.startsWith('-')) {
        // Deleted line — only in original file, not in modified
        currentHunk.lines!.push({
          type: 'deleted',
          content: line.slice(1), // Remove the '-' prefix
          originalLineNum: originalLineCounter,
        });
        originalLineCounter++;
        continue;
      }

      // Context line: space prefix OR empty string (git uses empty for blank context lines)
      if (line.startsWith(' ') || line === '') {
        const hunkLine: HunkLine = {
          type: 'context',
          content: line.startsWith(' ') ? line.slice(1) : '', // Remove space prefix if present
          originalLineNum: originalLineCounter,
          modifiedLineNum: modifiedLineCounter,
        };
        currentHunk.lines!.push(hunkLine);

        // Context lines appear in BOTH original and modified — record in map for Monaco
        currentFile.modifiedLineMap![modifiedLineCounter] = modifiedLineCounter;
        originalLineCounter++;
        modifiedLineCounter++;
        continue;
      }

      // Git annotation: "\ No newline at end of file"
      // This is a metadata comment — skip it, it's not an actual code line
      if (line === '\\ No newline at end of file') continue;
    }

    // Flush the last file (the loop ends without a "diff --git" to trigger emission)
    if (currentFile) {
      if (currentHunk) {
        currentFile.hunks!.push(this.finalizeHunk(currentHunk));
      }
      files.push(this.finalizeFile(currentFile));
    }

    this.logger.debug(`Parsed ${files.length} files from diff`);
    return files;
  }

  /**
   * Apply hunk patches to original file content to reconstruct the full modified file.
   *
   * Algorithm: Two-pointer — originalPtr walks originalLines[], result[] accumulates output.
   * Time: O(n) where n = lines in original file. Space: O(n) for result array.
   *
   * @param originalContent - Full original file content as a single string
   * @param hunks - Parsed hunks from DiffParserService.parse()
   * @returns Array of lines forming the complete modified file
   */
  reconstructModifiedFile(originalContent: string, hunks: Hunk[]): string[] {
    // Edge case: new file (originalContent is '') or file with no hunks
    if (!originalContent && hunks.length === 0) return [];

    // Split on '\n' — this gives us the original lines as an indexable array.
    const originalLines = originalContent ? originalContent.split('\n') : [];
    const result: string[] = [];

    // Two-pointer:
    //   originalPtr — 0-indexed pointer walking originalLines[]
    //   result      — accumulates the complete modified file content
    let originalPtr = 0;

    for (const hunk of hunks) {
      // ── Step 1: Copy unchanged lines BEFORE this hunk ────────────────────
      const hunkStartIndex = hunk.originalStart - 1;
      while (originalPtr < hunkStartIndex && originalPtr < originalLines.length) {
        result.push(originalLines[originalPtr]);
        originalPtr++;
      }

      // ── Step 2: Apply the hunk ────────────────────────────────────────────
      for (const line of hunk.lines) {
        switch (line.type) {
          case 'deleted':
            originalPtr++;
            break;

          case 'added':
            result.push(line.content);
            break;

          case 'context':
            result.push(line.content);
            originalPtr++;
            break;
        }
      }
    }

    // ── Step 3: Copy the unchanged tail after the last hunk ────────────────
    while (originalPtr < originalLines.length) {
      result.push(originalLines[originalPtr]);
      originalPtr++;
    }

    return result;
  }

  /**
   * Parse a unified diff hunk header line.
   *
   * Format: @@ -originalStart,originalCount +modifiedStart,modifiedCount @@ [optional context]
   * Example: "@@ -10,7 +10,9 @@ export class AuthService {"
   */
  private parseHunkHeader(
    line: string,
  ): Pick<Hunk, 'originalStart' | 'originalCount' | 'modifiedStart' | 'modifiedCount'> {
    const match = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);

    if (!match) {
      throw new Error(`DiffParserService: invalid hunk header — "${line}"`);
    }

    return {
      originalStart: parseInt(match[1], 10),
      originalCount: match[2] !== undefined ? parseInt(match[2], 10) : 1,
      modifiedStart: parseInt(match[3], 10),
      modifiedCount: match[4] !== undefined ? parseInt(match[4], 10) : 1,
    };
  }

  private finalizeHunk(partial: Partial<Hunk>): Hunk {
    return partial as Hunk;
  }

  private finalizeFile(partial: Partial<ParsedFile>): ParsedFile {
    return {
      filePath: partial.filePath ?? 'unknown',
      oldFilePath: partial.oldFilePath,
      changeType: partial.changeType ?? 'modified',
      originalLines: partial.originalLines ?? [],
      modifiedLines: partial.modifiedLines ?? [],
      hunks: partial.hunks ?? [],
      modifiedLineMap: partial.modifiedLineMap ?? {},
    };
  }
}
