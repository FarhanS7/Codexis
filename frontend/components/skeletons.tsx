// ─── Repo Skeleton ────────────────────────────────────────────────────────────
export function RepoSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-white/5 bg-neutral-900/30 animate-pulse"
        >
          {/* Header: name + badge */}
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-4 bg-white/[0.06] rounded-md w-32" />
            <div className="h-4 bg-white/[0.04] rounded-full w-14" />
          </div>

          {/* Description: 2 lines */}
          <div className="h-3 bg-white/[0.04] rounded w-full mb-1.5" />
          <div className="h-3 bg-white/[0.04] rounded w-3/4" />

          {/* Footer: language + updated time */}
          <div className="flex gap-3 mt-3.5">
            <div className="h-3 bg-white/[0.04] rounded w-16" />
            <div className="h-3 bg-white/[0.03] rounded w-24" />
          </div>
        </div>
      ))}
    </>
  );
}

// ─── PR Skeleton ──────────────────────────────────────────────────────────────
export function PRSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-white/5 bg-neutral-900/30 animate-pulse"
        >
          <div className="flex items-start gap-3">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />

            <div className="flex-1">
              {/* PR number + title */}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 bg-white/[0.04] rounded w-8" />
                <div className="h-4 bg-white/[0.06] rounded-md w-48" />
              </div>

              {/* Author + time */}
              <div className="flex gap-2 mb-2">
                <div className="h-3 bg-white/[0.04] rounded w-20" />
                <div className="h-3 bg-white/[0.03] rounded w-28" />
              </div>

              {/* Diff stats */}
              <div className="flex gap-2">
                <div className="h-3 bg-white/[0.04] rounded w-10" />
                <div className="h-3 bg-white/[0.04] rounded w-10" />
                <div className="h-3 bg-white/[0.03] rounded w-14" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
