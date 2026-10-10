import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { logger } from '../utils/logger';

const ProblemChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Explosive simulated failure');
  }
  return <div>Healthy component tree</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy component tree')).toBeInTheDocument();
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('catches render error, logs via logger, and displays accessible fallback UI', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Digital Twin Interface Interrupted')).toBeInTheDocument();
    expect(screen.getByText('Explosive simulated failure')).toBeInTheDocument();
    expect(loggerErrorSpy).toHaveBeenCalled();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Failover UI</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Failover UI')).toBeInTheDocument();
    expect(screen.queryByText('Digital Twin Interface Interrupted')).not.toBeInTheDocument();
  });

  it('resets error state when reload button is clicked', () => {
    let throwError = true;
    const DynamicChild: React.FC = () => {
      if (throwError) {
        throw new Error('Transient error');
      }
      return <div>Recovered component tree</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Digital Twin Interface Interrupted')).toBeInTheDocument();

    throwError = false;
    const reloadButton = screen.getByRole('button', { name: /Reload cockpit interface/i });
    fireEvent.click(reloadButton);

    rerender(
      <ErrorBoundary>
        <DynamicChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered component tree')).toBeInTheDocument();
  });
});
