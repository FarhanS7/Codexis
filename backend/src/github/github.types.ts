export interface Repo {
  id: number;
  name: string;
  fullName: string;       // "owner/repo" — e.g. "facebook/react"
  owner: string;          // "facebook"
  description: string | null;
  language: string | null;
  isPrivate: boolean;
  updatedAt: string;      // ISO 8601 date string of last push
  openIssuesCount: number;
  htmlUrl: string;        // URL to the repo on github.com
}

export interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  private: boolean;
  pushed_at: string;
  open_issues_count: number;
  html_url: string;
}

export interface PR {
  id: number;
  number: number;           // PR number within the repo (e.g., #42)
  title: string;
  state: 'open' | 'closed';
  author: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  htmlUrl: string;          // URL to the PR on github.com
  changedFiles: number;
  additions: number;
  deletions: number;
  head: {
    sha: string;            // Commit SHA of the branch being merged (HEAD)
    ref: string;            // Branch name (e.g., "feature/my-feature")
  };
  base: {
    sha: string;            // Commit SHA of the target branch
    ref: string;            // Target branch name (e.g., "main")
  };
}

export interface GitHubPRResponse {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  html_url: string;
  changed_files?: number;
  additions?: number;
  deletions?: number;
  head: { sha: string; ref: string };
  base: { sha: string; ref: string };
}

export interface GithubReviewComment {
  path: string;
  line: number;
  body: string;
  side?: 'RIGHT' | 'LEFT';
}

export interface GithubCreateReviewPayload {
  commit_id: string;
  body: string;
  event: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES';
  comments: GithubReviewComment[];
}

