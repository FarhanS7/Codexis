'use client';

import type { ClientSuggestion, Severity } from '../types/review';

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
  suggestion: ClientSuggestion;
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
  const { file, line, severity, body, accepted, dismissed, posted, pending } = suggestion;
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.style;

  // Extract only filename from the path for the chip label
  const fileName = file.split('/').pop() ?? file;

  return (
    <div
      id={`suggestion-card-${suggestion.dedupeKey}`}
      onClick={onClick}
      className={`
        group relative rounded-xl border border-white/5 bg-neutral-900/30
        transition-all duration-200 ease-out cursor-pointer hover:border-white/10
        ${config.borderClass}
        ${dismissed ? 'opacity-40' : ''}
        ${accepted ? 'ring-1 ring-emerald-500/20' : ''}
        ${pending ? 'opacity-70 pointer-events-none' : ''}
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
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-2.5 min-h-[28px]">
          {posted ? (
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold bg-white/[0.03] border border-white/5 px-2.5 py-0.5 rounded-full select-none tracking-wide">
              ↑ Posted to GitHub
            </div>
          ) : accepted ? (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full select-none tracking-wide">
              {pending ? (
                <div className="w-2.5 h-2.5 border border-emerald-900 border-t-emerald-400 rounded-full animate-spin shrink-0 mr-0.5" />
              ) : (
                '✓'
              )}
              {pending ? 'Accepting...' : 'Accepted'}
            </div>
          ) : dismissed ? (
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full select-none tracking-wide">
              {pending && (
                <div className="w-2.5 h-2.5 border border-zinc-700 border-t-zinc-400 rounded-full animate-spin shrink-0 mr-0.5" />
              )}
              Dismissed
              {!pending && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(e);
                  }}
                  className="ml-1 text-[9px] hover:text-white underline tracking-wide"
                >
                  Undo
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(e);
                }}
                className={`
                  px-2.5 py-1 text-[10px] font-bold rounded-full transition-all duration-200
                  border border-white/5 text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300
                  ${pending ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                Dismiss
              </button>
              <button
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(e);
                }}
                className={`
                  px-2.5 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all duration-200 shadow-sm shadow-emerald-900/20
                  ${pending ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {pending ? (
                  <div className="w-2.5 h-2.5 border border-emerald-950 border-t-white rounded-full animate-spin" />
                ) : (
                  'Accept'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
