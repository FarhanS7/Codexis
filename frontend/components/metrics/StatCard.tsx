interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  loading?: boolean;
}

export function StatCard({ label, value, icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 animate-pulse relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="h-4 bg-white/10 rounded w-24" />
          <div className="h-8 w-8 bg-white/10 rounded-lg" />
        </div>
        <div className="h-8 bg-white/10 rounded w-16" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/[0.02] group relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold tracking-wider text-white/40 uppercase font-mono">
          {label}
        </span>
        <span className="text-2xl p-2 bg-white/[0.04] rounded-xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
      </div>
      <div className="text-3xl font-extrabold text-white tracking-tight font-sans">
        {value}
      </div>
    </div>
  );
}
