import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 text-center bg-[#141414] text-white">
          <div className="w-16 h-16 rounded-full bg-red-950/40 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] mb-4 shadow-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            {this.props.fallbackMessage ||
              'A temporary error occurred while rendering this section. You can try refreshing it or return to browse.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <button
              onClick={() => {
                this.handleReset();
                window.location.href = '/';
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-zinc-700 active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
