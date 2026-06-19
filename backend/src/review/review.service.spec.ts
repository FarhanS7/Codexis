import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { DiffParserService } from '../github/diff-parser.service';
import { CryptoService } from '../auth/crypto.service';
import { NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

// Mock streamText from 'ai'
const mockStreamText = jest.fn();
jest.mock('ai', () => ({
  streamText: (...args: any[]) => mockStreamText(...args),
}));

// Mock openai from '@ai-sdk/openai'
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn().mockReturnValue('mocked-model'),
}));

// Mock async iterator helper
async function* mockAsyncIterable(tokens: string[]) {
  for (const token of tokens) {
    yield token;
  }
}

describe('ReviewService', () => {
  let service: ReviewService;
  let prisma: any;
  let github: any;
  let diffParser: any;
  let crypto: any;

  beforeEach(async () => {
    const prismaMock: any = {
      promptVersion: {
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      review: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      reviewComment: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((input) => {
        if (typeof input === 'function') {
          return input(prismaMock);
        }
        return Promise.all(input);
      }),
    };

    const githubMock = {
      getPRMetadata: jest.fn(),
      getPRDiff: jest.fn(),
      createPRReview: jest.fn(),
    };

    const diffParserMock = {
      parse: jest.fn(),
    };

    const cryptoMock = {
      decrypt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: GithubService, useValue: githubMock },
        { provide: DiffParserService, useValue: diffParserMock },
        { provide: CryptoService, useValue: cryptoMock },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    prisma = module.get(PrismaService) as any;
    github = module.get(GithubService) as any;
    diffParser = module.get(DiffParserService) as any;
    crypto = module.get(CryptoService) as any;

    jest.clearAllMocks();
  });

  describe('streamReview', () => {
    it('should throw NotFoundException if no active prompt version exists', async () => {
      prisma.promptVersion.findFirst.mockResolvedValue(null);

      const observable = service.streamReview('owner', 'repo', 1, 'user-id');
      const events: any[] = [];

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (val) => events.push(JSON.parse(val.data)),
          error: () => {},
          complete: () => resolve(),
        });
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('error');
      expect(events[0].message).toContain('prompt version');
    });

    it('should stream tokens and save review successfully on valid input', async () => {
      // Mock user & decryption
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        accessToken: 'enc-token',
      } as any);
      crypto.decrypt.mockReturnValue('decrypted-token');

      // Mock active prompt
      prisma.promptVersion.findFirst.mockResolvedValue({
        id: 'prompt-id',
        systemPrompt: 'sys prompt',
        userPromptTemplate: 'user prompt {{DIFF_CHUNK}}',
      } as any);

      // Mock PR metadata
      github.getPRMetadata.mockResolvedValue({
        id: 42,
        number: 1,
        title: 'Fix auth',
        head: { sha: 'head-sha' },
        base: { sha: 'base-sha' },
      } as any);

      // Mock PR diff
      github.getPRDiff.mockResolvedValue('diff text');

      // Mock diff parser
      diffParser.parse.mockReturnValue([
        {
          filePath: 'src/auth.ts',
          changeType: 'modified',
          originalLines: ['line 1', 'line 2'],
          modifiedLines: ['line 1', 'line 2 changed'],
          modifiedLineMap: {},
          hunks: [
            {
              originalStart: 2,
              originalCount: 1,
              modifiedStart: 2,
              modifiedCount: 1,
              lines: [
                {
                  type: 'context',
                  content: 'line 1',
                  originalLineNum: 1,
                  modifiedLineNum: 1,
                },
                {
                  type: 'added',
                  content: 'line 2 changed',
                  modifiedLineNum: 2,
                },
              ],
            },
          ],
        },
      ]);

      // Mock OpenAI streamText output
      mockStreamText.mockResolvedValue({
        textStream: mockAsyncIterable([
          '[',
          '{"file":"src/auth.ts","line":2,"severity":"bug","body":"Null check needed"}',
          ']',
        ]),
        usage: Promise.resolve({ totalTokens: 100 }),
      });

      // Mock prisma saveReview transactions
      prisma.review.create.mockResolvedValue({ id: 'review-id' } as any);
      prisma.reviewComment.createMany.mockResolvedValue({ count: 1 } as any);
      prisma.reviewComment.findMany.mockResolvedValue([
        {
          id: 'comment-1',
          filePath: 'src/auth.ts',
          line: 2,
          severity: 'bug',
        },
      ] as any);

      const observable = service.streamReview('owner', 'repo', 1, 'user-id');
      const events: any[] = [];

      await new Promise<void>((resolve) => {
        observable.subscribe({
          next: (val) => events.push(JSON.parse(val.data)),
          complete: () => resolve(),
        });
      });

      // Assert event sequence
      expect(events[0]).toEqual({ type: 'token', content: '[' });
      expect(events[1].type).toBe('token');
      expect(events[2].type).toBe('token');

      // Should emit suggestions
      const suggestionsEvent = events.find((e) => e.type === 'suggestions');
      expect(suggestionsEvent).toBeDefined();
      expect(suggestionsEvent.suggestions).toHaveLength(1);
      expect(suggestionsEvent.suggestions[0].file).toBe('src/auth.ts');
      expect(suggestionsEvent.suggestions[0].line).toBe(2);

      // Final complete event
      expect(events[events.length - 1]).toEqual({
        type: 'complete',
        reviewId: 'review-id',
        comments: [
          {
            id: 'comment-1',
            dedupeKey: 'src/auth.ts:2:bug',
          },
        ],
      });

      // Check DB persistence call
      expect(prisma.review.create).toHaveBeenCalled();
      expect(prisma.reviewComment.createMany).toHaveBeenCalled();
    });
  });

  describe('acceptComment', () => {
    it('should throw NotFoundException if comment does not exist', async () => {
      prisma.reviewComment.findFirst.mockResolvedValue(null);
      await expect(service.acceptComment('id', 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      prisma.reviewComment.findFirst.mockResolvedValue({
        id: 'c-id',
        review: { userId: 'other-user' },
      } as any);
      await expect(service.acceptComment('c-id', 'user-id')).rejects.toThrow(
        Error,
      );
    });

    it('should update accepted status successfully', async () => {
      prisma.reviewComment.findFirst.mockResolvedValue({
        id: 'c-id',
        review: { userId: 'user-id' },
      } as any);
      prisma.reviewComment.update.mockResolvedValue({
        id: 'c-id',
        accepted: true,
        dismissed: false,
      } as any);

      const result = await service.acceptComment('c-id', 'user-id');
      expect(result).toEqual({
        id: 'c-id',
        accepted: true,
        dismissed: false,
      });
      expect(prisma.reviewComment.update).toHaveBeenCalledWith({
        where: { id: 'c-id' },
        data: { accepted: true, dismissed: false },
      });
    });
  });

  describe('dismissComment', () => {
    it('should update dismissed status successfully', async () => {
      prisma.reviewComment.findFirst.mockResolvedValue({
        id: 'c-id',
        review: { userId: 'user-id' },
      } as any);
      prisma.reviewComment.update.mockResolvedValue({
        id: 'c-id',
        accepted: false,
        dismissed: true,
      } as any);

      const result = await service.dismissComment('c-id', 'user-id');
      expect(result).toEqual({
        id: 'c-id',
        accepted: false,
        dismissed: true,
      });
    });
  });

  describe('postToGitHub', () => {
    it('should throw NotFoundException if review does not exist', async () => {
      prisma.review.findFirst.mockResolvedValue(null);
      await expect(
        service.postToGitHub('review-id', 'user-id', 'owner', 'repo', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return 0 posted comments if comments list is empty', async () => {
      prisma.review.findFirst.mockResolvedValue({
        id: 'review-id',
        comments: [],
      } as any);

      const result = await service.postToGitHub(
        'review-id',
        'user-id',
        'owner',
        'repo',
        1,
      );
      expect(result).toEqual({ posted: 0, message: 'Nothing to post' });
    });

    it('should successfully post comments to GitHub and update DB', async () => {
      prisma.review.findFirst.mockResolvedValue({
        id: 'review-id',
        comments: [
          {
            id: 'c1',
            filePath: 'src/app.ts',
            line: 10,
            severity: 'bug',
            body: 'Fix bug',
          },
        ],
      } as any);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        accessToken: 'encrypted-token',
      } as any);

      crypto.decrypt.mockReturnValue('decrypted-token');

      github.getPRMetadata.mockResolvedValue({
        head: { sha: 'head-sha' },
      } as any);

      github.createPRReview.mockResolvedValue({
        id: 999,
      } as any);

      prisma.reviewComment.update.mockResolvedValue({} as any);

      const result = await service.postToGitHub(
        'review-id',
        'user-id',
        'owner',
        'repo',
        1,
      );

      expect(result).toEqual({
        posted: 1,
        githubReviewId: 999,
      });

      expect(github.createPRReview).toHaveBeenCalled();
      expect(prisma.reviewComment.update).toHaveBeenCalled();
    });
  });
});
