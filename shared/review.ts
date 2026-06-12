export type Severity = 'info' | 'warning' | 'error';

export type ReviewStatus = 'pending' | 'completed' | 'failed';

export interface Suggestion {
  id: string;
  filePath: string;
  lineNumber: number;
  originalCode: string;
  suggestedCode: string;
  comment: string;
  severity: Severity;
}

export interface SseEvent {
  event: string;
  data: any;
}
