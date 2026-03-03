import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * React Error Boundary – catches render crashes and shows a recovery UI
 * instead of a blank white screen. Class component required by React.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neon-orange/10 border border-neon-orange/20 flex items-center justify-center">
              <AlertTriangle size={28} className="text-neon-orange" />
            </div>

            <h1 className="font-display text-xl font-black text-white mb-2">
              Something Went Wrong
            </h1>
            <p className="text-sm text-dim mb-6 leading-relaxed">
              An unexpected error occurred. You can try again or head back home.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 rounded-xl bg-dark-700/50 border border-dark-500/20">
                <p className="text-[11px] text-white/40 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-cyber text-sm px-5 py-2.5 flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl bg-dark-600/50 border border-dark-500/20 text-sm text-white/70 
                           hover:bg-dark-500/50 transition-colors flex items-center gap-2"
              >
                <Home size={14} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
