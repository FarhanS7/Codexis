import type { editor } from 'monaco-editor';
import type { Suggestion } from '@/types/review';

export interface InlineCommentWidgetConfig {
  id: string;                    // unique dedupeKey
  lineNumber: number;            // Mapped line number in Monaco modified model
  suggestion: Suggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export class InlineCommentWidget implements editor.IContentWidget {
  private domNode: HTMLElement | null = null;
  private config: InlineCommentWidgetConfig;

  constructor(config: InlineCommentWidgetConfig) {
    this.config = config;
  }

  getId(): string {
    return `inline-comment-${this.config.id}`;
  }

  getDomNode(): HTMLElement {
    if (!this.domNode) {
      this.domNode = this.createDomNode();
    }
    return this.domNode;
  }

  getPosition(): editor.IContentWidgetPosition | null {
    return {
      position: { lineNumber: this.config.lineNumber, column: 1 },
      preference: [
        // Show below the line (like inline review comments on GitHub)
        1, // monaco.editor.ContentWidgetPositionPreference.BELOW
      ],
    };
  }

  private createDomNode(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'inline-comment-widget p-4 rounded-xl border border-white/5 shadow-2xl backdrop-blur-md transition-all duration-200';
    
    // Premium theme-aligned glassmorphic styles
    container.style.cssText = `
      background: rgba(10, 10, 10, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 16px;
      margin-top: 4px;
      margin-bottom: 4px;
      max-width: 580px;
      min-width: 320px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.7);
      font-family: var(--font-sans, system-ui, sans-serif);
      color: #ededed;
    `;

    // Header with severity badge and file info
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;';

    const badge = document.createElement('span');
    badge.textContent = this.config.suggestion.severity.toUpperCase();
    
    // Severity-based styling matching the index/globals
    let badgeBg = 'rgba(59, 130, 246, 0.15)';
    let badgeColor = '#60a5fa';
    let badgeBorder = 'rgba(59, 130, 246, 0.2)';

    if (this.config.suggestion.severity === 'bug') {
      badgeBg = 'rgba(239, 68, 68, 0.15)';
      badgeColor = '#f87171';
      badgeBorder = 'rgba(239, 68, 68, 0.2)';
    } else if (this.config.suggestion.severity === 'security') {
      badgeBg = 'rgba(249, 115, 22, 0.15)';
      badgeColor = '#fb923c';
      badgeBorder = 'rgba(249, 115, 22, 0.2)';
    } else if (this.config.suggestion.severity === 'performance') {
      badgeBg = 'rgba(234, 179, 8, 0.15)';
      badgeColor = '#facc15';
      badgeBorder = 'rgba(234, 179, 8, 0.2)';
    }

    badge.style.cssText = `
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 9999px;
      background: ${badgeBg};
      color: ${badgeColor};
      border: 1px solid ${badgeBorder};
    `;

    const lineInfo = document.createElement('span');
    lineInfo.textContent = `Line ${this.config.suggestion.line}`;
    lineInfo.style.cssText = 'font-size: 11px; color: #a3a3a3; font-weight: 500;';

    header.appendChild(badge);
    header.appendChild(lineInfo);
    container.appendChild(header);

    // Comment Body
    const body = document.createElement('p');
    body.textContent = this.config.suggestion.body;
    body.style.cssText = 'margin: 0 0 14px 0; font-size: 12.5px; line-height: 1.6; color: #d4d4d8; font-weight: 400;';
    container.appendChild(body);

    // Button Actions
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';

    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = '✓ Accept';
    acceptBtn.style.cssText = `
      padding: 5px 14px;
      border-radius: 8px;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.25);
      cursor: pointer;
      font-size: 11.5px;
      font-weight: 600;
      transition: all 0.15s ease;
    `;
    acceptBtn.addEventListener('mouseenter', () => {
      acceptBtn.style.background = 'rgba(34, 197, 94, 0.25)';
      acceptBtn.style.borderColor = 'rgba(34, 197, 94, 0.4)';
    });
    acceptBtn.addEventListener('mouseleave', () => {
      acceptBtn.style.background = 'rgba(34, 197, 94, 0.15)';
      acceptBtn.style.borderColor = 'rgba(34, 197, 94, 0.25)';
    });
    acceptBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.config.onAccept();
    });

    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = '× Dismiss';
    dismissBtn.style.cssText = `
      padding: 5px 14px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      color: #a3a3a3;
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      font-size: 11.5px;
      font-weight: 600;
      transition: all 0.15s ease;
    `;
    dismissBtn.addEventListener('mouseenter', () => {
      dismissBtn.style.background = 'rgba(255, 255, 255, 0.08)';
      dismissBtn.style.color = '#e5e5e5';
    });
    dismissBtn.addEventListener('mouseleave', () => {
      dismissBtn.style.background = 'rgba(255, 255, 255, 0.04)';
      dismissBtn.style.color = '#a3a3a3';
    });
    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.config.onDismiss();
    });

    actions.appendChild(dismissBtn);
    actions.appendChild(acceptBtn);
    container.appendChild(actions);

    return container;
  }

  dispose(): void {
    if (this.domNode) {
      this.domNode.remove();
      this.domNode = null;
    }
  }
}
