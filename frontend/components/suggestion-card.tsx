'use client';

import type { Suggestion, Severity } from '../types/review';

// ─── Constants & Color Maps ──────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; badgeClass: string; borderClass: string; bgClass: string }
> = {
  bug: {
    label: '🔴 Bug',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/20',
    borderClass: 'border-l-4 border-l-red-500',
    bgClass: 'bg-red-500/5',
  },
  security: {
    label: '🔵 Security',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    borderClass: 'border-l-4 border-l-blue-500',
    bgClass: 'bg-blue-500/5',
  },
  performance: {
    label: '🟢 Perf',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    borderClass: 'border-l-4 border-l-emerald-500',
    bgClass: 'bg-emerald-500/5',
  },
  style: {
    label: '🟡 Style',
    badgeClass: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    borderClass: 'border-l-4 border-l-yellow-500',
    bgClass: 'bg-yellow-500/5',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (e: React.MouseEvent) => void;
  onDismiss: (e: React.MouseEvent) => void;
  onClick: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onClick,
}: SuggestionCardProps) {
  const { file, line, severity, body, accepted, dismissed } = suggestion;
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.style;

  // Extract only filename from the path for the chip label
  const fileName = file.split('/').pop() ?? file;

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-lg border border-zinc-800 bg-zinc-900/50 
        transition-all duration-200 ease-out cursor-pointer hover:border-zinc-700
        ${config.borderClass}
        ${dismissed ? 'opacity-40 grayscale-[20%]' : ''}
        ${accepted ? 'ring-1 ring-emerald-500/30' : ''}
      `}
    >
      {/* Background highlight on hover */}
      <div className="absolute inset-0 rounded-lg bg-white/[0.01] opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />

      {/* Header meta */}
      <div className="p-3 pb-2 flex items-center justify-between gap-2 border-b border-zinc-800/40">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border uppercase ${config.badgeClass}`}
          >
            {config.label}
          </span>
          <span
            className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-mono truncate"
            title={file}
          >
            {fileName}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono shrink-0 font-semibold">
          Line {line}
        </span>
      </div>

      {/* Body Content */}
      <div className="p-3 pt-2.5">
        <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap font-medium">
          {body}
        </p>

        {/* Action Panel */}
        <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-zinc-800/40 pt-2.5">
          {accepted ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1 rounded">
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Accepted
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(e);
                }}
                className={`
                  px-2.5 py-1 text-[11px] font-medium rounded transition-colors duration-150
                  ${
                    dismissed
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
                      : 'border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }
                `}
              >
                {dismissed ? 'Undo' : 'Dismiss'}
              </button>
              {!dismissed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(e);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors duration-150 shadow-sm shadow-emerald-900/10"
                >
                  Accept
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
