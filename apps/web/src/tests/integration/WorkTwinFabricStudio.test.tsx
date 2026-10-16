import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkTwinFabricStudio } from '../../components/WorkTwinFabricStudio';
import { api } from '../../services/api';
import {
  BoardroomSimulationResult,
  WorkTwinManifest,
} from '../../types';

describe('WorkTwinFabricStudio Component', () => {
  const mockManifests: WorkTwinManifest[] = [
    {
      twin_id: 'twin-role-cto',
      tenant_id: 'tenant-food-mfg-01',
      twin_type: 'ROLE_TWIN',
      role_archetype: 'CTO Role Twin',
      declared_purpose: 'Enterprise technology architecture & tech debt simulation.',
      autonomy_level: 'WT2_SIMULATE',
      status: 'ACTIVE',
      skills: ['Architecture Review', 'Cloud FinOps', 'Tech Debt Audit'],
      allowed_tools: ['read_architecture', 'simulate_load'],
      approved_evidence_collections: ['tech-docs'],
      memory_namespaces: ['role/cto'],
      model_tier: 'deep_reasoning',
      token_budget_per_run: 4000,
      created_at: '2026-10-16T00:00:00Z',
      disclosure_text: 'Synthetic Role Archetype • CTO perspective only.',
    },
    {
      twin_id: 'twin-role-inspector',
      tenant_id: 'tenant-food-mfg-01',
      twin_type: 'ROLE_TWIN',
      role_archetype: 'Quality Inspector Role Twin',
      declared_purpose: 'Frontline inspection sensory and defect simulation.',
      autonomy_level: 'WT1_ASSIST',
      status: 'ACTIVE',
      skills: ['Defect Identification', 'Sensory Evaluation'],
      allowed_tools: ['read_sop'],
      approved_evidence_collections: ['sop-docs'],
      memory_namespaces: ['role/inspector'],
      model_tier: 'workhorse',
      token_budget_per_run: 2000,
      created_at: '2026-10-16T00:00:00Z',
      disclosure_text: 'Synthetic Role Archetype • Quality Inspector perspective only.',
    },
  ];

  const mockBoardroomResult: BoardroomSimulationResult = {
    simulation_id: 'sim-boardroom-abc1234',
    proposal_title: 'Line 3 Packaging Computer Vision & Cobotics Deployment',
    proposal_description: 'Deploy edge cameras and robotic arm sorters.',
    sector: 'food_manufacturing',
    target_enterprise: 'Artisan Food Processing Group',
    perspectives: [
      {
        role: 'CEO',
        role_title: 'Chief Executive Officer',
        stance: 'FAVORABLE',
        assessment: 'Unlocks 4.5x quality throughput and strengthens market defensibility.',
        key_arguments: ['Transforms packaging corridor', 'Protects revenue'],
        identified_risks: ['Initial capital outlay'],
        mandatory_conditions: ['Must achieve positive ROI within 9 months'],
        evidence_citations: ['EVD-CV-BENCHMARK-01'],
        autonomy_limit: 'WT2_SIMULATE',
      },
      {
        role: 'CISO',
        role_title: 'Chief Information Security Officer',
        stance: 'CONDITIONAL',
        assessment: 'Edge cameras must be isolated on an air-gapped industrial OT subnet.',
        key_arguments: ['Zero direct cloud telemetry without gateway'],
        identified_risks: ['Industrial OT lateral movement'],
        mandatory_conditions: ['Model Armor packet inspection enabled'],
        evidence_citations: ['EVD-SEC-SAIF-01'],
        autonomy_limit: 'WT2_SIMULATE',
      },
    ],
    conflict_resolution: {
      consensus_points: ['Line 3 is an urgent bottleneck', 'Defect logging needs automation'],
      unresolved_disagreements: ['Capital allocation pace between CFO and CEO'],
      trade_offs: ['Speed vs OT isolation complexity'],
      blocking_controls: ['SAIF OT Isolation Gate', 'Model Armor Inspection'],
      alternative_transformation_paths: ['Phased Line 3 pilot before multi-line rollout'],
      governed_recommendation: 'APPROVE WITH CONDITIONS (Human Executive Sign-off Required)',
      required_human_approvers: ['Plant Operations VP', 'CISO', 'Quality VP'],
    },
    trace_id: 'trace-boardroom-xyz987',
    model_route: 'gemini-2.5-pro (Deep Deliberation)',
    total_cost_usd: 0.0018,
    audit_verdict: 'PASSED_GOVERNED_GATE',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'getWorkTwinManifests').mockResolvedValue(mockManifests);
    vi.spyOn(api, 'simulateFutureBoardroom').mockResolvedValue(mockBoardroomResult);
    vi.spyOn(api, 'createRoleTwin').mockResolvedValue(mockManifests[0]);
    vi.spyOn(api, 'registerPersonalTwinConsent').mockResolvedValue({
      ...mockManifests[0],
      twin_type: 'PERSONAL_WORKTWIN',
      owner_id: 'EMP-4102',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header, tagline, and default boardroom arena', async () => {
    render(<WorkTwinFabricStudio />);
    expect(screen.getByText('Futura WorkTwin Fabric')).toBeInTheDocument();
    expect(
      screen.getByText(/Every role understood\. Every employee augmented\. Every future safely simulated\./)
    ).toBeInTheDocument();
    expect(screen.getByText('Target Transformation Proposal')).toBeInTheDocument();
  });

  it('toggles participating executive twins and applies preset', async () => {
    render(<WorkTwinFabricStudio />);
    
    // Toggle twin pill
    const ctoPill = screen.getByText('CTO Twin');
    fireEvent.click(ctoPill);

    // Apply preset
    const presetBtn = screen.getByText('Preset 2: Agent Swarm');
    fireEvent.click(presetBtn);

    const titleInput = screen.getByDisplayValue('Autonomous Quality Micro-Defect Agent Swarm');
    expect(titleInput).toBeInTheDocument();
  });

  it('runs boardroom simulation and renders synthesis and perspective cards', async () => {
    render(<WorkTwinFabricStudio />);

    const runBtn = screen.getByText(/Run Governed Boardroom Simulation/);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText('Boardroom Conflict & Consensus Synthesis')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/APPROVE WITH CONDITIONS/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Chief Executive Officer Twin/)).toBeInTheDocument();
    expect(screen.getByText(/Chief Information Security Officer Twin/)).toBeInTheDocument();
    expect(screen.getByText(/trace-boardroom-xyz987/)).toBeInTheDocument();
  });

  it('handles boardroom simulation failure gracefully', async () => {
    vi.spyOn(api, 'simulateFutureBoardroom').mockRejectedValueOnce(new Error('Red-line policy violation: termination rejected'));
    render(<WorkTwinFabricStudio />);

    const runBtn = screen.getByText(/Run Governed Boardroom Simulation/);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Red-line policy violation/)).toBeInTheDocument();
    });
  });

  it('switches to RoleTwin Archetype Catalog and displays seeded manifests', async () => {
    render(<WorkTwinFabricStudio />);

    const archetypesTab = screen.getByText(/RoleTwin Archetype Catalog/);
    fireEvent.click(archetypesTab);

    await waitFor(() => {
      expect(screen.getByText('CTO Role Twin')).toBeInTheDocument();
      expect(screen.getByText('Quality Inspector Role Twin')).toBeInTheDocument();
    });

    // Open register modal
    const registerBtn = screen.getByText('+ Register Custom Role Archetype');
    fireEvent.click(registerBtn);
    expect(screen.getByText('Register Synthetic Role Archetype')).toBeInTheDocument();

    // Cancel modal
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
  });

  it('switches to Personal WorkTwin tab, toggles consent, and saves boundary envelope', async () => {
    render(<WorkTwinFabricStudio />);

    const personalTab = screen.getByText(/Personal WorkTwin/);
    fireEvent.click(personalTab);

    expect(screen.getByText(/Elena Vance \(EMP-4102\)/)).toBeInTheDocument();
    expect(screen.getByText('CONSENT ACTIVE')).toBeInTheDocument();

    // Verify prohibited switches are disabled
    const checkboxes = screen.getAllByRole('checkbox');
    const disabledCheckboxes = checkboxes.filter((c) => (c as HTMLInputElement).disabled);
    expect(disabledCheckboxes.length).toBe(2); // Voice clone & Autonomous employment

    // Click revoke button
    const revokeBtn = screen.getByText(/Revoke Personal Twin Immediately/);
    fireEvent.click(revokeBtn);
    expect(screen.getByText('Restore Consent')).toBeInTheDocument();

    // Save consent envelope
    const saveBtn = screen.getByText('Save Consent & Update Boundary Envelope');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.registerPersonalTwinConsent).toHaveBeenCalled();
    });
  });
});
