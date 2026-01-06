import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { captureError } from '../config/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Send to Sentry
    captureError(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" role="alert" aria-live="assertive">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="w-20 h-20 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center" aria-hidden="true">
              <svg
                className="w-10 h-10 text-rose-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Something went wrong
              </h1>
              <p className="text-white/50 font-medium">
                We encountered an unexpected error. Please try again or return to the homepage.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-slate-900 rounded-2xl p-4 text-left border border-slate-800">
                <p className="text-xs font-mono text-rose-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4" role="group" aria-label="Error recovery options">
              <button
                onClick={this.handleReset}
                aria-label="Retry loading the page"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/"
                onClick={this.handleReset}
                aria-label="Return to homepage"
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
