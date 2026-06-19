import type { Severity, ReviewStatus, Suggestion, SseEvent } from 'shared';
export type { Severity, ReviewStatus, Suggestion, SseEvent };

export interface ClientSuggestion extends Suggestion {
  id?: string;        // Database comment ID (populated once complete event is received)
  posted?: boolean;   // Local UI state — true if posted to GitHub
  pending?: boolean;  // Local UI state — true during active PATCH mutations
}

export type PostStatus = 'idle' | 'posting' | 'posted' | 'error';

export interface UseReviewStreamReturn {
  suggestions: ClientSuggestion[];
  status: ReviewStatus;
  tokenBuffer: string;
  errorMessage: string | null;
  startReview: () => void;
  setSuggestions: React.Dispatch<React.SetStateAction<ClientSuggestion[]>>;
  reviewId: string | null; // Captured from complete event
}

export interface UseAcceptDismissReturn {
  handleAccept: (dedupeKey: string) => Promise<void>;
  handleDismiss: (dedupeKey: string) => Promise<void>;
  handlePostToGitHub: () => Promise<void>;
  postStatus: PostStatus;
  postErrorMessage: string | null;
}
