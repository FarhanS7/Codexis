export interface HunkLine {
  type: 'addition' | 'deletion' | 'normal';
  content: string;
  ln1?: number;
  ln2?: number;
}

export interface Hunk {
  content: string;
  lines: HunkLine[];
}

export interface ParsedFile {
  from?: string;
  to?: string;
  hunks: Hunk[];
}

export interface ParsedDiff {
  files: ParsedFile[];
}
