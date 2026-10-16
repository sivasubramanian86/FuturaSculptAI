import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObservabilityTelemetryDashboard } from '../../components/ObservabilityTelemetryDashboard';
import { en } from '../../i18n/locales/en';

describe('ObservabilityTelemetryDashboard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders executive header HUD, status badge, and default KPI metric cards', () => {
    render(<ObservabilityTelemetryDashboard i18n={en} />);

    expect(screen.getByText(/AI System Design & Observability Cockpit/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Production Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/P95 REQUEST LATENCY/i)).toBeInTheDocument();
    expect(screen.getByText(/VERTEX CONTEXT CACHING/i)).toBeInTheDocument();
    expect(screen.getByText(/REQUEST VOLUME/i)).toBeInTheDocument();
    expect(screen.getByText(/CIRCUIT BREAKER/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Tier Dynamic Model Routing/i)).toBeInTheDocument();
  });

  it('switches time windows between 5m, 1h, 24h, and 7d', () => {
    render(<ObservabilityTelemetryDashboard i18n={en} />);

    const btn5m = screen.getByRole('button', { name: /^5m$/i });
    const btn24h = screen.getByRole('button', { name: /^24h$/i });
    const btn7d = screen.getByRole('button', { name: /^7d$/i });

    fireEvent.click(btn5m);
    expect(btn5m).toHaveStyle({ color: 'rgb(255, 255, 255)' });

    fireEvent.click(btn24h);
    expect(btn24h).toHaveStyle({ color: 'rgb(255, 255, 255)' });

    fireEvent.click(btn7d);
    expect(btn7d).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });

  it('switches tabs between KPIs, Architecture Mapping, and Trace Inspector', () => {
    render(<ObservabilityTelemetryDashboard i18n={en} />);

    // Switch to Architecture Mapping tab
    const archTabBtn = screen.getByRole('button', { name: /Google Cloud vs Open-Source/i });
    fireEvent.click(archTabBtn);

    expect(screen.getByText(/Production AI System Design: Open Source Video Concepts vs Google Cloud Implementations/i)).toBeInTheDocument();
    expect(screen.getByText(/Kong \/ Envoy \/ Redis Limiter/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloud Armor \+ Cloud Run Ingress/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Vertex AI Context Caching/i).length).toBeGreaterThanOrEqual(1);

    // Switch to Live Trace Inspector tab
    const traceTabBtn = screen.getByRole('button', { name: /Live Trace Inspector/i });
    fireEvent.click(traceTabBtn);

    expect(screen.getByText(/Live Trace Ledger & Provenance Spans/i)).toBeInTheDocument();
    expect(screen.getByText(/trace-br-8921a/i)).toBeInTheDocument();
    expect(screen.getByText(/Future Boardroom/i)).toBeInTheDocument();

    // Switch back to KPI tab
    const kpiTabBtn = screen.getByRole('button', { name: /Real-time Telemetry & KPIs/i });
    fireEvent.click(kpiTabBtn);
    expect(screen.getByText(/P95 REQUEST LATENCY/i)).toBeInTheDocument();
  });

  it('runs synthetic latency check probe and adds trace entry', async () => {
    render(<ObservabilityTelemetryDashboard i18n={en} />);

    const runProbeBtn = screen.getByRole('button', { name: /Run Synthetic Latency Check/i });
    fireEvent.click(runProbeBtn);

    expect(screen.getByText(/Benchmarking P95 round-trip latency/i)).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText(/Probe completed: .*ms P95 latency\. Gateway resilient\./i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('exports telemetry audit JSON on export button click', () => {
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:http://localhost/mock-telemetry');
    const revokeObjectURLSpy = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    render(<ObservabilityTelemetryDashboard i18n={en} />);

    const exportBtn = screen.getByRole('button', { name: /Export Telemetry Audit Envelope/i });
    fireEvent.click(exportBtn);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/mock-telemetry');

    vi.unstubAllGlobals();
  });

  it('filters trace table by search term on trace inspector tab', () => {
    render(<ObservabilityTelemetryDashboard i18n={en} />);

    // Switch to Trace Inspector
    const traceTabBtn = screen.getByRole('button', { name: /Live Trace Inspector/i });
    fireEvent.click(traceTabBtn);

    const searchInput = screen.getByPlaceholderText(/Search by Trace ID, Module, or Verdict/i);

    // Search for "Boardroom"
    fireEvent.change(searchInput, { target: { value: 'Boardroom' } });
    expect(screen.getByText(/trace-br-8921a/i)).toBeInTheDocument();
    expect(screen.queryByText(/trace-aud-7712b/i)).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText(/trace-aud-7712b/i)).toBeInTheDocument();
  });
});
