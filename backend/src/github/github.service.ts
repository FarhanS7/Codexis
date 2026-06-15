/**
 * GithubService — wraps GitHub REST API with TTL caching.
 *
 * CACHE KEY CONVENTION:
 *   All keys are prefixed with the user's internal Postgres UUID to prevent
 *   cross-user cache leakage. Use the userId (UUID), not the GitHub login.
 *
 *   {userId}:repos                      → Repo[]   (getRepos)
 *   {userId}:{owner}/{repo}/pulls       → PR[]     (getPullRequests)
 *   {userId}:{owner}/{repo}/pulls/{n}   → PR       (getPRMetadata)
 *
 * RATE LIMIT TRACKING:
 *   rateLimitRemaining and rateLimitReset are updated from response headers
 *   on every successful GitHub API call. A warning is logged at < 1000 remaining.
 *
 * TOKEN HANDLING:
 *   This service accepts a plain accessToken: string. It does NOT read from
 *   the DB or decrypt tokens. The controller is responsible for token retrieval
 *   via AuthService.getDecryptedAccessToken(). This keeps GithubService
 *   independently testable with any token string.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { CacheService } from './cache.service';
import { Repo, GitHubRepoResponse, PR, GitHubPRResponse } from './github.types';
import { ParsedDiff } from './diff.types';
import { DiffParserService } from './diff-parser.service';

// Single place to tune the cache TTL
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Rate limit tracking constants
const RATE_LIMIT_WARNING_THRESHOLD = 1000; // Warn when < 20% of 5000/hour remains

interface GitHubErrorResponse {
  message: string;
  documentation_url?: string;
  errors?: Array<{ resource: string; field: string; code: string }>;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  // Rate limit tracking
  private rateLimitRemaining = 5000;
  private rateLimitReset = 0; // Unix timestamp (seconds since epoch)

  constructor(
    private readonly http: HttpService,
    private readonly cache: CacheService,
    private readonly diffParser: DiffParserService,
  ) {
    // ── Request Interceptor ─────────────────────────────────────────────
    this.http.axiosRef.interceptors.request.use((config) => {
      const token = config.headers?.['x-github-token'];
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        delete config.headers['x-github-token'];
      }
      return config;
    });

    // ── Response Interceptor ────────────────────────────────────────────
    this.http.axiosRef.interceptors.response.use(
      (response) => {
        // Track rate limit on every successful response
        const remaining = response.headers['x-ratelimit-remaining'];
        const reset = response.headers['x-ratelimit-reset'];

        if (remaining !== undefined) {
          this.rateLimitRemaining = parseInt(remaining, 10);
          this.rateLimitReset = reset ? parseInt(reset, 10) : 0;

          // Warn at 20% of 5000/hour = 1000 remaining
          if (this.rateLimitRemaining < RATE_LIMIT_WARNING_THRESHOLD) {
            const resetTime = new Date(
              this.rateLimitReset * 1000,
            ).toISOString();
            this.logger.warn(
              `GitHub rate limit low: ${this.rateLimitRemaining} remaining. ` +
                `Resets at ${resetTime}`,
            );
          }
        }

        return response;
      },
      (error: AxiosError<GitHubErrorResponse>) => {
        return Promise.reject(this.mapGithubError(error));
      },
    );
  }

  // Maps GitHub HTTP status codes to NestJS exceptions.
  private mapGithubError(error: AxiosError<GitHubErrorResponse>): never {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ?? error.message ?? 'Unknown GitHub error';

    // Log server-side with full context — never expose the token
    this.logger.error(
      `GitHub API error — status: ${status ?? 'N/A'}, ` +
        `url: ${error.config?.url ?? 'unknown'}, ` +
        `message: ${message}`,
    );

    switch (status) {
      case 401:
        throw new UnauthorizedException(
          `GitHub API: ${message}. ` +
            'Your GitHub session may have expired — please log in again.',
        );
      case 403:
        throw new ForbiddenException(
          `GitHub API: ${message}. ` +
            'Ensure the GitHub OAuth app has the required repo scope.',
        );
      case 404:
        throw new NotFoundException(`GitHub API: ${message}`);
      case 422:
        throw new BadRequestException(
          `GitHub API validation error: ${message}`,
        );
      case 429:
        // Include reset time in the error message so clients know when to retry
        const resetAt = error.response?.headers?.['x-ratelimit-reset'];
        const resetMsg = resetAt
          ? ` Rate limit resets at ${new Date(parseInt(resetAt, 10) * 1000).toISOString()}.`
          : '';
        throw new HttpException(
          `GitHub API rate limit exceeded.${resetMsg}`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      default:
        throw new InternalServerErrorException(
          `GitHub API error (${status ?? 'unknown'}): ${message}`,
        );
    }
  }

  // Expose rate limit state for health endpoint (Task 8.1)
  getRateLimitStatus(): { remaining: number; resetAt: string } {
    return {
      remaining: this.rateLimitRemaining,
      resetAt: new Date(this.rateLimitReset * 1000).toISOString(),
    };
  }

  async getRepos(userId: string, accessToken: string): Promise<Repo[]> {
    const cacheKey = `${userId}:repos`;
    const cached = this.cache.get<Repo[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey} — fetching from GitHub`);

    const response = await firstValueFrom(
      this.http.get<GitHubRepoResponse[]>('/user/repos', {
        headers: { 'x-github-token': accessToken },
        params: {
          per_page: 50,
          sort: 'pushed',   // Most recently pushed repos first
          type: 'all',      // Owner + collaborator + organization repos
        },
      }),
    );

    const repos = response.data.map((raw) => this.mapRepo(raw));
    this.cache.set(cacheKey, repos, CACHE_TTL_MS);
    return repos;
  }

  private mapRepo(raw: GitHubRepoResponse): Repo {
    return {
      id: raw.id,
      name: raw.name,
      fullName: raw.full_name,
      owner: raw.owner.login,
      description: raw.description,
      language: raw.language,
      isPrivate: raw.private,
      updatedAt: raw.pushed_at,
      openIssuesCount: raw.open_issues_count,
      htmlUrl: raw.html_url,
    };
  }

  async getPullRequests(
    userId: string,
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<PR[]> {
    const cacheKey = `${userId}:${owner}/${repo}/pulls`;
    const cached = this.cache.get<PR[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey} — fetching from GitHub`);

    const response = await firstValueFrom(
      this.http.get<GitHubPRResponse[]>(`/repos/${owner}/${repo}/pulls`, {
        headers: { 'x-github-token': accessToken },
        params: {
          state: 'open',
          per_page: 30,
          sort: 'updated',  // Most recently updated PRs first
        },
      }),
    );

    const prs = response.data.map((raw) => this.mapPR(raw));
    this.cache.set(cacheKey, prs, CACHE_TTL_MS);
    return prs;
  }

  async getPRMetadata(
    userId: string,
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<PR> {
    const cacheKey = `${userId}:${owner}/${repo}/pulls/${prNumber}`;
    const cached = this.cache.get<PR>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey} — fetching from GitHub`);

    const response = await firstValueFrom(
      this.http.get<GitHubPRResponse>(
        `/repos/${owner}/${repo}/pulls/${prNumber}`,
        {
          headers: { 'x-github-token': accessToken },
          // No params needed — single resource endpoint
        },
      ),
    );

    const pr = this.mapPR(response.data);
    this.cache.set(cacheKey, pr, CACHE_TTL_MS);
    return pr;
  }

  private mapPR(raw: GitHubPRResponse): PR {
    return {
      id: raw.id,
      number: raw.number,
      title: raw.title,
      state: raw.state,
      author: {
        login: raw.user.login,
        avatarUrl: raw.user.avatar_url,
      },
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      htmlUrl: raw.html_url,
      // List endpoint may not include diff stats — default to 0
      changedFiles: raw.changed_files ?? 0,
      additions: raw.additions ?? 0,
      deletions: raw.deletions ?? 0,
      head: { sha: raw.head.sha, ref: raw.head.ref },
      base: { sha: raw.base.sha, ref: raw.base.ref },
    };
  }

  /**
   * Fetch the raw unified diff string from GitHub.
   */
  async getPRDiff(
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<string> {
    const response = await firstValueFrom(
      this.http.get<string>(`/repos/${owner}/${repo}/pulls/${prNumber}`, {
        headers: {
          'x-github-token': accessToken,
          Accept: 'application/vnd.github.v3.diff', // Request raw unified diff format
        },
        responseType: 'text', // Instruct Axios not to attempt JSON parsing
      }),
    );
    return response.data;
  }

  /**
   * Fetch the raw text content of a file at a specific git ref (commit SHA).
   * Decodes from base64 and strips newlines inserted by GitHub.
   */
  async getFileContent(
    accessToken: string,
    owner: string,
    repo: string,
    filePath: string,
    ref: string,
  ): Promise<string> {
    const cacheKey = `content:${owner}/${repo}/${filePath}@${ref}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached !== null) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey} — fetching file contents`);

    try {
      const response = await firstValueFrom(
        this.http.get<{ content: string; encoding: string }>(
          `/repos/${owner}/${repo}/contents/${filePath}`,
          {
            headers: { 'x-github-token': accessToken },
            params: { ref },
          },
        ),
      );

      // Strip newlines and decode base64
      const base64Clean = response.data.content.replace(/\n/g, '');
      const content = Buffer.from(base64Clean, 'base64').toString('utf-8');

      // Cache it (5 min TTL)
      this.cache.set(cacheKey, content, 5 * 60 * 1000);
      return content;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        this.logger.debug(`File not found at ref ${ref}: ${filePath} — treating as new file`);
        return '';
      }
      throw error;
    }
  }

  /**
   * Fetch, parse, and reconstruct a PR diff as structured ParsedDiff JSON.
   */
  async getFullParsedDiff(
    userId: string,
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<ParsedDiff> {
    // 1. Get PR metadata for base/head SHAs
    const pr = await this.getPRMetadata(userId, accessToken, owner, repo, prNumber);
    const headSha = pr.head.sha;
    const baseSha = pr.base.sha;

    // 2. Check cache
    const cacheKey = `parseddiff:${owner}/${repo}/${headSha}`;
    const cached = this.cache.get<ParsedDiff>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: ${cacheKey} — fetching and parsing diff`);

    // 3. Fetch raw unified diff
    const rawDiff = await this.getPRDiff(accessToken, owner, repo, prNumber);

    // 4. Parse unified diff
    const parsedFiles = this.diffParser.parse(rawDiff);

    // 5 & 6. Fetch base contents and reconstruct modified file
    for (const file of parsedFiles) {
      if (file.changeType === 'binary') continue;

      if (file.changeType === 'deleted') {
        const originalContent = await this.getFileContent(
          accessToken,
          owner,
          repo,
          file.filePath,
          baseSha,
        );
        file.originalLines = originalContent ? originalContent.split('\n') : [];
        continue;
      }

      // Fetch base content (returns '' if file is new)
      const originalContent = await this.getFileContent(
        accessToken,
        owner,
        repo,
        file.filePath,
        baseSha,
      );
      file.originalLines = originalContent ? originalContent.split('\n') : [];

      // Reconstruct using two-pointer algorithm
      file.modifiedLines = this.diffParser.reconstructModifiedFile(
        originalContent,
        file.hunks,
      );
    }

    // 7. Cache & Return
    const result: ParsedDiff = {
      files: parsedFiles,
      prNumber,
      headSha,
      baseSha,
    };

    this.cache.set(cacheKey, result, 5 * 60 * 1000); // 5-minute TTL
    return result;
  }
}

