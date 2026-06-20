import { useMemo } from 'react';
import type { ModelBreakdown } from 'shared/metrics';

interface ModelBreakdownTableProps {
  models: ModelBreakdown[];
  loading?: boolean;
}

export function ModelBreakdownTable({ models, loading }: ModelBreakdownTableProps) {
  const totalReviews = useMemo(() => models.reduce((sum, m) => sum + m.count, 0), [models]);
  const totalCost = useMemo(() => models.reduce((sum, m) => sum + m.totalCostUsd, 0), [models]);

  const costFormatter = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    });
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 h-[270px] flex flex-col justify-between animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/4 mb-4" />
        <div className="space-y-4">
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-full" />
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 h-[270px] flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-white/80">Model Usage</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-white/30 space-y-2">
          <span className="text-3xl">🤖</span>
          <p className="text-sm">No model analytics available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 min-h-[270px] flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-white/80 mb-4">Model Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold text-white/40 uppercase tracking-wider font-mono">
                <th className="pb-2">Model</th>
                <th className="pb-2 text-right">Reviews</th>
                <th className="pb-2 text-right">Usage %</th>
                <th className="pb-2 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.model} className="border-b border-white/5 text-sm hover:bg-white/[0.01] transition-colors">
                  <td className="py-2.5 font-mono text-xs text-white/70">{model.model}</td>
                  <td className="py-2.5 text-right font-mono text-white/60">{model.count}</td>
                  <td className="py-2.5 text-right font-mono text-white/60">
                    {totalReviews > 0 ? ((model.count / totalReviews) * 100).toFixed(0) + '%' : '0%'}
                  </td>
                  <td className="py-2.5 text-right font-mono text-white/60">
                    {costFormatter.format(model.totalCostUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-white/10 pt-3 flex justify-between items-center text-xs font-semibold text-white/40 uppercase tracking-wider font-mono mt-4">
        <span>Total Cost</span>
        <span className="text-sm text-indigo-400 font-bold">{costFormatter.format(totalCost)}</span>
      </div>
    </div>
  );
}
