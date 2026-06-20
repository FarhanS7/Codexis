'use client';

import { useMemo } from 'react';
import { useMetrics } from '../../../hooks/useMetrics';
import { StatCard } from '../../../components/metrics/StatCard';
import { ReviewsBarChart } from '../../../components/metrics/ReviewsBarChart';
import { AcceptanceRateChart } from '../../../components/metrics/AcceptanceRateChart';
import { ModelBreakdownTable } from '../../../components/metrics/ModelBreakdownTable';
import { ModelSwitcher } from '../../../components/metrics/ModelSwitcher';

export default function MetricsPage() {
  const { summary, loading, error, refetch } = useMetrics();

  // Memoize all formatting - only recompute when summary changes
  const formatted = useMemo(() => {
    if (!summary) return null;
    return {
      totalReviews: new Intl.NumberFormat('en-US').format(summary.totalReviews),
      acceptanceRate: new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 }).format(summary.acceptanceRate),
      avgCost: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(summary.avgCostPerReviewUsd),
      avgLatency: new Intl.NumberFormat('en-US').format(Math.round(summary.avgLatencyMs)) + ' ms',
    };
  }, [summary]);

  const dateRangeStr = useMemo(() => {
    if (!summary?.period) return 'Last 7 days';
    try {
      const fromStr = summary.period.from.split('T')[0];
      const toStr = summary.period.to.split('T')[0];
      return `${fromStr} to ${toStr}`;
    } catch {
      return 'Last 7 days';
    }
  }, [summary]);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[500px]">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 max-w-md w-full text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-white">Failed to Load Metrics</h2>
          <p className="text-sm text-white/50">{error}</p>
          <button
            onClick={refetch}
            className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 active:scale-95 border border-white/5"
          >
            Retry Fetching
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Telemetry</h1>
        <p className="text-xs text-white/40 font-mono mt-1">
          {loading ? 'Analyzing historical periods...' : dateRangeStr}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Reviews" value={formatted?.totalReviews ?? '—'} icon="📊" loading={loading} />
        <StatCard label="Acceptance Rate" value={formatted?.acceptanceRate ?? '—'} icon="✓" loading={loading} />
        <StatCard label="Avg Cost / Review" value={formatted?.avgCost ?? '—'} icon="💰" loading={loading} />
        <StatCard label="Avg AI Latency" value={formatted?.avgLatency ?? '—'} icon="⚡" loading={loading} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ReviewsBarChart data={summary?.reviewsPerDay ?? []} loading={loading} />
        </div>
        <div>
          <AcceptanceRateChart acceptanceRate={summary?.acceptanceRate ?? 0} loading={loading} />
        </div>
      </div>

      {/* Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ModelBreakdownTable models={summary?.modelBreakdown ?? []} loading={loading} />
        </div>
        <div>
          <ModelSwitcher />
        </div>
      </div>
    </div>
  );
}
