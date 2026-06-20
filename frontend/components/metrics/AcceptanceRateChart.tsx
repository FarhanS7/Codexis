interface AcceptanceRateChartProps {
  acceptanceRate: number; // 0-1
  loading?: boolean;
}

export function AcceptanceRateChart({ acceptanceRate, loading }: AcceptanceRateChartProps) {
  const percentage = acceptanceRate * 100;
  const displayRate = percentage.toFixed(0) + '%';
  const isGood = acceptanceRate >= 0.5;

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 h-[290px] flex flex-col justify-between animate-pulse">
        <div>
          <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
        <div className="my-6">
          <div className="h-10 bg-white/10 rounded w-20 mb-2" />
          <div className="h-4 bg-white/10 rounded w-16" />
        </div>
        <div className="h-3 bg-white/10 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 h-[290px] flex flex-col justify-between relative overflow-hidden group">
      {/* Background radial glow */}
      <div
        className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${
          isGood ? 'from-green-500/10' : 'from-yellow-500/10'
        } to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      <div>
        <h3 className="text-sm font-semibold text-white/80">Acceptance Rate</h3>
        <p className="text-xs text-white/30 mt-1">Ratio of accepted suggestions to total comments</p>
      </div>

      <div className="my-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-extrabold text-white tracking-tight">{displayRate}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold border font-mono ${
              isGood
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}
          >
            {isGood ? '✓ GOOD' : '⚠ ATTN'}
          </span>
        </div>
        <p className="text-xs text-white/40 mt-1 font-mono">
          {isGood ? 'AI output is highly aligned' : 'Suggestions might need tuning'}
        </p>
      </div>

      <div>
        <div className="h-3 rounded-full bg-white/5 border border-white/5 p-[1px] overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${
              isGood ? 'from-indigo-500 to-emerald-500' : 'from-indigo-500 to-yellow-500'
            } transition-all duration-1000 ease-out`}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-white/20 font-mono">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
