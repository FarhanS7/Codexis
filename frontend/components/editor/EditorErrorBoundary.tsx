'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;  // Optional callback to reset parent state on retry
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[EditorErrorBoundary] Monaco crash:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-zinc-950">
          <div className="text-center max-w-md px-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Editor crashed
            </h3>
            <p className="text-sm text-zinc-400 mb-1">
              {this.state.errorMessage || 'Monaco Editor encountered an unexpected error.'}
            </p>
            <p className="text-xs text-zinc-500 mb-6">
              This is usually a transient issue. The file tree and suggestions panel are still usable.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              ↻ Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
