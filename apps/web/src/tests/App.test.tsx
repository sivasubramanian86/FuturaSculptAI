import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import { api } from '../services/api';

describe('App Component', () => {
  const mockWorkGraph = {
    graph_id: 'WG-001',
    nodes: [
      {
        node_id: 'OUT-001',
        name: 'Zero Recalls',
        node_type: 'outcome' as const,
        description: 'Quality guarantee.',
        properties: {},
        evidence_ids: ['EV-001'],
      },
    ],
    edges: [],
  };

  const mockScenarios = {
    sector: 'food_manufacturing',
    scenarios: [
      {
        scenario_id: 'SCEN-001',
        title: 'Augmented Ops',
        scenario_class: 'conservative' as const,
        narrative_summary: 'Operator augmentation.',
        time_horizon_months: 18,
        ebitda_impact_usd: 1000000,
        transition_cost_usd: 200000,
        net_new_roles: 2,
        confidence_score: 0.9,
        uncertainty_range_pct: 5,
        assumptions: ['High reliability'],
        invalidation_triggers: ['Downtime > 5%'],
        evidence_ids: ['EV-001'],
      },
    ],
  };

  const mockTrustBoard = {
    trust_score: 95,
    gate_status: 'PASSED' as const,
    saif_security_score: 98,
    operational_excellence_score: 90,
    reliability_score: 92,
    cost_optimization_score: 88,
    sustainability_score: 85,
    red_lines_breached: 0,
    remediation_recommendations: [],
  };

  const mockRoleResilience = {
    role_id: 'ROL-001',
    role_name: 'Packaging Inspector',
    score: 85,
    tier: 'HIGH_RESILIENCE' as const,
    formula_version: 'v1.0.0',
    components: [{ name: 'Task Diversity', weight: 1.0, raw_value: 85 }],
    recommended_pathway: 'Upskill to Lead Specialist.',
  };

  const mockEvidenceLedger = [
    {
      evidence_id: 'EV-001',
      sha256_hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      source_uri: 'gs://evidence/sop.pdf',
      source_type: 'pdf' as const,
      sensitivity: 'internal' as const,
      provenance: {
        author_or_source: 'Plant QA',
        publication_date: '2026-03-01',
        freshness_horizon_days: 180,
        confidence: 0.99,
      },
      content: {
        language: 'en',
        normalized_text: 'Sample SOP content.',
        segments: [{ segment_id: 's-1', text: 'Step 1' }],
      },
      acl: ['role:analyst'],
      ingested_at: '2026-03-01T10:00:00Z',
    },
  ];

  const mockTaskMatrix = {
    tenant_id: 'tenant-food-mfg-01',
    workflow_id: 'WKF-001',
    workflow_name: 'High-Speed Packaging Line Quality Inspection',
    total_tasks: 1,
    classification_summary: { AUTOMATE: 1 },
    overall_human_share_pct: 0.0,
    overall_agent_share_pct: 100.0,
    overall_cycle_time_reduction_pct: 93.3,
    tasks: [
      {
        task_id: 'TSK-001',
        task_name: 'Optical Defect Rejection',
        name: 'Optical Defect Rejection',
        role_name: 'Packaging Inspector',
        classification: 'AUTOMATE' as const,
        description: 'Auto divert packages with seal defects.',
        current_taxonomy: 'AUTOMATE' as const,
        suggested_taxonomy: 'AUTOMATE' as const,
        human_share_pct: 0.0,
        agent_share_pct: 100.0,
        current_cycle_time_sec: 45.0,
        projected_cycle_time_sec: 3.0,
        target_agent: 'VisionDefectAgent',
        target_system: 'Edge-TPU Diverter',
        taxonomy_rationale: 'Fully automatable vision task.',
        evidence_ids: ['EV-001'],
        approval_gate_level: 'A2' as const,
        approval_status: 'PENDING' as const,
      },
    ],
  };

  const mockOpportunityMetrics = {
    tenant_id: 'tenant-food-mfg-01',
    total_workers_analyzed: 50,
    differential_privacy_k: 10,
    is_privacy_masked: false,
    privacy_disclosure: 'Cohort k>=10 protected.',
    average_rri: 78.4,
    average_trs: 84.1,
    average_wai: 88.0,
    average_hos: 91.2,
    role_pathways_count: 3,
    active_appeals_count: 0,
    pathways: [],
    recent_appeals: [],
  };

  const mockGovernancePosture = {
    tenant_id: 'tenant-food-mfg-01',
    overall_score: 94.3,
    overall_trust_score: 94.3,
    policy_version: 'v1.0.0',
    red_lines_breached: 0,
    gate_status: 'APPROVED' as const,
    active_blocker: false,
    blocker_reason: null,
    framework: 'Google Cloud Well-Architected Framework (8 Pillars)',
    pillars: [],
    saif_controls: [],
    saif_matrix: [],
  };

  const mockInvestorLens = {
    tenant_id: 'tenant-food-mfg-01',
    organization_name: 'Apex Food Processing',
    simulation_timestamp: '2026-03-31T00:00:00Z',
    transformation_thesis: 'Operator upskilling and vision telemetry.',
    disclaimer: 'Forward-looking simulation.',
    projected_ebitda_impact_usd: 1250000,
    transition_capex_usd: 200000,
    three_year_net_npv_usd: 2975000,
    net_roi_multiple: 6.25,
    payback_period_months: 1.9,
    diligence_pack_certificate: 'DIL-TEST-12345',
    assumptions_applied: {
      wage_uplift_multiplier: 1.0,
      automation_yield_factor: 1.0,
      transition_capex_usd: 200000,
      capex_investment_usd: 200000,
      annual_opex_savings_usd: 650000,
      annual_throughput_gain_usd: 600000,
      discount_rate_pct: 8.5,
      projection_years: 3,
    },
    ebitda_unlock_annual_usd: 1250000,
  };

  beforeEach(() => {
    vi.spyOn(api, 'getWorkGraph').mockResolvedValue(mockWorkGraph as any);
    vi.spyOn(api, 'getScenarios').mockResolvedValue(mockScenarios as any);
    vi.spyOn(api, 'getTrustBoard').mockResolvedValue(mockTrustBoard as any);
    vi.spyOn(api, 'getRoleResilience').mockResolvedValue(mockRoleResilience as any);
    vi.spyOn(api, 'getEvidenceLedger').mockResolvedValue(mockEvidenceLedger as any);
    vi.spyOn(api, 'getTaskMatrix').mockResolvedValue(mockTaskMatrix as any);
    vi.spyOn(api, 'getOpportunityMetrics').mockResolvedValue(mockOpportunityMetrics as any);
    vi.spyOn(api, 'getGovernancePosture').mockResolvedValue(mockGovernancePosture as any);
    vi.spyOn(api, 'getInvestorLens').mockResolvedValue(mockInvestorLens as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then displays the citizen overview', async () => {
    render(<App />);

    expect(screen.getByText(/Sculpting Work Transformation Digital Twin/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /Work Transformation Built for People/i })).toBeInTheDocument();
      expect(screen.getByText(/Zero Layoff Protection/i)).toBeInTheDocument();
    });
  });

  it('handles load error gracefully with status message', async () => {
    vi.spyOn(api, 'getWorkGraph').mockRejectedValueOnce(new Error('Network error'));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Connected via resilient local adapter/i)).toBeInTheDocument();
    });
  });

  it('triggers refresh from header', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByTitle('Refresh Data');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(api.getWorkGraph).toHaveBeenCalledTimes(2);
    });
  });

  it('handles organization onboarding flow', async () => {
    vi.spyOn(api, 'onboard').mockResolvedValueOnce({
      tenant_id: 'tenant-dairy-02',
      sector: 'dairy_processing',
      organization_name: 'Apex Dairy Ltd',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
    });

    // Open onboarding modal
    const onboardBtn = screen.getByRole('button', { name: /Bootstrap/i });
    fireEvent.click(onboardBtn);

    expect(screen.getByText(/Onboard Enterprise Transformation/i)).toBeInTheDocument();

    // Fill form and submit
    const submitBtn = screen.getByRole('button', { name: /Bootstrap Digital Twin/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.onboard).toHaveBeenCalled();
      expect(screen.getByText(/Successfully bootstrapped Apex Dairy Ltd!/i)).toBeInTheDocument();
    });
  });

  it('switches between all navigation tabs cleanly', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
    });

    // Navigate to Task Sculptor
    fireEvent.click(screen.getByTitle(/Task Sculptor/i));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Task Redesign Matrix/i })).toBeInTheDocument();
    });

    // Navigate to Opportunity
    fireEvent.click(screen.getByTitle(/Career Opportunities/i));
    await waitFor(() => {
      expect(screen.getByText(/Workforce Opportunity Engine/i)).toBeInTheDocument();
    });

    // Navigate to WorkGraph
    fireEvent.click(screen.getByTitle(/WorkGraph Twin/i));
    await waitFor(() => {
      expect(screen.getAllByText('Zero Recalls').length).toBeGreaterThan(0);
    });

    // Navigate to MultiModal Studio
    fireEvent.click(screen.getByTitle(/MultiModal Studio/i));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /MultiModal Media Studio/i })).toBeInTheDocument();
    });

    // Navigate to Specialist Swarm
    fireEvent.click(screen.getByTitle(/Specialist Swarm/i));
    await waitFor(() => {
      expect(screen.getByText(/Google ADK Multi-Agent Swarm/i)).toBeInTheDocument();
    });

    // Navigate to Governance TrustBoard
    fireEvent.click(screen.getByTitle(/Governance TrustBoard/i));
    await waitFor(() => {
      expect(screen.getByText(/Governance TrustBoard & Investor Lens/i)).toBeInTheDocument();
    });

    // Navigate to FAQ & Help
    fireEvent.click(screen.getByTitle(/FAQ & Help/i));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Frequently Asked Questions & Citizen Help/i })).toBeInTheDocument();
    });

    // Navigate to About
    fireEvent.click(screen.getByTitle(/About FuturaSculptAI/i));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /About FuturaSculptAI/i })).toBeInTheDocument();
    });

    // Navigate to Settings
    fireEvent.click(screen.getByTitle(/Settings/i));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Studio Settings & Preferences/i })).toBeInTheDocument();
    });
  });

  it('handles file upload in evidence tab', async () => {
    const uploadedEnvelope = {
      evidence_id: 'EV-UPLOADED-99',
      tenant_id: 'tenant-food-mfg-01',
      sha256_hash: '9999999999abcdef',
      source_uri: 'gs://evidence/packaging_audit.pdf',
      source_type: 'pdf' as const,
      sensitivity: 'internal' as const,
      provenance: {
        author_or_source: 'Executive Ingestion',
        publication_date: '2026-03-02',
        freshness_horizon_days: 180,
        confidence: 0.95,
      },
      content: {
        language: 'en',
        normalized_text: 'Uploaded document text',
        segments: [],
      },
      acl: ['role:analyst'],
      ingested_at: '2026-03-02T10:00:00Z',
    };

    vi.spyOn(api, 'uploadEvidence').mockResolvedValueOnce(uploadedEnvelope);

    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
    });

    // Switch to evidence tab
    fireEvent.click(screen.getByTitle(/Evidence Vault/i));

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['file contents'], 'packaging_audit.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Ingested packaging_audit.pdf/i)).toBeInTheDocument();
    });

    // Dismiss message
    const dismissBtn = screen.getByRole('button', { name: /Dismiss message/i });
    fireEvent.click(dismissBtn);
    expect(screen.queryByText(/Ingested packaging_audit.pdf/i)).not.toBeInTheDocument();
  });

  it('handles horizon switching and error in WorkGraph tab', async () => {
    const mockTemporalSuccess = {
      horizon_year: 3,
      graph: {
        graph_id: 'WG-TEMPORAL-Y3',
        nodes: [
          {
            node_id: 'AGT-001',
            name: 'PackagingVisionAgent',
            node_type: 'agent' as const,
            description: 'Edge-TPU sensor.',
            properties: {},
            evidence_ids: [],
          },
        ],
        edges: [],
      },
      summary: {
        horizon_year: 3,
        human_task_allocation_pct: 20,
        agent_task_allocation_pct: 80,
        active_roles_count: 3,
        active_agents_count: 2,
      },
    };

    vi.spyOn(api, 'getTemporalWorkGraph').mockResolvedValueOnce(mockTemporalSuccess);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
    });

    // Navigate to WorkGraph tab
    fireEvent.click(screen.getByTitle(/WorkGraph Twin/i));

    // Click Yr 3 tab
    const yr3Btn = screen.getByRole('tab', { name: /Yr 3: Autonomous/i });
    fireEvent.click(yr3Btn);

    await waitFor(() => {
      expect(api.getTemporalWorkGraph).toHaveBeenCalledWith(3);
      expect(screen.getByText(/WorkGraph projected to Horizon Year 3 \(80% agent automation\)/i)).toBeInTheDocument();
    });

    // Test error branch
    vi.spyOn(api, 'getTemporalWorkGraph').mockRejectedValueOnce(new Error('Horizon failed'));
    const yr1Btn = screen.getByRole('tab', { name: /Yr 1: Augmented/i });
    fireEvent.click(yr1Btn);

    await waitFor(() => {
      expect(api.getTemporalWorkGraph).toHaveBeenCalledWith(1);
    });
  });
});
