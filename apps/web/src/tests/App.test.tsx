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
        tenant_id: 'tenant-food-mfg-01',
        workflow_id: 'WKF-001',
        task_name: 'Continuous Surface Defect Screening',
        role_id: 'ROL-001',
        role_name: 'Packaging Quality Inspector',
        classification: 'AUTOMATE',
        rationale: 'Repetitive high-frequency visual inspection.',
        target_agent_id: 'PackagingVisionAgent',
        target_system: 'Edge-TPU Vision Pipeline',
        baseline_cycle_time_seconds: 45.0,
        target_cycle_time_seconds: 3.0,
        cycle_time_reduction_pct: 93.3,
        human_share_pct: 0.0,
        agent_share_pct: 100.0,
        status: 'DRAFT',
        approved_by: null,
        approval_timestamp: null,
        approval_notes: null,
        evidence_ids: ['EV-001'],
        created_at: '2026-03-01T10:00:00Z',
        updated_at: '2026-03-01T10:00:00Z',
      },
    ],
  };

  const mockOpportunityMetrics = {
    tenant_id: 'tenant-food-mfg-01',
    role_resilience: {
      role_id: 'ROL-001',
      role_name: 'Packaging Quality Inspector',
      score: 82.5,
      tier: 'HIGH_RESILIENCE',
      formula_version: '2026.1-rri',
      components: [
        {
          name: 'Non-routine Judgment',
          weight: 0.35,
          raw_value: 85,
          weighted_value: 29.75,
          rationale: 'Visual testing',
          evidence_ids: ['EV-001'],
        },
      ],
      recommended_pathway: 'Edge AI Systems Operator',
      calculated_at: '2026-03-01T10:00:00Z',
    },
    transition_readiness: [
      {
        from_role_id: 'ROL-001',
        to_role_id: 'ROL-EMG-01',
        score: 77.0,
        shared_skills_pct: 70.0,
        critical_gap_pct: 15.0,
        learning_velocity_pct: 80.0,
        feasibility_tier: 'HIGH_FEASIBILITY',
        formula_version: '2026.1-trs',
        components: [],
        evidence_ids: ['EV-001'],
        calculated_at: '2026-03-01T10:00:00Z',
      },
    ],
    workforce_adaptability: {
      tenant_id: 'tenant-food-mfg-01',
      score: 81.25,
      learning_velocity_pct: 85.0,
      tech_absorption_pct: 80.0,
      skill_mobility_rate_pct: 75.0,
      culture_readiness_pct: 85.0,
      adaptability_tier: 'HIGH_ADAPTABILITY',
      cohort_size: 25,
      k_anonymity_passed: true,
      formula_version: '2026.1-wai',
      components: [],
      evidence_ids: ['EV-001'],
      calculated_at: '2026-03-01T10:00:00Z',
    },
    human_opportunity_score: {
      tenant_id: 'tenant-food-mfg-01',
      score: 71.43,
      new_roles_count: 3,
      augmented_tasks_count: 8,
      automated_tasks_count: 2,
      sentiment_tier: 'NET_POSITIVE_TRANSFORMATION',
      formula_version: '2026.1-hos',
      evidence_ids: ['EV-001'],
      calculated_at: '2026-03-01T10:00:00Z',
    },
    cohort_size: 25,
    k_anonymity_passed: true,
    pathways: [
      {
        pathway_id: 'PTH-001',
        tenant_id: 'tenant-food-mfg-01',
        source_role_id: 'ROL-001',
        source_role_name: 'Packaging Quality Inspector',
        target_role_id: 'ROL-EMG-01',
        target_role_name: 'Edge AI Systems Operator',
        transition_readiness: {
          from_role_id: 'ROL-001',
          to_role_id: 'ROL-EMG-01',
          score: 77.0,
          shared_skills_pct: 70.0,
          critical_gap_pct: 15.0,
          learning_velocity_pct: 80.0,
          feasibility_tier: 'HIGH_FEASIBILITY',
          formula_version: '2026.1-trs',
          components: [],
          evidence_ids: ['EV-001'],
          calculated_at: '2026-03-01T10:00:00Z',
        },
        skill_overlap_pct: 70.0,
        skill_gaps: ['Edge ML Telemetry'],
        curriculum: [
          {
            module_id: 'MOD-01',
            title: 'Industrial Computer Vision',
            duration_weeks: 4,
            skill_gaps_addressed: ['Edge ML Telemetry'],
            delivery_format: 'HYBRID',
            certification: 'Level 1 Certified',
          },
        ],
        estimated_duration_weeks: 12,
        wage_impact_pct: 18.5,
        status: 'ACTIVE',
        evidence_ids: ['EV-001'],
        created_at: '2026-03-01T10:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.spyOn(api, 'getWorkGraph').mockResolvedValue(mockWorkGraph as any);
    vi.spyOn(api, 'getScenarios').mockResolvedValue(mockScenarios as any);
    vi.spyOn(api, 'getTrustBoard').mockResolvedValue(mockTrustBoard as any);
    vi.spyOn(api, 'getRoleResilience').mockResolvedValue(mockRoleResilience as any);
    vi.spyOn(api, 'getEvidenceLedger').mockResolvedValue(mockEvidenceLedger as any);
    vi.spyOn(api, 'getTaskMatrix').mockResolvedValue(mockTaskMatrix as any);
    vi.spyOn(api, 'getOpportunityMetrics').mockResolvedValue(mockOpportunityMetrics as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then displays the complete cockpit dashboard', async () => {
    render(<App />);

    expect(screen.getByText(/Sculpting Work Transformation Digital Twin/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
      expect(screen.getAllByText('Zero Recalls').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Augmented Ops')).toBeInTheDocument();
      expect(screen.getByText('Packaging Inspector')).toBeInTheDocument();
      expect(screen.getByText('Plant QA')).toBeInTheDocument();
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

    const refreshBtn = screen.getByRole('button', { name: /Refresh Data/i });
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
    const onboardBtn = screen.getByRole('button', { name: /Onboard Organization/i });
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

  it('handles file upload in evidence drawer', async () => {
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

  it('handles horizon switching and error catching in App', async () => {
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
