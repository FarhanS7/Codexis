import {
  Controller,
  Sse,
  UseGuards,
  Param,
  ParseIntPipe,
  MessageEvent,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { Observable } from 'rxjs';
import { CommentActionResponse, PostToGithubResponse } from './review.types';

@Controller('review')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Sse('stream/:owner/:repo/:prNumber')
  streamReview(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('prNumber', ParseIntPipe) prNumber: number,
    @CurrentUser() user: User,
  ): Observable<MessageEvent> {
    return this.reviewService.streamReview(owner, repo, prNumber, user.id);
  }

  @Patch('comments/:commentId/accept')
  async acceptComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
  ): Promise<CommentActionResponse> {
    return this.reviewService.acceptComment(commentId, user.id);
  }

  @Patch('comments/:commentId/dismiss')
  async dismissComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
  ): Promise<CommentActionResponse> {
    return this.reviewService.dismissComment(commentId, user.id);
  }

  @Post(':reviewId/post-to-github')
  async postToGitHub(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: User,
    @Body() body: { owner: string; repo: string; prNumber: number },
  ): Promise<PostToGithubResponse> {
    return this.reviewService.postToGitHub(
      reviewId,
      user.id,
      body.owner,
      body.repo,
      body.prNumber,
    );
  }
}
