// The type of change represented by a diff file entry.
// Union type (not enum) — serializes to JSON as a plain string.
export type DiffChangeType = 'modified' | 'added' | 'deleted' | 'renamed' | 'binary';

// A single line within a hunk
export interface HunkLine {
  type: 'context' | 'added' | 'deleted';
  content: string;            // Line content WITHOUT the +/-/space prefix character
  originalLineNum?: number;   // 1-indexed line number in the ORIGINAL file
                              // Populated for 'context' and 'deleted' lines
  modifiedLineNum?: number;   // 1-indexed line number in the MODIFIED file
                              // Populated for 'context' and 'added' lines
}

// A contiguous block of changed lines — corresponds to one @@ section in the diff
export interface Hunk {
  originalStart: number;   // From @@ -X,Y: first line of the range in the original file
  originalCount: number;   // From @@ -X,Y: number of lines from the original (Y)
  modifiedStart: number;   // From @@ +X,Y: first line of the range in the modified file
  modifiedCount: number;   // From @@ +X,Y: number of lines in the modified file (Y)
  lines: HunkLine[];       // All lines in this hunk: context + added + deleted
}

// A single changed file in the diff
export interface ParsedFile {
  filePath: string;           // Current file path (after rename — the "b/" path)
  oldFilePath?: string;       // Previous path — only set for 'renamed' files

  changeType: DiffChangeType;

  // Full reconstructed file content — required by Monaco DiffEditor.
  // Monaco needs TWO complete strings: original (left pane) and modified (right pane).
  // Libraries like parse-diff do NOT provide these — they are built in this task.
  originalLines: string[];    // Complete original file content, split on '\n'
  modifiedLines: string[];    // Complete modified file content, reconstructed via two-pointer

  hunks: Hunk[];              // All diff hunks for this file

  // Maps modified-file line numbers to Monaco model line numbers.
  // Built during parsing in the state machine (Sub-task 4.1.4).
  // Used in Task 6.1 to place AI suggestion decorations on the correct Monaco line.
  //
  // Key:   line number in the diff's modified-file view (from @@ +X notation)
  // Value: line number in Monaco's text model (1-indexed, accounts for hunk gaps)
  //
  // Record<number,number> NOT Map<number,number> — Maps don't serialize to JSON.
  // The frontend (Task 6.1) reconstructs: new Map(Object.entries(modifiedLineMap))
  modifiedLineMap: Record<number, number>;
}

// The full parsed diff response — returned by GET .../pulls/:prNumber/diff
export interface ParsedDiff {
  files: ParsedFile[];
  prNumber: number;
  headSha: string;    // PR's head commit SHA — used as cache key and for posting GitHub review comments
  baseSha: string;    // PR's base commit SHA — used to fetch originalLines content
}
