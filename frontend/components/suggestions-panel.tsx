'use client';

import { useRef, useEffect, useState } from 'react';
import type { Suggestion, ReviewStatus } from '../types/review';
import { SuggestionCard } from './suggestion-card';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  status: ReviewStatus;
  tokenBuffer: string;
  errorMessage: string | null;
  onAccept: (dedupeKey: string) => void;
  onDismiss: (dedupeKey: string) => void;
  onSuggestionClick: (suggestion: Suggestion) => void;
  startReview: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SuggestionsPanel({
  suggestions,
  status,
  tokenBuffer,
  errorMessage,
  onAccept,
  onDismiss,
  onSuggestionClick,
  startReview,
}: SuggestionsPanelProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [showConsole, setShowConsole] = useState(true);

  // Auto-scroll the live typewriter terminal console to the bottom
  useEffect(() => {
    if (status === 'streaming') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tokenBuffer, status]);

  // Derived count of accepted suggestions
  const acceptedCount = suggestions.filter((s) => s.accepted).length;

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] text-neutral-100 border-l border-white/5">
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            AI Suggestions
          </span>
          {suggestions.length > 0 && (
            <span className="text-[10px] font-bold bg-white/[0.06] text-neutral-400 px-1.5 py-0.5 rounded-full">
              {suggestions.length}
            </span>
          )}
        </div>
        {acceptedCount > 0 && (
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {acceptedCount} Accepted
          </span>
        )}
      </div>

      {/* Main Trigger Button Section */}
      <div className="p-4 border-b border-white/5 shrink-0">
        <button
          onClick={startReview}
          disabled={status === 'streaming'}
          className={`
            w-full py-2.5 px-4 rounded-full font-semibold text-xs transition-all duration-200
            flex items-center justify-center gap-2
            ${
              status === 'streaming'
                ? 'bg-white/[0.04] text-neutral-600 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25'
            }
          `}
        >
          {status === 'streaming' ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-neutral-700 border-t-violet-400 rounded-full animate-spin" />
              Analyzing Pull Request…
            </>
          ) : status === 'complete' || status === 'error' ? (
            'Regenerate Review'
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              Generate AI Review
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div
        id="suggestions-panel-container"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Error Banner */}
        {status === 'error' && errorMessage && (
          <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl text-red-400 text-xs">
            <p className="font-semibold mb-1">Review Error</p>
            <p className="opacity-90">{errorMessage}</p>
          </div>
        )}

        {/* Live Typewriter Terminal Console */}
        {status === 'streaming' && tokenBuffer && (
          <div className="rounded-xl border border-white/5 bg-[#050505] overflow-hidden">
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider font-mono">
                AI Pipeline Console
              </span>
              <button
                onClick={() => setShowConsole(!showConsole)}
                className="text-[9px] text-neutral-600 hover:text-neutral-400 font-semibold uppercase font-mono transition-colors"
              >
                {showConsole ? 'Hide' : 'Show'}
              </button>
            </div>
            {showConsole && (
              <div className="p-3 max-h-36 overflow-y-auto font-mono text-[10px] text-neutral-500 leading-normal selection:bg-violet-500/20">
                <pre className="whitespace-pre-wrap">{tokenBuffer}</pre>
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        )}

        {/* State Conditional Views */}
        {status === 'idle' && (
          <div className="h-48 flex flex-col items-center justify-center text-center px-4 space-y-3 border border-dashed border-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <p className="text-neutral-400 text-xs font-semibold">No recommendations yet</p>
              <p className="text-neutral-600 text-[10px] mt-1 max-w-xs leading-normal">
                Click the &quot;Generate AI Review&quot; button above to request automated line-level code suggestions.
              </p>
            </div>
          </div>
        )}

        {status === 'streaming' && suggestions.length === 0 && !tokenBuffer && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-6 h-6 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-neutral-500 text-xs font-medium animate-pulse">
              Contacting AI models…
            </p>
          </div>
        )}

        {/* Suggestion Cards list */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.dedupeKey}
                suggestion={suggestion}
                onAccept={() => onAccept(suggestion.dedupeKey)}
                onDismiss={() => onDismiss(suggestion.dedupeKey)}
                onClick={() => onSuggestionClick(suggestion)}
              />
            ))}
          </div>
        )}

        {/* Clean State (Success but no suggestions) */}
        {status === 'complete' && suggestions.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-center px-4 space-y-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
            <div className="text-2xl">🎉</div>
            <p className="text-emerald-400 text-xs font-semibold">Code looks clean!</p>
            <p className="text-neutral-500 text-[10px] leading-normal max-w-xs">
              AI completed its review of the diff chunks and found zero issues or bugs to report. Great work!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
