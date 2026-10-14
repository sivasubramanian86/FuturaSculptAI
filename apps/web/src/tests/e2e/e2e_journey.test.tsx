/**
 * End-to-End (E2E) Browser User Journey Test Suite.
 * Exercises complete user workflows across the FuturaSculptAI platform:
 * Citizen Sanctuary -> Guided Tour -> IAM Persona & Mode -> Navigation Tabs -> Aura Assistant.
 */

import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { api } from '../../services/api';

describe('FuturaSculptAI End-to-End (E2E) User Journey', () => {
  const mockWorkGraph = {
    graph_id: 'WG-001',
    nodes: [
      {
        node_id: 'ROL-001',
        name: 'Packaging Inspector',
        node_type: 'role' as const,
        description: 'Packaging inspection operator.',
        properties: { exposure: 0.65, status: 'active' },
        evidence_ids: ['EV-001'],
      },
      {
        node_id: 'CAP-001',
        name: 'Visual Quality Verification',
        node_type: 'capability' as const,
        description: 'Quality verification capability.',
        properties: { status: 'active' },
        evidence_ids: ['EV-002'],
      },
    ],
    edges: [
      { edge_id: 'ED-01', source_id: 'ROL-001', target_id: 'CAP-001', relationship_type: 'performs' },
    ],
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
    components: [{ name: 'Task Diversity', weight: 1.0, raw_value: 85, weighted_value: 85, rationale: 'Inspection' }],
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

  it('navigates end-to-end through citizen sanctuary, enterprise cockpit, and governance sign-off', async () => {
    render(<App />);

    // 1. Initial render defaults to Citizen Worker Sanctuary view
    await waitFor(() => {
      expect(screen.getByText('FuturaSculptAI')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /Work Transformation Built for People/i })).toBeInTheDocument();
    });

    // 2. Open Guided Tour Modal from button
    const tourButtons = screen.getAllByRole('button', { name: /Guided Tour/i });
    expect(tourButtons.length).toBeGreaterThan(0);
    fireEvent.click(tourButtons[0]);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Industry Simulation & Multi-Tenant Personas/i })).toBeInTheDocument();
    });
    // Dismiss tour modal
    const closeTourBtn = screen.getByRole('button', { name: /Close Tour/i });
    fireEvent.click(closeTourBtn);

    // 3. Switch IAM Persona & View Mode in Header
    const personaSelect = screen.getByLabelText(/Select IAM Persona/i);
    fireEvent.change(personaSelect, { target: { value: 'enterprise_architect' } });

    const modeBtn = screen.getByRole('button', { name: /Citizen \/ Worker View/i });
    fireEvent.click(modeBtn);

    // 4. Verify Enterprise Architect navigation to WorkGraph Studio
    fireEvent.click(screen.getByTitle(/WorkGraph Twin/i));
    await waitFor(() => {
      expect(screen.getAllByText('Packaging Inspector').length).toBeGreaterThan(0);
    });

    // 5. Navigate to Task Sculptor Studio
    fireEvent.click(screen.getByTitle(/Task Sculptor/i));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Task Redesign Matrix/i })).toBeInTheDocument();
    });

    // 6. Navigate to Opportunity & Mobility Engine
    fireEvent.click(screen.getByTitle(/Career Opportunities/i));
    await waitFor(() => {
      expect(screen.getByText(/Workforce Opportunity Engine/i)).toBeInTheDocument();
    });

    // 7. Navigate to Governance & Trust Board
    fireEvent.click(screen.getByTitle(/Governance TrustBoard/i));
    await waitFor(() => {
      expect(screen.getByText(/Governance TrustBoard & Investor Lens/i)).toBeInTheDocument();
    });

    // 8. Open Aura Hologram Assistant beacon
    const auraBeacon = screen.getByLabelText(/Launch Aura 3D Virtual Live Assistant/i);
    fireEvent.click(auraBeacon);
    await waitFor(() => {
      expect(screen.getByText(/Aura — 3D Virtual Live Assistant/i)).toBeInTheDocument();
    });

    // Send a message to Aura
    const inputField = screen.getByPlaceholderText(/Ask Aura anything/i);
    fireEvent.change(inputField, { target: { value: 'How does wage escrow protect my salary?' } });
    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);
    await waitFor(() => {
      expect(screen.getByText(/How does wage escrow protect my salary\?/i)).toBeInTheDocument();
    });

    // Close Aura assistant
    const auraClose = screen.getByRole('button', { name: /Close Aura Assistant/i });
    fireEvent.click(auraClose);
  }, 60000);
});

