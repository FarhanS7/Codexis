import type { MetricsSummary } from 'shared/metrics';

export interface ChartDataPoint {
  label: string; // "Jun 5", "Jun 6", etc.
  count: number;
}

export interface FormattedSummary {
  totalReviews: string; // "21"
  acceptanceRate: string; // "64%"
  avgCost: string; // "$0.0048"
  avgLatencyMs: string; // "4,312 ms"
}

export interface ModelOption {
  id: string; // passed to backend: "gpt-4o", "claude-3-5-sonnet-20241022"
  label: string; // displayed to user: "GPT-4o", "Claude 3.5 Sonnet"
  provider: string; // "OpenAI" | "Anthropic"
  tier: 'smart' | 'fast' | 'cheap';
}

export interface UseMetricsReturn {
  summary: MetricsSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
