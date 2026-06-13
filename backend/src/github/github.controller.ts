import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/strategies/jwt.strategy';
import { GithubService } from './github.service';
import { AuthService } from '../auth/auth.service';
import { Repo, PR } from './github.types';

@Controller('github')
@UseGuards(JwtAuthGuard) // All routes in this controller require a valid JWT
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly authService: AuthService,
  ) {}

  /**
   * GET /api/github/repos
   * Returns the authenticated user's repositories, sorted by last push.
   * Cached for 60 seconds per user.
   */
  @Get('repos')
  async getRepos(@CurrentUser() user: RequestUser): Promise<Repo[]> {
    const token = await this.authService.getDecryptedAccessToken(user.userId);
    return this.githubService.getRepos(user.userId, token);
  }

  /**
   * GET /api/github/repos/:owner/:repo/pulls
   * Returns open pull requests for a repository, sorted by last updated.
   * Cached for 60 seconds per user per repo.
   */
  @Get('repos/:owner/:repo/pulls')
  async getPullRequests(
    @CurrentUser() user: RequestUser,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ): Promise<PR[]> {
    const token = await this.authService.getDecryptedAccessToken(user.userId);
    return this.githubService.getPullRequests(user.userId, token, owner, repo);
  }

  /**
   * GET /api/github/repos/:owner/:repo/pulls/:prNumber
   * Returns full metadata for a single PR including head/base commit SHAs.
   * ParseIntPipe validates that prNumber is a valid integer (400 if not).
   */
  @Get('repos/:owner/:repo/pulls/:prNumber')
  async getPRMetadata(
    @CurrentUser() user: RequestUser,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('prNumber', ParseIntPipe) prNumber: number,
  ): Promise<PR> {
    const token = await this.authService.getDecryptedAccessToken(user.userId);
    return this.githubService.getPRMetadata(
      user.userId,
      token,
      owner,
      repo,
      prNumber,
    );
  }
}
