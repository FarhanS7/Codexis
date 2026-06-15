import type { Severity, ReviewStatus, Suggestion, SseEvent } from 'shared';
export type { Severity, ReviewStatus, Suggestion, SseEvent };

export interface UseReviewStreamReturn {
  suggestions: Suggestion[];
  status: ReviewStatus;
  tokenBuffer: string;
  errorMessage: string | null;
  startReview: () => void;
  setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
}

