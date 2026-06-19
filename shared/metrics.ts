export interface ReviewsPerDay {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export interface ModelBreakdown {
  model: string;
  count: number;
  totalCostUsd: number;
}

export interface MetricsSummary {
  period: {
    from: string; // ISO 8601
    to: string;
  };
  reviewsPerDay: ReviewsPerDay[];
  avgSuggestionsPerReview: number;
  acceptanceRate: number; // 0-1
  avgCostPerReviewUsd: number;
  avgLatencyMs: number;
  totalReviews: number;
  modelBreakdown: ModelBreakdown[];
}

