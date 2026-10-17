import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OpportunityEngine, resetOpportunityEngineCache } from '../../components/OpportunityEngine';
import { api } from '../../services/api';
import { OpportunityMetricsResponse } from '../../types';

describe('OpportunityEngine Component', () => {
  const mockOpportunityMetrics: OpportunityMetricsResponse = {
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
      privacy_notice: null,
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
        skill_gaps: ['Edge ML Telemetry', 'Vision Calibration'],
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
    resetOpportunityEngineCache();
    vi.spyOn(api, 'getOpportunityMetrics').mockResolvedValue(mockOpportunityMetrics);
  });

  afterEach(() => {
    resetOpportunityEngineCache();
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then renders all four deterministic index cards', async () => {
    render(<OpportunityEngine />);

    expect(screen.getByText(/Evaluating deterministic workforce opportunity indices/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Workforce Opportunity Engine & Pathways')).toBeInTheDocument();
      expect(screen.getByText('Role Resilience (RRI)')).toBeInTheDocument();
      expect(screen.getByText('82.5')).toBeInTheDocument();
      expect(screen.getByText('HIGH_RESILIENCE')).toBeInTheDocument();
      expect(screen.getByText('Transition Readiness (TRS)')).toBeInTheDocument();
      expect(screen.getByText('77')).toBeInTheDocument();
      expect(screen.getByText('Adaptability Index (WAI)')).toBeInTheDocument();
      expect(screen.getByText('81.25')).toBeInTheDocument();
      expect(screen.getByText('Human Opportunity (HOS)')).toBeInTheDocument();
      expect(screen.getByText('71.43')).toBeInTheDocument();
    });

    expect(screen.getByText('Edge AI Systems Operator')).toBeInTheDocument();
    expect(screen.getByText('+18.5% Wage Uplift')).toBeInTheDocument();
  });

  it('handles load error with explicit error message', async () => {
    vi.spyOn(api, 'getOpportunityMetrics').mockRejectedValueOnce(new Error('Connection failed'));
    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Connection failed');
    });
  });

  it('handles load error fallback when error object lacks message', async () => {
    vi.spyOn(api, 'getOpportunityMetrics').mockRejectedValueOnce({});
    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load opportunity metrics');
    });
  });

  it('adjusts cohort size slider and masks WAI analytics when cohort drops below k=10 threshold', async () => {
    const suppressedMetrics: OpportunityMetricsResponse = {
      ...mockOpportunityMetrics,
      cohort_size: 6,
      k_anonymity_passed: false,
      workforce_adaptability: {
        ...mockOpportunityMetrics.workforce_adaptability,
        cohort_size: 6,
        k_anonymity_passed: false,
        score: 0.0,
        privacy_notice: 'Cohort size below k=10 threshold',
      },
    };

    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByText('81.25')).toBeInTheDocument();
    });

    vi.spyOn(api, 'getOpportunityMetrics').mockResolvedValueOnce(suppressedMetrics);

    const slider = screen.getByLabelText(/Cohort Size/i);
    fireEvent.change(slider, { target: { value: '6' } });

    await waitFor(() => {
      expect(screen.getByText(/Privacy Threshold Protection/i)).toBeInTheDocument();
      expect(screen.getAllByText(/suppressed/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Cohort n < 10/i)).toBeInTheDocument();
      expect(screen.getByText(/Masked/i)).toBeInTheDocument();
    });
  });

  it('toggles curriculum accordion expansion and collapse', async () => {
    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByText('Edge AI Systems Operator')).toBeInTheDocument();
    });

    const curriculumBtn = screen.getByRole('button', { name: /View Curriculum/i });
    expect(curriculumBtn).toHaveAttribute('aria-expanded', 'false');

    // Expand
    fireEvent.click(curriculumBtn);
    expect(curriculumBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Targeted Learning Modules \(1\):/i)).toBeInTheDocument();
    expect(screen.getByText(/MOD-01: Industrial Computer Vision/i)).toBeInTheDocument();
    expect(screen.getByText(/Level 1 Certified/i)).toBeInTheDocument();

    // Collapse
    fireEvent.click(curriculumBtn);
    expect(curriculumBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Targeted Learning Modules/i)).not.toBeInTheDocument();
  });

  it('opens Right to Appeal modal, submits appeal successfully, and dismisses alert banner', async () => {
    const appealResponse = {
      appeal_id: 'APL-TEST-900',
      pathway_id: 'PTH-001',
      appellant_id: 'EMP-007',
      status: 'PENDING_AUDIT_REVIEW',
      received_at: '2026-03-01T10:00:00Z',
      notice: 'Appeal logged.',
    };

    vi.spyOn(api, 'submitPathwayAppeal').mockResolvedValueOnce(appealResponse);

    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByText('Edge AI Systems Operator')).toBeInTheDocument();
    });

    // Open appeal modal via accessible name from aria-label
    const appealBtn = screen.getByRole('button', { name: /Contest or appeal/i });
    fireEvent.click(appealBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Right to Appeal: PTH-001/i)).toBeInTheDocument();

    // Test Close button ✕
    const closeBtn = screen.getByRole('button', { name: /Close appeal modal/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reopen and test Cancel button
    fireEvent.click(appealBtn);
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reopen and submit form with evidence URI
    fireEvent.click(appealBtn);

    const skillInput = screen.getByLabelText(/Contested Skill Requirement/i);
    const idInput = screen.getByLabelText(/Appellant Employee ID \/ Role/i);
    const rationaleInput = screen.getByLabelText(/Justification & Experiential Context/i);
    const uriInput = screen.getByLabelText(/Supporting Evidence URI/i);

    fireEvent.change(skillInput, { target: { value: 'Edge ML Telemetry' } });
    fireEvent.change(idInput, { target: { value: 'EMP-007' } });
    fireEvent.change(rationaleInput, { target: { value: 'Completed internal vendor robotics training.' } });
    fireEvent.change(uriInput, { target: { value: 'gs://certs/robotics.pdf' } });

    const submitBtn = screen.getByRole('button', { name: /Register Appeal/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.submitPathwayAppeal).toHaveBeenCalledWith({
        pathway_id: 'PTH-001',
        contested_skill: 'Edge ML Telemetry',
        rationale: 'Completed internal vendor robotics training.',
        supporting_evidence_uri: 'gs://certs/robotics.pdf',
        appellant_id: 'EMP-007',
      });
      expect(screen.getByText(/Appeal APL-TEST-900 registered for PTH-001 by EMP-007/i)).toBeInTheDocument();
    });

    // Dismiss status message
    const dismissAlertBtn = screen.getByRole('button', { name: /Dismiss message/i });
    fireEvent.click(dismissAlertBtn);
    expect(screen.queryByText(/Appeal APL-TEST-900/i)).not.toBeInTheDocument();
  });

  it('handles appeal submission without evidence URI and handles submission API failure', async () => {
    vi.spyOn(api, 'submitPathwayAppeal').mockRejectedValueOnce(new Error('Prohibited adverse action'));

    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByText('Edge AI Systems Operator')).toBeInTheDocument();
    });

    const appealBtn = screen.getByRole('button', { name: /Contest or appeal/i });
    fireEvent.click(appealBtn);

    const idInput = screen.getByLabelText(/Appellant Employee ID \/ Role/i);
    const rationaleInput = screen.getByLabelText(/Justification & Experiential Context/i);

    fireEvent.change(idInput, { target: { value: 'EMP-999' } });
    fireEvent.change(rationaleInput, { target: { value: 'Prior experience' } });

    const submitBtn = screen.getByRole('button', { name: /Register Appeal/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Appeal submission failed: Prohibited adverse action/i)).toBeInTheDocument();
    });
  });

  it('prevents submission if required form fields are blank or whitespace', async () => {
    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByText('Edge AI Systems Operator')).toBeInTheDocument();
    });

    const appealBtn = screen.getByRole('button', { name: /Contest or appeal/i });
    fireEvent.click(appealBtn);

    const submitSpy = vi.spyOn(api, 'submitPathwayAppeal').mockResolvedValueOnce({} as any);

    const skillInput = screen.getByLabelText(/Contested Skill Requirement/i);
    fireEvent.change(skillInput, { target: { value: '   ' } });

    const submitBtn = screen.getByRole('button', { name: /Register Appeal/i });
    expect(submitBtn).toBeDisabled();

    // Trigger form submit directly to verify early return
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('handles fallback branches for contested status and empty skill gaps', async () => {
    const contestedMetrics: OpportunityMetricsResponse = {
      ...mockOpportunityMetrics,
      transition_readiness: [],
      pathways: [
        {
          ...mockOpportunityMetrics.pathways[0],
          status: 'CONTESTED',
          skill_gaps: [],
        },
      ],
    };

    vi.spyOn(api, 'getOpportunityMetrics').mockResolvedValue(contestedMetrics);

    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByText('CONTESTED')).toBeInTheDocument();
    });

    // Open appeal modal with empty skill_gaps
    const appealBtn = screen.getByRole('button', { name: /Contest or appeal/i });
    fireEvent.click(appealBtn);

    const skillInput = screen.getByLabelText(/Contested Skill Requirement/i) as HTMLInputElement;
    expect(skillInput.value).toBe('');
  });

  it('renders privacy threshold protection and masks metrics when k < 10 anonymity fails', async () => {
    vi.spyOn(api, 'getOpportunityMetrics').mockResolvedValueOnce({
      ...mockOpportunityMetrics,
      cohort_size: 5,
      k_anonymity_passed: false,
    });

    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByText(/Privacy Threshold Protection/i)).toBeInTheDocument();
      expect(screen.getByText('🔒 SUPPRESSED')).toBeInTheDocument();
      expect(screen.getByText('Cohort n < 10')).toBeInTheDocument();
      expect(screen.getByText(/Learning velocity: Masked/i)).toBeInTheDocument();
    });
  });

  it('renders fallback values when workforce adaptability properties are omitted', async () => {
    vi.spyOn(api, 'getOpportunityMetrics').mockResolvedValueOnce({
      ...mockOpportunityMetrics,
      k_anonymity_passed: true,
      workforce_adaptability: {
        ...mockOpportunityMetrics.workforce_adaptability,
        score: undefined as unknown as number,
        adaptability_tier: undefined as unknown as any,
        learning_velocity_pct: undefined as unknown as number,
        formula_version: undefined as unknown as string,
      },
    });

    render(<OpportunityEngine />);

    await waitFor(() => {
      expect(screen.getByText('81.25')).toBeInTheDocument();
      expect(screen.getByText('HIGH_ADAPTABILITY')).toBeInTheDocument();
      expect(screen.getByText(/Learning velocity: 85%/i)).toBeInTheDocument();
      expect(screen.getByText('2026.1-wai')).toBeInTheDocument();
    });
  });
});

