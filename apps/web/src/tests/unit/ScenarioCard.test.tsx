import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScenarioCard } from '../../components/ScenarioCard';
import { FutureScenario, ScenarioSimulationResponse } from '../../types';
import { api } from '../../services/api';

describe('ScenarioCard Component', () => {
  const mockScenarios: FutureScenario[] = [
    {
      scenario_id: 'SCEN-001',
      tenant_id: 'tenant-01',
      title: 'Human-Centered Inspection Augmentation',
      scenario_class: 'conservative',
      narrative_summary: 'Augments operators with edge computer vision.',
      horizon_years: 3,
      ebitda_impact_usd: 1200000,
      transition_cost_usd: 350000,
      net_new_roles: 3,
      augmented_roles: 6,
      displaced_tasks_pct: 15.0,
      confidence_score: 0.92,
      uncertainty_range_pct: 7.5,
      assumptions: ['High optical density cameras installed', 'PLC latency < 50ms'],
      invalidation_triggers: ['Worker resistance > 20%', 'Supplier chip delays'],
      counterfactuals: [
        'Without copilot assistance, expected recall loss remains at $1.8M.',
        'Delayed tablet adoption costs 12% in competitor throughput advantage.',
        '100% manual inspection incurs continuous overtime expenditure.',
      ],
      primary_technologies: ['Vertex AI Search'],
      evidence_ids: ['EV-001'],
    },
    {
      scenario_id: 'SCEN-002',
      tenant_id: 'tenant-01',
      title: 'Accelerated Agent Fleet Deployment',
      scenario_class: 'accelerated',
      narrative_summary: 'Autonomous robots assume palletizing tasks.',
      horizon_years: 3,
      ebitda_impact_usd: 2500000,
      transition_cost_usd: 800000,
      net_new_roles: 5,
      augmented_roles: 10,
      displaced_tasks_pct: 45.0,
      confidence_score: 0.84,
      uncertainty_range_pct: 12.0,
      assumptions: ['High bandwidth private 5G network active'],
      invalidation_triggers: ['Network packet drop > 2%'],
      counterfactuals: [
        'Delayed multi-agent rollout raises regional unit cost by 18%.',
        'Manual diverter operation bottlenecks conveyor speed.',
        'Skill deficit during camera recalibration limits line availability.',
      ],
      primary_technologies: ['Google ADK'],
      evidence_ids: ['EV-002'],
    },
    {
      scenario_id: 'SCEN-003',
      tenant_id: 'tenant-01',
      title: 'Disruptive Dark Warehouse Conversion',
      scenario_class: 'disruptive',
      narrative_summary: 'Fully lights-out mixing and packaging line.',
      horizon_years: 3,
      ebitda_impact_usd: 4800000,
      transition_cost_usd: 1900000,
      net_new_roles: 2,
      augmented_roles: 4,
      displaced_tasks_pct: 70.0,
      confidence_score: 0.71,
      uncertainty_range_pct: 18.0,
      assumptions: ['Robotics vendor SLA 99.9% uptime'],
      invalidation_triggers: ['Power grid instability'],
      counterfactuals: [
        'Greenfield expansion costs $4.5M if conversion is deferred.',
        'Scrap rate remains at 3.2% without thermal self-healing loop.',
        'Competitor secures retail contracts if cobotic line is delayed.',
      ],
      primary_technologies: ['Cobotics'],
      evidence_ids: ['EV-003'],
    },
    {
      scenario_id: 'SCEN-004',
      tenant_id: 'tenant-01',
      title: 'Frontline Craft Upskilling Paradigm',
      scenario_class: 'human_first',
      narrative_summary: 'Human mastery supported by AI copilot guidance.',
      horizon_years: 3,
      ebitda_impact_usd: 950000,
      transition_cost_usd: 200000,
      net_new_roles: 8,
      augmented_roles: 14,
      displaced_tasks_pct: 25.0,
      confidence_score: 0.96,
      uncertainty_range_pct: 4.0,
      assumptions: ['Apprenticeship modules certified by union'],
      invalidation_triggers: ['Instructor shortage'],
      counterfactuals: [
        'Fully automated approach induces union grievances and turnover.',
        'Without micro-learning shifts, readiness score stays below 45%.',
        'Loss of operator heuristics causes missed edge-case defects.',
      ],
      primary_technologies: ['TrustBoard'],
      evidence_ids: ['EV-004'],
    },
    {
      scenario_id: 'SCEN-005',
      tenant_id: 'tenant-01',
      title: 'Experimental Horizon',
      scenario_class: 'experimental_unknown' as any,
      narrative_summary: 'Wildcard scenario test.',
      horizon_years: 1,
      ebitda_impact_usd: 100000,
      transition_cost_usd: 50000,
      net_new_roles: 1,
      augmented_roles: 2,
      displaced_tasks_pct: 10.0,
      confidence_score: 0.5,
      uncertainty_range_pct: 30.0,
      assumptions: ['None'],
      invalidation_triggers: ['Immediate failure'],
      counterfactuals: ['Experimental hypothesis 1', 'Hypothesis 2', 'Hypothesis 3'],
      primary_technologies: [],
      evidence_ids: [],
    },
  ];

  it('renders loading state when scenarios list is empty', () => {
    render(<ScenarioCard scenarios={[]} />);
    expect(screen.getByText(/Loading scenario simulations/i)).toBeInTheDocument();
  });

  it('renders active scenario details, formatted metrics, and counterfactual lineage', () => {
    render(<ScenarioCard scenarios={mockScenarios} />);

    expect(screen.getByText('Human-Centered Inspection Augmentation')).toBeInTheDocument();
    expect(screen.getByText('CONSERVATIVE HORIZON')).toBeInTheDocument();
    expect(screen.getByText(/\$1,200,000/)).toBeInTheDocument();
    expect(screen.getByText('$350,000')).toBeInTheDocument();
    expect(screen.getByText(/3 Specialized/)).toBeInTheDocument();
    expect(screen.getByText(/92% \(±7\.5% uncertainty envelope\)/)).toBeInTheDocument();
    expect(screen.getByText('Worker resistance > 20% • Supplier chip delays')).toBeInTheDocument();
    expect(screen.getByText(/Counterfactual Lineage \(3 Assumptions\)/)).toBeInTheDocument();
    expect(
      screen.getByText('Without copilot assistance, expected recall loss remains at $1.8M.')
    ).toBeInTheDocument();
  });

  it('switches tabs across different scenario classes', () => {
    render(<ScenarioCard scenarios={mockScenarios} />);

    // Click Accelerated tab
    fireEvent.click(screen.getByRole('tab', { name: 'ACCELERATED' }));
    expect(screen.getByText('Accelerated Agent Fleet Deployment')).toBeInTheDocument();
    expect(screen.getByText('ACCELERATED HORIZON')).toBeInTheDocument();

    // Click Disruptive tab
    fireEvent.click(screen.getByRole('tab', { name: 'DISRUPTIVE' }));
    expect(screen.getByText('Disruptive Dark Warehouse Conversion')).toBeInTheDocument();
    expect(screen.getByText('DISRUPTIVE HORIZON')).toBeInTheDocument();

    // Click Human First tab
    fireEvent.click(screen.getByRole('tab', { name: 'HUMAN FIRST' }));
    expect(screen.getByText('Frontline Craft Upskilling Paradigm')).toBeInTheDocument();
    expect(screen.getByText('HUMAN FIRST HORIZON')).toBeInTheDocument();

    // Click Experimental / fallback style tab
    fireEvent.click(screen.getByRole('tab', { name: 'EXPERIMENTAL UNKNOWN' }));
    expect(screen.getByText('Experimental Horizon')).toBeInTheDocument();
  });

  it('runs counterfactual simulation with custom onSimulate and renders outcome metrics', async () => {
    const mockSimulationResponse: ScenarioSimulationResponse = {
      tenant_id: 'tenant-01',
      scenario: mockScenarios[0],
      simulation_parameters: { adoption_speed_multiplier: 1.2 },
      impact: {
        base_ebitda_usd: 1200000,
        simulated_ebitda_usd: 1450000,
        delta_ebitda_usd: 250000,
        base_transition_cost_usd: 350000,
        simulated_transition_cost_usd: 380000,
        net_roles_created_delta: 2,
        displaced_tasks_pct_simulated: 18.0,
        risk_assessment: 'HIGH_RETURN',
        tripped_triggers: [],
        counterfactual_narrative: 'Simulated parameters accelerate payback period by 3.2 months.',
      },
      simulated_at: new Date().toISOString(),
    };

    const mockSimulateFn = vi.fn().mockResolvedValue(mockSimulationResponse);

    render(<ScenarioCard scenarios={mockScenarios} onSimulate={mockSimulateFn} />);

    // Adjust sliders
    const adoptionSlider = screen.getByLabelText('Adoption speed multiplier');
    fireEvent.change(adoptionSlider, { target: { value: '1.4' } });

    const aggressionSlider = screen.getByLabelText('Automation aggression factor');
    fireEvent.change(aggressionSlider, { target: { value: '1.2' } });

    const wageSlider = screen.getByLabelText('Wage inflation percentage');
    fireEvent.change(wageSlider, { target: { value: '4.5' } });

    const capitalSlider = screen.getByLabelText('Capital cost delta percentage');
    fireEvent.change(capitalSlider, { target: { value: '10.0' } });

    // Click simulate
    const runBtn = screen.getByRole('button', { name: 'Run What-If Counterfactual Simulation' });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText('HIGH_RETURN')).toBeInTheDocument();
    });

    expect(screen.getByText('+$1,450,000')).toBeInTheDocument();
    expect(screen.getByText('(+$250,000 delta)')).toBeInTheDocument();
    expect(screen.getByText('+2 Roles')).toBeInTheDocument();
    expect(screen.getByText('Simulated parameters accelerate payback period by 3.2 months.')).toBeInTheDocument();
  });

  it('renders tripped invalidation triggers warning alert', async () => {
    const mockTrippedResponse: ScenarioSimulationResponse = {
      tenant_id: 'tenant-01',
      scenario: mockScenarios[0],
      simulation_parameters: { adoption_speed_multiplier: 0.4 },
      impact: {
        base_ebitda_usd: 1200000,
        simulated_ebitda_usd: 800000,
        delta_ebitda_usd: -400000,
        base_transition_cost_usd: 350000,
        simulated_transition_cost_usd: 450000,
        net_roles_created_delta: -1,
        displaced_tasks_pct_simulated: 10.0,
        risk_assessment: 'ELEVATED_FRICTION',
        tripped_triggers: ['Operator resistance leads to < 50% copilot usage.'],
        counterfactual_narrative: 'WARNING: Sub-critical adoption rate destabilizes ROI.',
      },
      simulated_at: new Date().toISOString(),
    };

    const mockSimulateFn = vi.fn().mockResolvedValue(mockTrippedResponse);

    render(<ScenarioCard scenarios={mockScenarios} onSimulate={mockSimulateFn} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run What-If Counterfactual Simulation' }));

    await waitFor(() => {
      expect(screen.getByText('ELEVATED_FRICTION')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Boundary Condition Invalidation:/)).toBeInTheDocument();
    expect(screen.getByText('Operator resistance leads to < 50% copilot usage.')).toBeInTheDocument();
    expect(screen.getByText('(-$400,000 delta)')).toBeInTheDocument();
  });

  it('handles simulation failure and displays error banner', async () => {
    const mockSimulateFn = vi.fn().mockRejectedValue(new Error('Network simulation timeout'));

    render(<ScenarioCard scenarios={mockScenarios} onSimulate={mockSimulateFn} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run What-If Counterfactual Simulation' }));

    await waitFor(() => {
      expect(screen.getByText('Network simulation timeout')).toBeInTheDocument();
    });

    // Also test non-Error object rejection
    const mockSimulateStringFn = vi.fn().mockRejectedValue('String error');
    render(<ScenarioCard scenarios={mockScenarios} onSimulate={mockSimulateStringFn} />);
    const buttons = screen.getAllByRole('button', { name: 'Run What-If Counterfactual Simulation' });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Counterfactual simulation failed')).toBeInTheDocument();
    });
  });

  it('resets parameters back to defaults when reset button is clicked', async () => {
    const mockSimulationResponse: ScenarioSimulationResponse = {
      tenant_id: 'tenant-01',
      scenario: mockScenarios[0],
      simulation_parameters: {},
      impact: {
        base_ebitda_usd: 1200000,
        simulated_ebitda_usd: 1200000,
        delta_ebitda_usd: 0,
        base_transition_cost_usd: 350000,
        simulated_transition_cost_usd: 350000,
        net_roles_created_delta: 0,
        displaced_tasks_pct_simulated: 15.0,
        risk_assessment: 'LOW_VOLATILITY',
        tripped_triggers: [],
        counterfactual_narrative: 'Baseline simulation.',
      },
      simulated_at: new Date().toISOString(),
    };

    render(<ScenarioCard scenarios={mockScenarios} onSimulate={vi.fn().mockResolvedValue(mockSimulationResponse)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run What-If Counterfactual Simulation' }));
    await waitFor(() => {
      expect(screen.getByText('LOW_VOLATILITY')).toBeInTheDocument();
    });

    // Click Reset
    fireEvent.click(screen.getByRole('button', { name: 'Reset simulation parameters to defaults' }));
    expect(screen.queryByText('LOW_VOLATILITY')).not.toBeInTheDocument();
  });

  it('exercises fallback risk colors: HIGH_CAPITAL_EXPOSURE and default unknown', async () => {
    const mockHighCapResponse: ScenarioSimulationResponse = {
      tenant_id: 'tenant-01',
      scenario: mockScenarios[0],
      simulation_parameters: {},
      impact: {
        base_ebitda_usd: 1200000,
        simulated_ebitda_usd: 1200000,
        delta_ebitda_usd: 0,
        base_transition_cost_usd: 350000,
        simulated_transition_cost_usd: 480000,
        net_roles_created_delta: 0,
        displaced_tasks_pct_simulated: 15.0,
        risk_assessment: 'HIGH_CAPITAL_EXPOSURE',
        tripped_triggers: [],
        counterfactual_narrative: 'High CapEx.',
      },
      simulated_at: new Date().toISOString(),
    };

    render(<ScenarioCard scenarios={mockScenarios} onSimulate={vi.fn().mockResolvedValue(mockHighCapResponse)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run What-If Counterfactual Simulation' }));
    await waitFor(() => {
      expect(screen.getByText('HIGH_CAPITAL_EXPOSURE')).toBeInTheDocument();
    });

    // Test unknown risk string
    const mockUnknownRisk: ScenarioSimulationResponse = {
      ...mockHighCapResponse,
      impact: {
        ...mockHighCapResponse.impact,
        risk_assessment: 'UNKNOWN_RISK' as any,
      },
    };
    render(<ScenarioCard scenarios={mockScenarios} onSimulate={vi.fn().mockResolvedValue(mockUnknownRisk)} />);
    const buttons = screen.getAllByRole('button', { name: 'Run What-If Counterfactual Simulation' });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(screen.getByText('UNKNOWN_RISK')).toBeInTheDocument();
    });
  });

  it('uses api.simulateScenario as fallback when onSimulate prop is omitted', async () => {
    const spy = vi.spyOn(api, 'simulateScenario').mockResolvedValue({
      tenant_id: 'tenant-01',
      scenario: mockScenarios[0],
      simulation_parameters: {},
      impact: {
        base_ebitda_usd: 1200000,
        simulated_ebitda_usd: 1300000,
        delta_ebitda_usd: 100000,
        base_transition_cost_usd: 350000,
        simulated_transition_cost_usd: 350000,
        net_roles_created_delta: 1,
        displaced_tasks_pct_simulated: 16.0,
        risk_assessment: 'LOW_VOLATILITY',
        tripped_triggers: [],
        counterfactual_narrative: 'API fallback called.',
      },
      simulated_at: new Date().toISOString(),
    });

    render(<ScenarioCard scenarios={mockScenarios} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run What-If Counterfactual Simulation' }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(screen.getByText('API fallback called.')).toBeInTheDocument();
    });

    spy.mockRestore();
  });

  it('handles negative capital cost delta slider change', () => {
    render(<ScenarioCard scenarios={mockScenarios} />);
    const capitalSlider = screen.getByLabelText('Capital cost delta percentage');
    fireEvent.change(capitalSlider, { target: { value: '-10.0' } });
    expect(screen.getByText('-10%')).toBeInTheDocument();
  });

  it('handles scenario with missing invalidation triggers and counterfactuals gracefully', () => {
    const bareScenario: FutureScenario = {
      ...mockScenarios[0],
      scenario_id: 'SCEN-BARE',
      invalidation_triggers: undefined as any,
      counterfactuals: undefined as any,
    };
    render(<ScenarioCard scenarios={[bareScenario]} />);
    expect(screen.getByText(/Counterfactual Lineage \(0 Assumptions\)/)).toBeInTheDocument();
  });
});


