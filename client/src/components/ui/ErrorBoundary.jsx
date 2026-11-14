import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Track Here UI Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleNavigateHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[350px] w-full flex flex-col items-center justify-center p-8 text-center bg-[var(--surface)] rounded-3xl border border-[var(--line)] shadow-xs my-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--danger-soft)] border border-[var(--danger)]/30 flex items-center justify-center text-[var(--danger)] mb-4 shadow-2xs">
            <AlertCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-xl font-heading font-bold text-[var(--text)] mb-2 tracking-tight">
            Something went wrong in this section
          </h2>
          <p className="text-xs text-[var(--muted)] max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred. Your study data is safely saved in your account.'}
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={this.handleReset}
              variant="outline"
              size="sm"
              icon={RefreshCw}
              className="text-xs"
            >
              Refresh View
            </Button>
            <Button
              onClick={this.handleNavigateHome}
              size="sm"
              icon={Home}
              className="text-xs bg-[var(--primary)] hover:opacity-90 text-[var(--on-primary)]"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

