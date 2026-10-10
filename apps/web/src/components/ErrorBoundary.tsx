/**
 * React Error Boundary component for FuturaSculptAI Cockpit.
 * Catches unhandled render errors, logs them via structured logger,
 * and presents an accessible recovery interface conforming to WCAG 2.1 AA.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Unhandled React component exception:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="glass-panel panel-card"
          style={{
            margin: '24px',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid var(--accent-rose, #f43f5e)',
            background: 'rgba(244,63,94,0.06)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Digital Twin Interface Interrupted
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px' }}>
            A client-side runtime exception occurred. The underlying state is isolated and secure.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--accent-rose)',
                textAlign: 'left',
                maxWidth: '600px',
                margin: '0 auto 20px',
                overflowX: 'auto',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReset}
            aria-label="Reload cockpit interface"
          >
            🔄 Reload Cockpit Interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
