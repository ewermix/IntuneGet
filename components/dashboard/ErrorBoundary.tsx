'use client';

import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-light rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
          <AlertCircle className="w-8 h-8 text-status-error/60 mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">
            {this.props.fallbackTitle || 'This section failed to load'}
          </p>
          <p className="text-xs text-text-muted mb-3">
            An unexpected error occurred
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={this.handleRetry}
            className="text-text-secondary hover:text-text-primary"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
