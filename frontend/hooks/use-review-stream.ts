import { useState, useRef, useEffect, useCallback } from 'react';
import type { Suggestion, ReviewStatus, UseReviewStreamReturn, SseEvent } from '../types/review';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export function useReviewStream(
  owner: string,
  repo: string,
  prNumber: string | number,
): UseReviewStreamReturn {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [tokenBuffer, setTokenBuffer] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const tokenAccumulatorRef = useRef('');

  // Clean up connection on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, []);

  const startReview = useCallback(() => {
    // 1. Close any existing EventSource connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    // 2. Reset states
    setSuggestions([]);
    setTokenBuffer('');
    setErrorMessage(null);
    tokenAccumulatorRef.current = '';
    setStatus('streaming');

    // 3. Open EventSource targeting SSE stream
    const url = `${API_BASE}/review/stream/${owner}/${repo}/${prNumber}`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    // 4. Handle incoming messages
    es.onmessage = (event) => {
      try {
        const data: SseEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'token':
            tokenAccumulatorRef.current += data.content;
            setTokenBuffer(tokenAccumulatorRef.current);
            break;

          case 'suggestions':
            setSuggestions((prev) => {
              const merged = [...prev];
              for (const newSugg of data.suggestions) {
                if (!merged.some((s) => s.dedupeKey === newSugg.dedupeKey)) {
                  merged.push(newSugg);
                }
              }
              return merged;
            });
            break;

          case 'complete':
            setStatus('complete');
            es.close();
            esRef.current = null;
            break;

          case 'error':
            setStatus('error');
            setErrorMessage(data.message);
            es.close();
            esRef.current = null;
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE event data', err);
        setStatus('error');
        setErrorMessage('Failed to parse incoming streaming payload.');
        es.close();
        esRef.current = null;
      }
    };

    // 5. Handle generic connection errors
    es.onerror = (err) => {
      console.error('EventSource connection error', err);
      setStatus('error');
      setErrorMessage(
        'Connection to review stream lost. Please try again.',
      );
      es.close();
      esRef.current = null;
    };
  }, [owner, repo, prNumber]);

  return {
    suggestions,
    status,
    tokenBuffer,
    errorMessage,
    startReview,
    setSuggestions,
  };
}
