export interface ReviewsPerDay {
  date: string;
  count: number;
}

export interface ModelBreakdown {
  model: string;
  count: number;
}

export interface MetricsSummary {
  totalReviews: number;
  totalSuggestions: number;
  averageSuggestionsPerReview: number;
  reviewsPerDay: ReviewsPerDay[];
  modelBreakdown: ModelBreakdown[];
}
