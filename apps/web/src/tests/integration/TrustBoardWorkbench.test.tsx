import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrustBoardWorkbench } from '../../components/TrustBoardWorkbench';
import { api } from '../../services/api';
import { GovernancePostureResponse, InvestorLensResponse } from '../../types';

describe('TrustBoardWorkbench Component', () => {
  const mockPosture: GovernancePostureResponse = {
    tenant_id: 'tenant-food-mfg-01',
    overall_trust_score: 93.5,
    gate_status: 'PASSED',
    red_lines_breached: 0,
    policy_version: '2026.1-trustboard',
    pillars: [
      {
        pillar: 'Security, Privacy & SAIF',
        score: 100.0,
        weight_pct: 20.0,
        status: 'PASSED',
        failed_checks_count: 0,
        remediation_owner: 'Lead DevSecOps Engineer',
        evidence_ids: ['EV-001'],
      },
      {
        pillar: 'Operational Excellence',
        score: 94.0,
        weight_pct: 15.0,
        status: 'PASSED',
        failed_checks_count: 0,
        remediation_owner: 'Director of Operations',
        evidence_ids: ['EV-001'],
      },
      {
        pillar: 'System Reliability',
        score: 92.5,
        weight_pct: 15.0,
        status: 'PASSED',
        failed_checks_count: 0,
        remediation_owner: 'SRE Lead',
        evidence_ids: ['EV-001'],
      },
      {
        pillar: 'Performance Optimization',
        score: 89.0,
        weight_pct: 10.0,
        status: 'PASSED',
        failed_checks_count: 0,
        remediation_owner: 'Principal Architect',
        evidence_ids: ['EV-001'],
      },
      {
        pillar: 'Cost Optimization / FinOps',
        score: 91.0,
        weight_pct: 10.0,
        status: 'PASSED',
        failed_checks_count: 0,
        remediation_owner: 'FinOps Director',
        evidence_ids: ['EV-001'],
      },
      {
        pillar: 'Sustainability & Carbon',
        score: 88.5,
        weight_pct: 10.0,
        status: 'PASSED',
        failed_checks_count: 0,
        remediation_owner: 'ESG Officer',
        evidence_ids: ['EV-001'],
      },
      {
        pillar: 'Responsible AI & Workforce',
        score: 96.0,
        weight_pct: 10.0,
        status: 'PASSED',
        failed_checks_count: 0,
        remediation_owner: 'Ethics Committee',
        evidence_ids: ['EV-001'],
      },
      {
        pillar: 'Evidence Quality & Provenance',
        score: 98.0,
        weight_pct: 10.0,
        status: 'PASSED',
        failed_checks_count: 0,
        remediation_owner: 'CISO',
        evidence_ids: ['EV-001'],
      },
    ],
    saif_controls: [
      {
        control_id: 'SAIF-01',
        domain: 'EXPAND_ECOSYSTEM',
        title: 'Supply Chain & Pinned Dependency Integrity',
        description: 'Pinned dependencies, SBOM generation, and Model Armor.',
        status: 'VERIFIED',
        evidence_ids: ['EV-001'],
        verifier_component: 'Artifact Registry',
        remediation_owner: 'Lead DevSecOps Engineer',
        notes: 'Poetry and npm locked.',
      },
      {
        control_id: 'SAIF-02',
        domain: 'SAFEGUARD_ARCH',
        title: 'Tenant Boundary Isolation & Zero-Trust Perimeter',
        description: 'Mandatory X-Tenant-ID verification and DLP sanitization.',
        status: 'VERIFIED',
        evidence_ids: ['EV-001'],
        verifier_component: 'DLP Adapter',
        remediation_owner: null,
        notes: null,
      },
    ],
    evaluated_at: '2026-03-01T10:00:00Z',
  };

  const mockInvestorLens: InvestorLensResponse = {
    tenant_id: 'tenant-food-mfg-01',
    organization_name: 'Apex Food Manufacturing',
    transformation_thesis: 'Autonomous Work Transformation unlocks $1,250,000.00 annualized EBITDA.',
    projected_ebitda_impact_usd: 1250000.0,
    transition_cost_usd: 200000.0,
    net_roi_multiple: 6.25,
    payback_period_months: 1.9,
    defensibility_moat_score: 94.5,
    assumptions_applied: {
      wage_uplift_multiplier: 1.0,
      automation_yield_factor: 1.0,
      transition_capex_usd: 200000.0,
    },
    roadmaps: [
      {
        horizon: '30_DAYS',
        title: 'Foundation & Edge Sensor Grounding',
        deliverables: ['Deploy Edge-TPU Vision Pipeline', 'Establish Baseline RRI'],
        target_roi_multiplier: 1.2,
        governance_checkpoint: 'A0 Autonomy Gate Sign-off',
      },
    ],
    disclaimer: 'Simulated scenario projection. Not financial advice.',
    generated_at: '2026-03-01T10:00:00Z',
  };

  beforeEach(() => {
    vi.spyOn(api, 'getGovernancePosture').mockResolvedValue(mockPosture);
    vi.spyOn(api, 'getInvestorLens').mockResolvedValue(mockInvestorLens);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then renders full TrustBoard and SAIF scorecard', async () => {
    render(<TrustBoardWorkbench />);

    expect(screen.getByText(/Auditing enterprise Well-Architected and SAIF security posture/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Governance TrustBoard & Investor Lens')).toBeInTheDocument();
      expect(screen.getByText('93.5')).toBeInTheDocument();
      expect(screen.getByText('GATE: PASSED')).toBeInTheDocument();
      expect(screen.getByText('Security, Privacy & SAIF')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain & Pinned Dependency Integrity')).toBeInTheDocument();
      expect(screen.getByText('Tenant Boundary Isolation & Zero-Trust Perimeter')).toBeInTheDocument();
    });
  });

  it('handles load error with explicit error message', async () => {
    vi.spyOn(api, 'getGovernancePosture').mockRejectedValueOnce(new Error('Network failure'));
    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network failure');
    });
  });

  it('handles load error with fallback message when error lacks message', async () => {
    vi.spyOn(api, 'getGovernancePosture').mockRejectedValueOnce({});
    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load governance posture');
    });
  });

  it('displays deployment blocked banner when red lines are breached and handles gate status badges', async () => {
    const blockedPosture: GovernancePostureResponse = {
      ...mockPosture,
      gate_status: 'BLOCKED',
      red_lines_breached: 2,
    };
    vi.spyOn(api, 'getGovernancePosture').mockResolvedValueOnce(blockedPosture);

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText(/DEPLOYMENT BLOCKED — Responsible AI Red Line Breached/i)).toBeInTheDocument();
      expect(screen.getByText('GATE: BLOCKED')).toBeInTheDocument();
    });

    // Test FLAGGED gate status
    const flaggedPosture: GovernancePostureResponse = {
      ...mockPosture,
      gate_status: 'FLAGGED',
      red_lines_breached: 0,
      pillars: [
        {
          ...mockPosture.pillars[0],
          status: 'FLAGGED',
          score: 80.0,
        },
        ...mockPosture.pillars.slice(1),
      ],
    };
    vi.spyOn(api, 'getGovernancePosture').mockResolvedValueOnce(flaggedPosture);

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText('GATE: FLAGGED')).toBeInTheDocument();
    });
  });

  it('filters SAIF controls by domain and handles domain filter error', async () => {
    const filteredControls = [mockPosture.saif_controls[0]];
    vi.spyOn(api, 'getSAIFControls').mockResolvedValueOnce(filteredControls);

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText('Supply Chain & Pinned Dependency Integrity')).toBeInTheDocument();
    });

    // Click domain filter pill
    const filterBtn = screen.getByRole('button', { name: /EXPAND ECOSYSTEM/i });
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(api.getSAIFControls).toHaveBeenCalledWith('EXPAND_ECOSYSTEM');
    });

    // Click ALL DOMAINS
    vi.spyOn(api, 'getSAIFControls').mockResolvedValueOnce(mockPosture.saif_controls);
    const allBtn = screen.getByRole('button', { name: /ALL DOMAINS/i });
    fireEvent.click(allBtn);

    await waitFor(() => {
      expect(api.getSAIFControls).toHaveBeenCalledWith(undefined);
    });

    // Filter failure
    vi.spyOn(api, 'getSAIFControls').mockRejectedValueOnce(new Error('Filter error'));
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Filter error');
    });

    // Filter failure with fallback message
    vi.spyOn(api, 'getSAIFControls').mockRejectedValueOnce({});
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to filter SAIF controls');
    });
  });

  it('opens remediation modal, submits update successfully, and dismisses action message', async () => {
    const remediationRes = {
      control_id: 'SAIF-01',
      status: 'VERIFIED' as const,
      remediation_owner: 'Senior SecOps Lead',
      notes: 'Added binary authorization signature.',
      updated_at: '2026-03-01T10:00:00Z',
    };
    vi.spyOn(api, 'updateRemediation').mockResolvedValueOnce(remediationRes);

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText('Supply Chain & Pinned Dependency Integrity')).toBeInTheDocument();
    });

    // Open remediation modal
    const remediateBtn = screen.getByRole('button', { name: /Assign or remediate control SAIF-01/i });
    fireEvent.click(remediateBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Governance Remediation: SAIF-01/i)).toBeInTheDocument();

    // Test close button
    const closeBtn = screen.getByRole('button', { name: /Close remediation modal/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open remediation for control with null owner and notes (SAIF-02) to exercise fallbacks
    const remediateBtn2 = screen.getByRole('button', { name: /Assign or remediate control SAIF-02/i });
    fireEvent.click(remediateBtn2);
    expect(screen.getByDisplayValue('Lead DevSecOps Engineer')).toBeInTheDocument();
    const closeBtn2 = screen.getByRole('button', { name: /Close remediation modal/i });
    fireEvent.click(closeBtn2);

    // Reopen and test cancel button
    fireEvent.click(remediateBtn);
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reopen and submit update
    fireEvent.click(remediateBtn);
    const ownerInput = screen.getByLabelText(/Remediation Owner \/ Lead Role/i);
    const notesInput = screen.getByLabelText(/Remediation Audit Notes & Action Rationale/i);
    const checkbox = screen.getByLabelText(/Mark Control Check as VERIFIED/i);

    fireEvent.change(ownerInput, { target: { value: 'Senior SecOps Lead' } });
    fireEvent.change(notesInput, { target: { value: 'Added binary authorization signature.' } });
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Save Remediation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.updateRemediation).toHaveBeenCalledWith({
        control_id: 'SAIF-01',
        remediation_owner: 'Senior SecOps Lead',
        action_notes: 'Added binary authorization signature.',
        resolved: false, // toggled from true to false
      });
      expect(screen.getByText(/Control SAIF-01 updated. Status: VERIFIED/i)).toBeInTheDocument();
    });

    // Dismiss action message
    const dismissBtn = screen.getByRole('button', { name: /Dismiss notification message/i });
    fireEvent.click(dismissBtn);
    expect(screen.queryByText(/Control SAIF-01 updated/i)).not.toBeInTheDocument();
  });

  it('handles remediation update failure and prevents submission on blank inputs', async () => {
    vi.spyOn(api, 'updateRemediation').mockRejectedValueOnce(new Error('IAM permission denied'));

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText('Supply Chain & Pinned Dependency Integrity')).toBeInTheDocument();
    });

    const remediateBtn = screen.getByRole('button', { name: /Assign or remediate control SAIF-01/i });
    fireEvent.click(remediateBtn);

    const submitBtn = screen.getByRole('button', { name: /Save Remediation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Remediation update failed: IAM permission denied/i)).toBeInTheDocument();
    });

    // Test blank input early return guard
    fireEvent.click(remediateBtn);
    const ownerInput = screen.getByLabelText(/Remediation Owner \/ Lead Role/i);
    fireEvent.change(ownerInput, { target: { value: '   ' } });

    const submitSpy = vi.spyOn(api, 'updateRemediation');
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('switches to Investor Lens tab, adjusts assumptions, and simulates updated valuation', async () => {
    const updatedLens: InvestorLensResponse = {
      ...mockInvestorLens,
      projected_ebitda_impact_usd: 1750000.0,
      net_roi_multiple: 8.75,
    };
    vi.spyOn(api, 'simulateInvestorLens').mockResolvedValueOnce(updatedLens);

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText('Governance TrustBoard & Investor Lens')).toBeInTheDocument();
    });

    // Switch to Investor Lens tab
    const investorTab = screen.getByRole('tab', { name: /Investor Lens & Diligence/i });
    fireEvent.click(investorTab);

    expect(screen.getByText(/Enterprise Transformation Thesis \(Apex Food Manufacturing\)/i)).toBeInTheDocument();
    expect(screen.getByText('$1,250,000')).toBeInTheDocument();
    expect(screen.getByText('6.25x')).toBeInTheDocument();

    // Adjust sliders
    const wageSlider = screen.getByLabelText(/Wage Uplift Multiplier/i);
    const yieldSlider = screen.getByLabelText(/Automation Yield Factor/i);
    const capexSlider = screen.getByLabelText(/Transition CapEx/i);

    fireEvent.change(wageSlider, { target: { value: '1.4' } });
    fireEvent.change(yieldSlider, { target: { value: '1.2' } });
    fireEvent.change(capexSlider, { target: { value: '250000' } });

    // Click Recalculate
    const recalcBtn = screen.getByRole('button', { name: /Recalculate Valuation/i });
    fireEvent.click(recalcBtn);

    await waitFor(() => {
      expect(api.simulateInvestorLens).toHaveBeenCalledWith({
        wage_uplift_multiplier: 1.4,
        automation_yield_factor: 1.2,
        transition_capex_usd: 250000,
      });
      expect(screen.getByText(/Investor Lens valuation recalculated/i)).toBeInTheDocument();
      expect(screen.getByText('$1,750,000')).toBeInTheDocument();
      expect(screen.getByText('8.75x')).toBeInTheDocument();
    });

    // Switch back to TrustBoard tab
    const trustboardTab = screen.getByRole('tab', { name: /TrustBoard & SAIF Matrix/i });
    fireEvent.click(trustboardTab);
    expect(screen.getByText('Security, Privacy & SAIF')).toBeInTheDocument();
  });

  it('handles simulation failure in Investor Lens tab', async () => {
    vi.spyOn(api, 'simulateInvestorLens').mockRejectedValueOnce(new Error('Simulation quota exceeded'));

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText('Governance TrustBoard & Investor Lens')).toBeInTheDocument();
    });

    const investorTab = screen.getByRole('tab', { name: /Investor Lens & Diligence/i });
    fireEvent.click(investorTab);

    const recalcBtn = screen.getByRole('button', { name: /Recalculate Valuation/i });
    fireEvent.click(recalcBtn);

    await waitFor(() => {
      expect(screen.getByText(/Simulation failed: Simulation quota exceeded/i)).toBeInTheDocument();
    });
  });

  it('exports Diligence Pack, views modal certificate, and handles export failure', async () => {
    const mockPack = {
      pack_id: 'DIL-tenant-foo-A1B2C3D4',
      tenant_id: 'tenant-food-mfg-01',
      organization_name: 'Apex Food Manufacturing',
      trust_score: 93.5,
      saif_compliance_pct: 100.0,
      red_lines_breached: 0,
      gate_status: 'PASSED',
      evidence_envelopes_count: 5,
      evidence_hashes: ['hash1', 'hash2'],
      cryptographic_seal_hash: '9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff',
      exported_at: '2026-03-01T10:00:00Z',
      disclaimer: 'Anti-Fabrication Notice: mathematically derived.',
    };
    vi.spyOn(api, 'exportDiligencePack').mockResolvedValueOnce(mockPack);

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText('Governance TrustBoard & Investor Lens')).toBeInTheDocument();
    });

    const investorTab = screen.getByRole('tab', { name: /Investor Lens & Diligence/i });
    fireEvent.click(investorTab);

    const exportBtn = screen.getByRole('button', { name: /Export Diligence Evidence Pack/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verified Diligence Evidence Pack: DIL-tenant-foo-A1B2C3D4/i)).toBeInTheDocument();
      expect(screen.getByText(/Cryptographic Seal SHA-256:/i)).toBeInTheDocument();
    });

    // Close diligence modal via Done button
    const doneBtn = screen.getByRole('button', { name: /Done/i });
    fireEvent.click(doneBtn);
    expect(screen.queryByText(/Verified Diligence Evidence Pack/i)).not.toBeInTheDocument();

    // Reopen and close via Close (✕) button
    vi.spyOn(api, 'exportDiligencePack').mockResolvedValueOnce(mockPack);
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verified Diligence Evidence Pack/i)).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /Close diligence modal/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Verified Diligence Evidence Pack/i)).not.toBeInTheDocument();

    // Failure branch
    vi.spyOn(api, 'exportDiligencePack').mockRejectedValueOnce(new Error('Export service unavailable'));
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText(/Diligence export failed: Export service unavailable/i)).toBeInTheDocument();
    });
  });

  it('handles fallback branches for missing pillar scores and unassigned owner', async () => {
    const minimalPosture: GovernancePostureResponse = {
      ...mockPosture,
      pillars: [],
      saif_controls: [
        {
          ...mockPosture.saif_controls[0],
          status: 'ACTION_REQUIRED',
          remediation_owner: null,
        },
      ],
    };
    vi.spyOn(api, 'getGovernancePosture').mockResolvedValueOnce(minimalPosture);

    render(<TrustBoardWorkbench />);

    await waitFor(() => {
      expect(screen.getByText('ACTION_REQUIRED')).toBeInTheDocument();
      expect(screen.getByText(/Unassigned/)).toBeInTheDocument();
    });
  });
});

