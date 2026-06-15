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
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100 border-l border-zinc-800">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            AI Suggestions
          </span>
          {suggestions.length > 0 && (
            <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">
              {suggestions.length}
            </span>
          )}
        </div>
        {acceptedCount > 0 && (
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded">
            {acceptedCount} Accepted
          </span>
        )}
      </div>

      {/* Main Trigger Button Section */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/20 shrink-0">
        <button
          onClick={startReview}
          disabled={status === 'streaming'}
          className={`
            w-full py-2.5 px-4 rounded-md font-semibold text-xs transition-all duration-150
            flex items-center justify-center gap-2 shadow-sm
            ${
              status === 'streaming'
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/10'
            }
          `}
        >
          {status === 'streaming' ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-zinc-750 border-t-blue-500 rounded-full animate-spin" />
              Analyzing Pull Request...
            </>
          ) : status === 'complete' || status === 'error' ? (
            'Regenerate Review'
          ) : (
            'Generate AI Review'
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Banner */}
        {status === 'error' && errorMessage && (
          <div className="p-3 bg-red-950/20 border border-red-500/25 rounded-md text-red-400 text-xs">
            <p className="font-semibold mb-1">Review Error</p>
            <p className="opacity-90">{errorMessage}</p>
          </div>
        )}

        {/* Live Typewriter Terminal Console (Only during streaming or if there are outputs) */}
        {status === 'streaming' && tokenBuffer && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner">
            <div className="px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                AI Pipeline Console
              </span>
              <button
                onClick={() => setShowConsole(!showConsole)}
                className="text-[9px] text-zinc-500 hover:text-zinc-300 font-semibold uppercase font-mono"
              >
                {showConsole ? 'Hide' : 'Show'}
              </button>
            </div>
            {showConsole && (
              <div className="p-3 max-h-36 overflow-y-auto font-mono text-[10px] text-zinc-400 leading-normal selection:bg-zinc-800">
                <pre className="whitespace-pre-wrap">{tokenBuffer}</pre>
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        )}

        {/* State Conditional Views */}
        {status === 'idle' && (
          <div className="h-48 flex flex-col items-center justify-center text-center px-4 space-y-3 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center text-lg shadow-sm">
              🤖
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold">No recommendations yet</p>
              <p className="text-zinc-650 text-[10px] mt-1 max-w-xs leading-normal">
                Click the &quot;Generate AI Review&quot; button above to request automated line-level code suggestions.
              </p>
            </div>
          </div>
        )}

        {status === 'streaming' && suggestions.length === 0 && !tokenBuffer && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-6 h-6 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-xs font-medium animate-pulse">
              Contacting AI models...
            </p>
          </div>
        )}

        {/* Suggestion Cards list */}
        {suggestions.length > 0 && (
          <div className="space-y-3.5">
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
          <div className="h-48 flex flex-col items-center justify-center text-center px-4 space-y-2 bg-emerald-950/5 border border-emerald-500/10 rounded-lg">
            <div className="text-2xl">🎉</div>
            <p className="text-emerald-400 text-xs font-semibold">Code looks clean!</p>
            <p className="text-zinc-500 text-[10px] leading-normal max-w-xs">
              AI completed its review of the diff chunks and found zero issues or bugs to report. Great work!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
