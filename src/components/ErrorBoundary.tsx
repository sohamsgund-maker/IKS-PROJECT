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
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-[#0B0D10] text-[#F5F5F2] select-none animate-fade-in">
          {/* Glowing Ambient Aura */}
          <div className="w-20 h-20 rounded-2xl bg-[#F0B429]/10 border border-[#F0B429]/30 flex items-center justify-center text-[#F0B429] mb-5 shadow-2xl">
            <AlertTriangle className="w-9 h-9" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-headline text-[#F5F5F2] mb-2 tracking-tight">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>

          <p className="text-xs sm:text-sm text-[#9A9FA8] max-w-md mb-8 leading-relaxed font-body">
            {this.props.fallbackMessage ||
              'A temporary issue occurred while rendering. You can try recovering or return to the vault.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F0B429] hover:bg-[#F7C948] active:bg-[#D99E0B] text-[#0B0D10] text-sm font-bold transition-all press-feedback cursor-pointer shadow-[var(--shadow-button)] min-h-[48px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <button
              onClick={() => {
                queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
                this.handleReset();
                window.location.href = '/';
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#15181D] hover:bg-[#1D2127] active:bg-[#0B0D10] text-[#F5F5F2] text-sm font-semibold transition-all border border-[#292E35] press-feedback cursor-pointer min-h-[48px]"
            >
              <Home className="w-4 h-4 text-[#F0B429]" />
              <span>Return to Vault</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
