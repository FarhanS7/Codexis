import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { DiffParserService } from '../github/diff-parser.service';
import { CryptoService } from '../auth/crypto.service';
import { Observable, Subscriber } from 'rxjs';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import {
  chunkDiff,
  validateSuggestion,
  deduplicateSuggestions,
  estimateTokens,
} from './review.utils';
import {
  RawSuggestion,
  ValidatedSuggestion,
  SseEvent,
  ReviewMetrics,
  CommentActionResponse,
  PostToGithubResponse,
} from './review.types';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly diffParser: DiffParserService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * SSE stream that reviews a PR and returns recommendations.
   */
  streamReview(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    model?: string,
  ): Observable<any> {
    return new Observable<any>((subscriber) => {
      this.runReviewPipeline(owner, repo, prNumber, userId, subscriber, model).catch(
        (err) => {
          this.logger.error('Error in review pipeline', err);
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              message: err.message ?? 'An unexpected error occurred.',
            }),
          });
          subscriber.complete();
        },
      );
    });
  }

  private async runReviewPipeline(
    owner: string,
    repo: string,
    prNumber: number,
    userId: string,
    subscriber: Subscriber<any>,
    modelName?: string,
  ): Promise<void> {
    const startTime = Date.now();
    const allSuggestions: RawSuggestion[] = [];
    let totalTokens = 0;

    // 1. Load active prompt version
    const promptVersion = await this.prisma.promptVersion.findFirst({
      where: { isActive: true },
    });
    if (!promptVersion) {
      throw new NotFoundException(
        'No active code review prompt version found in the database. Run seed first.',
      );
    }

    // 2. Get user + access token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }
    const accessToken = this.cryptoService.decrypt(user.accessToken);

    // 3. Fetch PR metadata
    const pr = await this.githubService.getPRMetadata(
      userId,
      accessToken,
      owner,
      repo,
      prNumber,
    );

    // 4. Fetch raw diff
    const rawDiff = await this.githubService.getPRDiff(
      accessToken,
      owner,
      repo,
      prNumber,
    );

    // Safety Rule 13: Max diff size 500KB
    if (rawDiff.length > 500 * 1024) {
      subscriber.next({
        data: JSON.stringify({
          type: 'error',
          message:
            'PR diff too large (>500KB). Consider splitting into smaller PRs.',
        }),
      });
      subscriber.complete();
      return;
    }

    // 5. Parse unified diff
    let parsedFiles = this.diffParser.parse(rawDiff);

    // Safety Rule 14: Max files per review: 50 files
    if (parsedFiles.length > 50) {
      const originalCount = parsedFiles.length;
      parsedFiles = parsedFiles.slice(0, 50);
      subscriber.next({
        data: JSON.stringify({
          type: 'token',
          content: `Note: This PR has ${originalCount} files. Reviewing the first 50.\n\n`,
        }),
      });
    }

    // 6. Chunk diff
    let chunks = chunkDiff(parsedFiles, 6000);

    // Safety Rule 15: Max chunks per review: 15
    if (chunks.length > 15) {
      chunks = chunks.slice(0, 15);
      subscriber.next({
        data: JSON.stringify({
          type: 'token',
          content: 'Warning: Diff size exceeds 15 chunks. Truncating review to avoid high latency.\n\n',
        }),
      });
    }

    this.logger.log(
      `Starting AI review stream for ${owner}/${repo} #${prNumber} (${chunks.length} chunks)`,
    );

    // 7. Stream each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25_000);

      try {
        const selectedModel = modelName ?? process.env.DEFAULT_LLM_MODEL ?? 'gpt-4o';
        let resolvedModel: any;

        if (selectedModel.startsWith('claude-')) {
          const apiKey = process.env.ANTHROPIC_API_KEY;
          if (apiKey && apiKey !== 'sk-ant-your-anthropic-key-here') {
            resolvedModel = anthropic(selectedModel);
          } else {
            this.logger.warn(`Anthropic API key not configured. Falling back to default model.`);
            resolvedModel = openai(process.env.DEFAULT_LLM_MODEL ?? 'gpt-4o');
          }
        } else {
          resolvedModel = openai(selectedModel);
        }

        const { textStream, usage } = await streamText({
          model: resolvedModel,
          system: promptVersion.systemPrompt,
          prompt: promptVersion.userPromptTemplate.replace(
            '{{DIFF_CHUNK}}',
            chunk,
          ),
          abortSignal: controller.signal,
        });

        let rawOutput = '';

        for await (const token of textStream) {
          rawOutput += token;
          subscriber.next({
            data: JSON.stringify({ type: 'token', content: token }),
          });
        }

        // Parse JSON suggestions from LLM output
        const parsed = this.parseLLMOutput(rawOutput);
        const valid = parsed.filter((s) => validateSuggestion(s, parsedFiles));
        allSuggestions.push(...valid);

        const chunkTokens = (await usage)?.totalTokens ?? estimateTokens(chunk);
        totalTokens += chunkTokens;

        subscriber.next({
          data: JSON.stringify({ type: 'suggestions', suggestions: valid }),
        });

        const chunkLatency = Date.now() - startTime; // simple metric
        this.logger.log(
          `LLM chunk ${i + 1}/${chunks.length} complete. Tokens: ${chunkTokens}.`,
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          this.logger.error(`LLM chunk ${i + 1} request timed out.`);
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              message: `LLM request timed out after 25s on chunk ${
                i + 1
              }/${chunks.length}. Partial results saved.`,
            }),
          });
          break; // Stop reviewing subsequent chunks
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // 8. Deduplicate all suggestions
    const deduped = deduplicateSuggestions(allSuggestions);

    // 9. Save to DB
    const latencyMs = Date.now() - startTime;
    const selectedModel = modelName ?? process.env.DEFAULT_LLM_MODEL ?? 'gpt-4o';
    let costPerMillion = 5.0; // default (gpt-4o)
    if (selectedModel === 'gpt-4o-mini') {
      costPerMillion = 0.150;
    } else if (selectedModel === 'gpt-3.5-turbo') {
      costPerMillion = 0.50;
    } else if (selectedModel.startsWith('claude-3-5-sonnet')) {
      costPerMillion = 3.0;
    } else if (selectedModel.startsWith('claude-3-haiku')) {
      costPerMillion = 0.25;
    }
    const estimatedCostUsd = (totalTokens / 1_000_000) * costPerMillion;

    const { review, comments } = await this.saveReview(userId, String(pr.id), deduped, {
      tokensUsed: totalTokens,
      estimatedCostUsd,
      latencyMs,
      model: selectedModel,
      promptVersionId: promptVersion.id,
    });

    this.logger.log(
      `Review saved successfully: ID: ${review.id}, comments count: ${deduped.length}`,
    );

    // 10. Signal completion
    subscriber.next({
      data: JSON.stringify({
        type: 'complete',
        reviewId: review.id,
        comments: comments.map((c) => ({
          id: c.id,
          dedupeKey: `${c.filePath}:${c.line}:${c.severity}`,
        })),
      }),
    });
    subscriber.complete();
  }

  private parseLLMOutput(raw: string): RawSuggestion[] {
    try {
      // LLM may wrap JSON in markdown code blocks — strip them
      const cleaned = raw
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      this.logger.warn(`Failed to parse LLM output as JSON: ${raw}`);
      return [];
    }
  }

  private async saveReview(
    userId: string,
    prId: string,
    suggestions: ValidatedSuggestion[],
    metrics: ReviewMetrics,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId,
          prId,
          model: metrics.model,
          tokensUsed: metrics.tokensUsed,
          estimatedCostUsd: metrics.estimatedCostUsd,
          latencyMs: metrics.latencyMs,
          promptVersionId: metrics.promptVersionId,
          status: 'COMPLETE',
        },
      });

      let comments: any[] = [];
      if (suggestions.length > 0) {
        await tx.reviewComment.createMany({
          data: suggestions.map((s) => ({
            reviewId: review.id,
            filePath: s.file,
            line: s.line,
            severity: s.severity,
            body: s.body,
          })),
        });

        comments = await tx.reviewComment.findMany({
          where: { reviewId: review.id },
          select: {
            id: true,
            filePath: true,
            line: true,
            severity: true,
          },
        });
      }

      return { review, comments };
    });
  }

  async acceptComment(commentId: string, userId: string): Promise<CommentActionResponse> {
    const comment = await this.prisma.reviewComment.findFirst({
      where: { id: commentId },
      include: { review: { select: { userId: true } } },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found.`);
    }

    if (comment.review.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this comment.');
    }

    const updated = await this.prisma.reviewComment.update({
      where: { id: commentId },
      data: {
        accepted: true,
        dismissed: false,
      },
    });

    return {
      id: updated.id,
      accepted: updated.accepted,
      dismissed: updated.dismissed,
    };
  }

  async dismissComment(commentId: string, userId: string): Promise<CommentActionResponse> {
    const comment = await this.prisma.reviewComment.findFirst({
      where: { id: commentId },
      include: { review: { select: { userId: true } } },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found.`);
    }

    if (comment.review.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this comment.');
    }

    const updated = await this.prisma.reviewComment.update({
      where: { id: commentId },
      data: {
        accepted: false,
        dismissed: true,
      },
    });

    return {
      id: updated.id,
      accepted: updated.accepted,
      dismissed: updated.dismissed,
    };
  }

  async postToGitHub(
    reviewId: string,
    userId: string,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<PostToGithubResponse> {
    // 1. Fetch review and unposted accepted comments
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
      include: {
        comments: {
          where: { accepted: true, postedToGh: false },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found.`);
    }

    // 2. Early return if nothing to post
    if (review.comments.length === 0) {
      return { posted: 0, message: 'Nothing to post' };
    }

    // 3. Get user & decrypt access token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }
    const accessToken = this.cryptoService.decrypt(user.accessToken);

    // 4. Fetch the latest PR metadata to get current HEAD SHA
    const pr = await this.githubService.getPRMetadata(
      userId,
      accessToken,
      owner,
      repo,
      prNumber,
    );

    // 5. Build and send the review payload
    const payload = {
      commit_id: pr.head.sha,
      body: `AI Code Review — ${review.comments.length} comment${review.comments.length > 1 ? 's' : ''}`,
      event: 'COMMENT' as const,
      comments: review.comments.map((c) => ({
        path: c.filePath,
        line: c.line,
        side: 'RIGHT' as const,
        body: this.formatCommentBody(c.severity, c.body),
      })),
    };

    const githubReview = await this.githubService.createPRReview(
      accessToken,
      owner,
      repo,
      prNumber,
      payload,
    );

    // 6. Mark comments as posted in a transaction
    const commentIds = review.comments.map((c) => c.id);
    await this.prisma.$transaction(
      commentIds.map((id) =>
        this.prisma.reviewComment.update({
          where: { id },
          data: { postedToGh: true },
        }),
      ),
    );

    return {
      posted: review.comments.length,
      githubReviewId: githubReview.id,
    };
  }

  private formatCommentBody(severity: string, body: string): string {
    const prefixes: Record<string, string> = {
      bug: '🔴 **Bug**',
      security: '🟠 **Security**',
      performance: '🟡 **Performance**',
      style: '🔵 **Style**',
    };
    const prefix = prefixes[severity] ?? '💬 **Note**';
    return `${prefix}: ${body}\n\n*Generated by AI Code Reviewer*`;
  }
}
