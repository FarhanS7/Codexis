import type { Severity } from 'shared';

export type ReviewStatus = 'PENDING' | 'STREAMING' | 'COMPLETE' | 'ERROR';
export type { Severity };

export interface RawSuggestion {
  file: string;
  line: number;
  severity: Severity;
  body: string;
}

export interface ValidatedSuggestion extends RawSuggestion {
  dedupeKey: string; // "${file}:${line}:${severity}"
}

export interface SseTokenEvent {
  type: 'token';
  content: string;
}

export interface SseSuggestionsEvent {
  type: 'suggestions';
  suggestions: ValidatedSuggestion[];
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

export interface ReviewMetrics {
  tokensUsed: number;
  estimatedCostUsd: number;
  latencyMs: number;
  model: string;
  promptVersionId: string;
}

