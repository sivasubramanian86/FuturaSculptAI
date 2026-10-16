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

  it('creates custom RoleTwin archetype with valid inputs', async () => {
    render(<WorkTwinFabricStudio />);

    const archetypesTab = screen.getByText(/RoleTwin Archetype Catalog/);
    fireEvent.click(archetypesTab);

    // Open register modal
    const registerBtn = screen.getByText('+ Register Custom Role Archetype');
    fireEvent.click(registerBtn);

    const titleInput = screen.getByPlaceholderText(/e\.g\. Cobotics Calibration Specialist/i);
    const purposeInput = screen.getByPlaceholderText(/Purpose & boundary of role simulation/i);
    const skillsInput = screen.getByPlaceholderText(/Joint Calibration, Barrier Inspection/i);

    fireEvent.change(titleInput, { target: { value: 'Cobotics Maintenance Specialist' } });
    fireEvent.change(purposeInput, { target: { value: 'Maintain and calibrate edge cobotic arms.' } });
    fireEvent.change(skillsInput, { target: { value: 'Robotics, Calibration, Safety Audit' } });

    const submitBtn = screen.getByRole('button', { name: /Register Archetype/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createRoleTwin).toHaveBeenCalledWith({
        role_archetype: 'Cobotics Maintenance Specialist',
        declared_purpose: 'Maintain and calibrate edge cobotic arms.',
        skills: ['Robotics', 'Calibration', 'Safety Audit'],
      });
    });
  });

  it('validates required fields and handles creation failures when registering RoleTwin', async () => {
    render(<WorkTwinFabricStudio />);

    const archetypesTab = screen.getByText(/RoleTwin Archetype Catalog/);
    fireEvent.click(archetypesTab);

    fireEvent.click(screen.getByText('+ Register Custom Role Archetype'));

    // Submit with empty inputs
    const form = screen.getByRole('button', { name: /Register Archetype/i }).closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText(/Role archetype title and declared purpose are required/i)).toBeInTheDocument();

    // Fill valid values but API fails
    vi.spyOn(api, 'createRoleTwin').mockRejectedValueOnce(new Error('Quota limit reached'));
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Cobotics Calibration Specialist/i), {
      target: { value: 'Safety Sentinel' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Purpose & boundary of role simulation/i), {
      target: { value: 'Inspect safety corridors.' },
    });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create RoleTwin: Quota limit reached/i)).toBeInTheDocument();
    });

    // Close modal via top right X button
    const closeXBtn = screen.getByRole('button', { name: '✕' });
    fireEvent.click(closeXBtn);
    expect(screen.queryByText('Register Synthetic Role Archetype')).not.toBeInTheDocument();
  });

  it('applies Preset 1 and tests SKEPTICAL stance badge in simulation', async () => {
    const skepticalResult: BoardroomSimulationResult = {
      ...mockBoardroomResult,
      perspectives: [
        {
          role: 'CFO',
          role_title: 'Chief Financial Officer',
          stance: 'SKEPTICAL',
          assessment: 'High capital expenditure without guaranteed immediate payback.',
          key_arguments: ['High initial cost'],
          identified_risks: ['Extended payback cycle'],
          mandatory_conditions: ['Cap initial pilot to Line 3 only'],
          evidence_citations: ['EVD-FIN-COST-01'],
          autonomy_limit: 'WT2_SIMULATE',
        },
        {
          role: 'CHRO',
          role_title: 'Chief Human Resources Officer',
          stance: 'UNKNOWN_STANCE' as any,
          assessment: 'Neutral perspective.',
          key_arguments: ['Worker reskilling'],
          identified_risks: ['Change fatigue'],
          mandatory_conditions: ['Notice period'],
          evidence_citations: [],
          autonomy_limit: 'WT1_ASSIST',
        },
      ],
    };
    vi.spyOn(api, 'simulateFutureBoardroom').mockResolvedValueOnce(skepticalResult);

    render(<WorkTwinFabricStudio />);

    // Click Preset 1
    const preset1Btn = screen.getByText('Preset 1: Line 3 CV & Cobotics');
    fireEvent.click(preset1Btn);
    expect(screen.getByDisplayValue('Line 3 Packaging Computer Vision & Cobotics Deployment')).toBeInTheDocument();

    // Run simulation
    const runBtn = screen.getByText(/Run Governed Boardroom Simulation/);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Chief Financial Officer Twin/i)).toBeInTheDocument();
      expect(screen.getByText('SKEPTICAL')).toBeInTheDocument();
      expect(screen.getByText('UNKNOWN_STANCE')).toBeInTheDocument();
    });
  });

  it('toggles individual personal consent checkboxes and handles consent API errors', async () => {
    render(<WorkTwinFabricStudio />);

    const personalTab = screen.getByText(/Personal WorkTwin/);
    fireEvent.click(personalTab);

    // Get all enabled checkboxes (knowledge, writing, delegated)
    const checkboxes = screen.getAllByRole('checkbox').filter((c) => !(c as HTMLInputElement).disabled);
    expect(checkboxes.length).toBe(3);

    // Toggle checkboxes
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    // Save consent when not revoked
    const saveBtn = screen.getByText('Save Consent & Update Boundary Envelope');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Personal WorkTwin consent envelope updated and verified with audit trail/i)).toBeInTheDocument();
    });

    // Test consent error handling
    vi.spyOn(api, 'registerPersonalTwinConsent').mockRejectedValueOnce(new Error('Consent Ledger Offline'));
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Consent update failed: Consent Ledger Offline/i)).toBeInTheDocument();
    });
  });
});

