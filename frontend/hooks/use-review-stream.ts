import { useState, useRef, useEffect, useCallback } from 'react';
import type { ClientSuggestion, ReviewStatus, UseReviewStreamReturn, SseEvent } from '../types/review';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export function useReviewStream(
  owner: string,
  repo: string,
  prNumber: string | number,
): UseReviewStreamReturn {
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [tokenBuffer, setTokenBuffer] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

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
    setReviewId(null);
    tokenAccumulatorRef.current = '';
    setStatus('streaming');

    // 3. Open EventSource targeting SSE stream
    const storedModel = typeof window !== 'undefined' ? localStorage.getItem('ai-reviewer:model') : null;
    const modelParam = storedModel ? `?model=${encodeURIComponent(storedModel)}` : '';
    const url = `${API_BASE}/review/stream/${owner}/${repo}/${prNumber}${modelParam}`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    // 4. Handle incoming messages
    es.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data);

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
                  merged.push({
                    ...newSugg,
                    accepted: false,
                    dismissed: false,
                    posted: false,
                    pending: false,
                  });
                }
              }
              return merged;
            });
            break;

          case 'complete':
            setStatus('complete');
            if (data.reviewId) {
              setReviewId(data.reviewId);
            }
            if (data.comments && Array.isArray(data.comments)) {
              setSuggestions((prev) =>
                prev.map((s) => {
                  const matchingComment = data.comments.find(
                    (c: any) => c.dedupeKey === s.dedupeKey
                  );
                  return matchingComment ? { ...s, id: matchingComment.id } : s;
                })
              );
            }
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
    reviewId,
  };
}
