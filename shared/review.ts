export type Severity = 'bug' | 'style' | 'security' | 'performance';

export type ReviewStatus = 'idle' | 'streaming' | 'complete' | 'error';

export interface Suggestion {
  file: string;
  line: number;
  severity: Severity;
  body: string;
  dedupeKey: string; // "${file}:${line}:${severity}"
  accepted?: boolean;
  dismissed?: boolean;
}

export interface SseTokenEvent {
  type: 'token';
  content: string;
}

export interface SseSuggestionsEvent {
  type: 'suggestions';
  suggestions: Suggestion[];
}

export interface SseCompleteEvent {
  type: 'complete';
}

export interface SseErrorEvent {
  type: 'error';
  message: string;
}

export type SseEvent =
  | SseTokenEvent
  | SseSuggestionsEvent
  | SseCompleteEvent
  | SseErrorEvent;
