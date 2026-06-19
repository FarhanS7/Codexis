import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../github/cache.service';

export interface GithubWebhookPayload {
  action: 'opened' | 'synchronize' | 'closed' | 'reopened' | string;
  repository: {
    id: number;
    name: string;
    owner: { login: string };
  };
  pull_request: {
    number: number;
    title: string;
    state: 'open' | 'closed';
    merged?: boolean;
    head: { sha: string };
  };
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async handleEvent(eventType: string, payload: GithubWebhookPayload): Promise<void> {
    if (eventType !== 'pull_request') {
      this.logger.debug(`Ignoring unsupported webhook event: ${eventType}`);
      return;
    }

    const { action, repository: repo, pull_request: pr } = payload;

    // 1. Idempotently upsert repository
    const dbRepo = await this.prisma.repository.upsert({
      where: { githubId: repo.id },
      create: {
        githubId: repo.id,
        name: repo.name,
        owner: repo.owner.login,
      },
      update: {
        name: repo.name,
        owner: repo.owner.login,
      },
    });

    switch (action) {
      case 'opened':
      case 'reopened':
        await this.prisma.pullRequest.upsert({
          where: {
            repoId_number: {
              repoId: dbRepo.id,
              number: pr.number,
            },
          },
          create: {
            repoId: dbRepo.id,
            number: pr.number,
            title: pr.title,
            headSha: pr.head.sha,
            status: 'open',
          },
          update: {
            title: pr.title,
            headSha: pr.head.sha,
            status: 'open',
          },
        });
        this.logger.log(`PR #${pr.number} ${action} in ${repo.owner.login}/${repo.name}`);
        break;

      case 'synchronize':
        // Update head SHA when new commits are pushed
        await this.prisma.pullRequest.update({
          where: {
            repoId_number: {
              repoId: dbRepo.id,
              number: pr.number,
            },
          },
          data: {
            headSha: pr.head.sha,
          },
        });
        // Invalidate all related PR caches
        this.cache.invalidatePattern(`${repo.owner.login}/${repo.name}/pulls/${pr.number}`);
        this.cache.invalidatePattern(`${repo.owner.login}/${repo.name}/pulls`);
        this.logger.log(`PR #${pr.number} synchronized in ${repo.owner.login}/${repo.name}. Caches invalidated.`);
        break;

      case 'closed':
        const finalStatus = pr.merged ? 'merged' : 'closed';
        await this.prisma.pullRequest.update({
          where: {
            repoId_number: {
              repoId: dbRepo.id,
              number: pr.number,
            },
          },
          data: {
            status: finalStatus,
          },
        });
        this.logger.log(`PR #${pr.number} closed (merged: ${!!pr.merged}) in ${repo.owner.login}/${repo.name}`);
        break;

      default:
        this.logger.debug(`Unhandled pull_request action: ${action}`);
        break;
    }
  }
}
