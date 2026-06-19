import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService, GithubWebhookPayload } from './webhook.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../github/cache.service';

describe('WebhookService', () => {
  let service: WebhookService;
  let prisma: any;
  let cache: any;

  beforeEach(async () => {
    const prismaMock = {
      repository: {
        upsert: jest.fn().mockResolvedValue({ id: 'repo-db-id', name: 'hello-world' }),
      },
      pullRequest: {
        upsert: jest.fn().mockResolvedValue({ id: 'pr-db-id' }),
        update: jest.fn().mockResolvedValue({ id: 'pr-db-id' }),
      },
    };

    const cacheMock = {
      invalidatePattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CacheService, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    prisma = module.get(PrismaService);
    cache = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ignore unsupported event types', async () => {
    await service.handleEvent('push', {} as any);
    expect(prisma.repository.upsert).not.toHaveBeenCalled();
  });

  it('should upsert repository and pull request on opened event', async () => {
    const payload: GithubWebhookPayload = {
      action: 'opened',
      repository: {
        id: 12345,
        name: 'hello-world',
        owner: { login: 'octocat' },
      },
      pull_request: {
        number: 42,
        title: 'Fix auth bug',
        state: 'open',
        head: { sha: 'abc123headsha' },
      },
    };

    await service.handleEvent('pull_request', payload);

    expect(prisma.repository.upsert).toHaveBeenCalledWith({
      where: { githubId: 12345 },
      create: { githubId: 12345, name: 'hello-world', owner: 'octocat' },
      update: { name: 'hello-world', owner: 'octocat' },
    });

    expect(prisma.pullRequest.upsert).toHaveBeenCalledWith({
      where: { repoId_number: { repoId: 'repo-db-id', number: 42 } },
      create: {
        repoId: 'repo-db-id',
        number: 42,
        title: 'Fix auth bug',
        headSha: 'abc123headsha',
        status: 'open',
      },
      update: {
        title: 'Fix auth bug',
        headSha: 'abc123headsha',
        status: 'open',
      },
    });
  });

  it('should update headSha and invalidate caches on synchronize', async () => {
    const payload: GithubWebhookPayload = {
      action: 'synchronize',
      repository: {
        id: 12345,
        name: 'hello-world',
        owner: { login: 'octocat' },
      },
      pull_request: {
        number: 42,
        title: 'Fix auth bug',
        state: 'open',
        head: { sha: 'newheadsha456' },
      },
    };

    await service.handleEvent('pull_request', payload);

    expect(prisma.pullRequest.update).toHaveBeenCalledWith({
      where: { repoId_number: { repoId: 'repo-db-id', number: 42 } },
      data: { headSha: 'newheadsha456' },
    });

    expect(cache.invalidatePattern).toHaveBeenCalledWith('octocat/hello-world/pulls/42');
    expect(cache.invalidatePattern).toHaveBeenCalledWith('octocat/hello-world/pulls');
  });

  it('should update pull request status on closed event', async () => {
    const payload: GithubWebhookPayload = {
      action: 'closed',
      repository: {
        id: 12345,
        name: 'hello-world',
        owner: { login: 'octocat' },
      },
      pull_request: {
        number: 42,
        title: 'Fix auth bug',
        state: 'closed',
        merged: true,
        head: { sha: 'abc123headsha' },
      },
    };

    await service.handleEvent('pull_request', payload);

    expect(prisma.pullRequest.update).toHaveBeenCalledWith({
      where: { repoId_number: { repoId: 'repo-db-id', number: 42 } },
      data: { status: 'merged' },
    });
  });
});
