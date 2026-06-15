export interface Repo {
  id: number;
  name: string;
  fullName: string;      // "owner/repo"
  owner: string;         // GitHub username of the repo owner
  description: string | null;
  language: string | null;
  isPrivate: boolean;
  updatedAt: string;     // ISO 8601
  openIssuesCount: number;
  htmlUrl: string;       // GitHub web URL
}

export interface PR {
  id: number;
  number: number;        // PR number within the repo
  title: string;
  state: 'open' | 'closed';
  author: {
    login: string;       // GitHub username
    avatarUrl: string;   // GitHub CDN URL
  };
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
  htmlUrl: string;       // GitHub web URL for the PR
  changedFiles: number;
  additions: number;
  deletions: number;
  head: {
    sha: string;         // Commit SHA for the PR branch
    ref: string;         // Branch name
  };
  base: {
    sha: string;         // Commit SHA for the target branch
    ref: string;         // Branch name
  };
}

export type DiffChangeType = 'modified' | 'added' | 'deleted' | 'renamed' | 'binary';

export interface HunkLine {
  type: 'context' | 'added' | 'deleted';
  content: string;
  originalLineNum?: number;
  modifiedLineNum?: number;
}

export interface Hunk {
  originalStart: number;
  originalCount: number;
  modifiedStart: number;
  modifiedCount: number;
  lines: HunkLine[];
}

export interface ParsedFile {
  filePath: string;
  oldFilePath?: string;
  changeType: DiffChangeType;
  originalLines: string[];
  modifiedLines: string[];
  hunks: Hunk[];
  modifiedLineMap: Record<number, number>;
}

export interface ParsedDiff {
  files: ParsedFile[];
  prNumber: number;
  headSha: string;
  baseSha: string;
}

