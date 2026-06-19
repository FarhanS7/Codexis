import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsSummary, ReviewsPerDay, ModelBreakdown } from 'shared/metrics';

interface ReviewsPerDayRaw {
  date: Date;
  count: number;
}

interface ModelBreakdownRaw {
  model: string;
  count: number;
  totalCostUsd: number;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<MetricsSummary> {
    const now = new Date();
    
    // Set 'from' to 6 days ago (for a total of 7 days: from -> to inclusive) at start of day
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);

    // Set 'to' to end of today
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);

    this.logger.log(`Fetching metrics summary for user: ${userId} from: ${from.toISOString()} to: ${to.toISOString()}`);

    // Run all aggregation queries in parallel
    const [
      rawReviewsPerDay,
      acceptanceRate,
      avgSuggestions,
      { avgCost, avgLatency, totalReviews },
      rawModelBreakdown,
    ] = await Promise.all([
      this.getReviewsPerDay(userId, from, to),
      this.getAcceptanceRate(userId, from, to),
      this.getAvgSuggestionsPerReview(userId, from, to),
      this.getAvgCostAndLatency(userId, from, to),
      this.getModelBreakdown(userId, from, to),
    ]);

    const reviewsPerDay = this.fillDayGaps(rawReviewsPerDay, from, to);
    const modelBreakdown: ModelBreakdown[] = rawModelBreakdown.map((m) => ({
      model: m.model,
      count: Number(m.count),
      totalCostUsd: Number(m.totalCostUsd ?? 0),
    }));

    return {
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      reviewsPerDay,
      avgSuggestionsPerReview: avgSuggestions,
      acceptanceRate,
      avgCostPerReviewUsd: avgCost,
      avgLatencyMs: avgLatency,
      totalReviews,
      modelBreakdown,
    };
  }

  private async getReviewsPerDay(userId: string, from: Date, to: Date): Promise<ReviewsPerDayRaw[]> {
    return this.prisma.$queryRaw<ReviewsPerDayRaw[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS date,
        COUNT(*)::integer AS count
      FROM "reviews"
      WHERE
        "userId" = ${userId}
        AND "createdAt" >= ${from}
        AND "createdAt" < ${to}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;
  }

  private fillDayGaps(rawData: ReviewsPerDayRaw[], from: Date, to: Date): ReviewsPerDay[] {
    const dataMap = new Map<string, number>();
    for (const row of rawData) {
      const dateObj = typeof row.date === 'string' ? new Date(row.date) : row.date;
      const dateKey = dateObj.toISOString().split('T')[0];
      dataMap.set(dateKey, Number(row.count));
    }

    const result: ReviewsPerDay[] = [];
    const current = new Date(from);
    while (current <= to) {
      const dateKey = current.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        count: dataMap.get(dateKey) ?? 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  private async getAcceptanceRate(userId: string, from: Date, to: Date): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ total: number; accepted: number }]>`
      SELECT
        COUNT(rc.id)::integer AS total,
        COUNT(rc.id) FILTER (WHERE rc.accepted = true)::integer AS accepted
      FROM "review_comments" rc
      JOIN "reviews" r ON r.id = rc."reviewId"
      WHERE
        r."userId" = ${userId}
        AND r."createdAt" >= ${from}
        AND r."createdAt" < ${to}
    `;

    const { total, accepted } = result[0] ?? { total: 0, accepted: 0 };
    if (total === 0) return 0;
    return Math.round((accepted / total) * 100) / 100;
  }

  private async getAvgSuggestionsPerReview(userId: string, from: Date, to: Date): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ avg: number | null }]>`
      SELECT AVG(comment_count)::float AS avg
      FROM (
        SELECT COUNT(rc.id) AS comment_count
        FROM "reviews" r
        LEFT JOIN "review_comments" rc ON rc."reviewId" = r.id
        WHERE r."userId" = ${userId}
          AND r."createdAt" >= ${from}
          AND r."createdAt" < ${to}
        GROUP BY r.id
      ) subquery
    `;
    return Math.round((Number(result[0]?.avg ?? 0)) * 10) / 10;
  }

  private async getModelBreakdown(userId: string, from: Date, to: Date): Promise<ModelBreakdownRaw[]> {
    return this.prisma.$queryRaw<ModelBreakdownRaw[]>`
      SELECT
        model,
        COUNT(*)::integer AS count,
        SUM("estimatedCostUsd")::float AS "totalCostUsd"
      FROM "reviews"
      WHERE
        "userId" = ${userId}
        AND "createdAt" >= ${from}
        AND "createdAt" < ${to}
      GROUP BY model
      ORDER BY count DESC
    `;
  }

  private async getAvgCostAndLatency(userId: string, from: Date, to: Date) {
    const result = await this.prisma.$queryRaw<[{ avgCost: number; avgLatency: number; totalReviews: number }]>`
      SELECT
        AVG("estimatedCostUsd")::float AS "avgCost",
        AVG("latencyMs")::float        AS "avgLatency",
        COUNT(*)::integer              AS "totalReviews"
      FROM "reviews"
      WHERE
        "userId" = ${userId}
        AND "createdAt" >= ${from}
        AND "createdAt" < ${to}
    `;
    return {
      avgCost: Math.round(Number(result[0]?.avgCost ?? 0) * 1_000_000) / 1_000_000,
      avgLatency: Math.round(Number(result[0]?.avgLatency ?? 0)),
      totalReviews: result[0]?.totalReviews ?? 0,
    };
  }
}
