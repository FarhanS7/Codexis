import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import type { ReviewsPerDay } from 'shared/metrics';
import type { ChartDataPoint } from '../../types/metrics';

interface ReviewsBarChartProps {
  data: ReviewsPerDay[];
  loading?: boolean;
}

export function ReviewsBarChart({ data, loading }: ReviewsBarChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data.map((d) => {
      try {
        const dateObj = parseISO(d.date);
        return {
          label: format(dateObj, 'MMM d'),
          count: d.count,
        };
      } catch (e) {
        return {
          label: d.date,
          count: d.count,
        };
      }
    });
  }, [data]);

  const maxCount = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((d) => d.count));
  }, [chartData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 h-[290px] flex flex-col justify-between animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
        <div className="flex-1 bg-white/[0.03] rounded-xl flex items-end justify-between p-4 gap-2">
          <div className="h-[20%] w-full bg-white/5 rounded-t" />
          <div className="h-[50%] w-full bg-white/5 rounded-t" />
          <div className="h-[30%] w-full bg-white/5 rounded-t" />
          <div className="h-[80%] w-full bg-white/5 rounded-t" />
          <div className="h-[40%] w-full bg-white/5 rounded-t" />
          <div className="h-[60%] w-full bg-white/5 rounded-t" />
          <div className="h-[90%] w-full bg-white/5 rounded-t" />
        </div>
      </div>
    );
  }

  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 h-[290px] flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-white/80">Reviews Per Day</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-white/30 space-y-2">
          <span className="text-3xl">📊</span>
          <p className="text-sm">No reviews in the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 h-[290px] flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-white/80 mb-4">Reviews Per Day</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(26, 26, 46, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontFamily: 'sans-serif',
                backdropFilter: 'blur(8px)',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.count === maxCount && maxCount > 0
                      ? 'url(#peakGlow)'
                      : 'rgba(99, 102, 241, 0.3)'
                  }
                  stroke={entry.count === maxCount && maxCount > 0 ? '#818cf8' : 'transparent'}
                  strokeWidth={1}
                />
              ))}
            </Bar>
            <defs>
              <linearGradient id="peakGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
