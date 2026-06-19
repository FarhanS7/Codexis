'use client';

import type { Suggestion, Severity } from '../types/review';

// ─── Constants & Color Maps ──────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; badgeClass: string; borderClass: string; bgClass: string }
> = {
  bug: {
    label: 'Bug',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    borderClass: 'border-l-[3px] border-l-red-500',
    bgClass: 'bg-red-500/5',
  },
  security: {
    label: 'Security',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderClass: 'border-l-[3px] border-l-blue-500',
    bgClass: 'bg-blue-500/5',
  },
  performance: {
    label: 'Perf',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderClass: 'border-l-[3px] border-l-emerald-500',
    bgClass: 'bg-emerald-500/5',
  },
  style: {
    label: 'Style',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderClass: 'border-l-[3px] border-l-amber-500',
    bgClass: 'bg-amber-500/5',
  },
};

// ─── Severity icons ──────────────────────────────────────────────────────────

function SeverityIcon({ severity }: { severity: Severity }) {
  const iconClass = "w-3 h-3";
  switch (severity) {
    case 'bug':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-3.83-7.94M12 12.75c-2.883 0-5.647.508-8.207 1.44a23.91 23.91 0 003.83-7.94m4.377-4.377a23.92 23.92 0 01.006 0" />
        </svg>
      );
    case 'security':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case 'performance':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case 'style':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      );
  }
}

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
        group relative rounded-xl border border-white/5 bg-neutral-900/30
        transition-all duration-200 ease-out cursor-pointer hover:border-white/10
        ${config.borderClass}
        ${dismissed ? 'opacity-40' : ''}
        ${accepted ? 'ring-1 ring-emerald-500/20' : ''}
      `}
    >
      {/* Hover highlight */}
      <div className="absolute inset-0 rounded-xl bg-white/[0.01] opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />

      {/* Header meta */}
      <div className="p-3 pb-2 flex items-center justify-between gap-2 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${config.badgeClass}`}
          >
            <SeverityIcon severity={severity} />
            {config.label}
          </span>
          <span
            className="text-[10px] text-neutral-500 bg-white/[0.04] px-2 py-0.5 rounded-md font-mono truncate"
            title={file}
          >
            {fileName}
          </span>
        </div>
        <span className="text-[10px] text-neutral-600 font-mono shrink-0 font-semibold">
          L{line}
        </span>
      </div>

      {/* Body Content */}
      <div className="p-3 pt-2.5">
        <p className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">
          {body}
        </p>

        {/* Action Panel */}
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-2.5">
          {accepted ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
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
                  px-2.5 py-1 text-[11px] font-medium rounded-full transition-all duration-200
                  ${
                    dismissed
                      ? 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.08]'
                      : 'border border-white/5 text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300'
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
                  className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all duration-200 shadow-sm shadow-emerald-900/20"
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
