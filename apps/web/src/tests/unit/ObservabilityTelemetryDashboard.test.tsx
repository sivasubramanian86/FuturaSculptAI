import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObservabilityTelemetryDashboard } from '../../components/ObservabilityTelemetryDashboard';
import { en } from '../../i18n/locales/en';
import { api } from '../../services/api';

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

  it('renders BigQuery Vault tab, displays FinOps byte cap and queries ledger', async () => {
    const mockBigQueryData = {
      dataset: 'genai-apac-2026-491004.futurasculpt_vault',
      nodes: [
        {
          node_id: 'OUT-001',
          node_type: 'outcome',
          name: 'Zero Defect Product Recalls',
          properties: '{"criticality":"critical"}',
          horizon_year: 0,
        },
      ],
      outcomes: [
        {
          scenario_id: 'SCN-AUGMENTED-Y1',
          horizon_year: 1,
          productivity_gain: 22.5,
          human_allocation_pct: 60.0,
          agent_allocation_pct: 40.0,
          active_agents: 1,
          active_roles: 2,
          wage_bond_escrow_usd: 50000.0,
          recorded_at: '2026-10-18T00:00:00Z',
        },
      ],
      total: 1,
      source: 'bigquery' as const,
    };

    const spy = vi.spyOn(api, 'getBigQueryVaultLedger').mockResolvedValue(mockBigQueryData);

    render(<ObservabilityTelemetryDashboard i18n={en} />);

    // Click BigQuery Vault tab
    const bqTabBtn = screen.getByRole('button', { name: /BigQuery WorkGraph Vault/i });
    fireEvent.click(bqTabBtn);

    expect(screen.getByText(/Google Cloud BigQuery Temporal Vault Ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/MAXIMUM BYTES BILLED CAP/i)).toBeInTheDocument();
    expect(screen.getByText(/GB \(1,073,741,824 B\)/i)).toBeInTheDocument();
    expect(screen.getByText(/FinOps Safety Gate Enforced/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(0);
      expect(screen.getByText(/LIVE GCP BIGQUERY/i)).toBeInTheDocument();
      expect(screen.getByText(/OUT-001/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero Defect Product Recalls/i)).toBeInTheDocument();
      expect(screen.getByText(/SCN-AUGMENTED-Y1/i)).toBeInTheDocument();
      expect(screen.getByText(/\+22.5%/i)).toBeInTheDocument();
      expect(screen.getByText(/\$50,000/i)).toBeInTheDocument();
    });

    // Switch horizon to Yr 1
    const yr1Btn = screen.getByRole('button', { name: /Yr 1: Augmented/i });
    fireEvent.click(yr1Btn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(1);
    });

    // Click explicit execute query button
    const executeBtn = screen.getByRole('button', { name: /Execute BigQuery Vault Query/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  it('displays BigQuery query error when API call fails', async () => {
    vi.spyOn(api, 'getBigQueryVaultLedger').mockRejectedValue(new Error('BigQuery quota exceeded'));

    render(<ObservabilityTelemetryDashboard i18n={en} />);

    const bqTabBtn = screen.getByRole('button', { name: /BigQuery WorkGraph Vault/i });
    fireEvent.click(bqTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/BigQuery Error: BigQuery quota exceeded/i)).toBeInTheDocument();
    });
  });
});

