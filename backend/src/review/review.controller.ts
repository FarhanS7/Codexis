import {
  Controller,
  Sse,
  UseGuards,
  Param,
  ParseIntPipe,
  MessageEvent,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { Observable } from 'rxjs';

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
}
