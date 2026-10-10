import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ScenarioCard } from './ScenarioCard';
import { FutureScenario } from '../types';

describe('ScenarioCard Component', () => {
  const mockScenarios: FutureScenario[] = [
    {
      scenario_id: 'SCEN-001',
      title: 'Human-Centered Inspection Augmentation',
      scenario_class: 'conservative',
      narrative_summary: 'Augments operators with edge computer vision.',
      time_horizon_months: 18,
      ebitda_impact_usd: 1200000,
      transition_cost_usd: 350000,
      net_new_roles: 3,
      confidence_score: 0.92,
      uncertainty_range_pct: 7.5,
      assumptions: ['High optical density cameras installed', 'PLC latency < 50ms'],
      invalidation_triggers: ['Worker resistance > 20%', 'Supplier chip delays'],
      evidence_ids: ['EV-001'],
    },
    {
      scenario_id: 'SCEN-002',
      title: 'Accelerated Agent Fleet Deployment',
      scenario_class: 'accelerated',
      narrative_summary: 'Autonomous robots assume palletizing tasks.',
      time_horizon_months: 24,
      ebitda_impact_usd: 2500000,
      transition_cost_usd: 800000,
      net_new_roles: 5,
      confidence_score: 0.84,
      uncertainty_range_pct: 12.0,
      assumptions: ['High bandwidth private 5G network active'],
      invalidation_triggers: ['Network packet drop > 2%'],
      evidence_ids: ['EV-002'],
    },
    {
      scenario_id: 'SCEN-003',
      title: 'Disruptive Dark Warehouse Conversion',
      scenario_class: 'disruptive',
      narrative_summary: 'Fully lights-out mixing and packaging line.',
      time_horizon_months: 36,
      ebitda_impact_usd: 4800000,
      transition_cost_usd: 1900000,
      net_new_roles: 2,
      confidence_score: 0.71,
      uncertainty_range_pct: 18.0,
      assumptions: ['Robotics vendor SLA 99.9% uptime'],
      invalidation_triggers: ['Power grid instability'],
      evidence_ids: ['EV-003'],
    },
    {
      scenario_id: 'SCEN-004',
      title: 'Frontline Craft Upskilling Paradigm',
      scenario_class: 'human_first',
      narrative_summary: 'Human mastery supported by AI copilot guidance.',
      time_horizon_months: 12,
      ebitda_impact_usd: 950000,
      transition_cost_usd: 200000,
      net_new_roles: 8,
      confidence_score: 0.96,
      uncertainty_range_pct: 4.0,
      assumptions: ['Apprenticeship modules certified by union'],
      invalidation_triggers: ['Instructor shortage'],
      evidence_ids: ['EV-004'],
    },
    {
      scenario_id: 'SCEN-005',
      title: 'Experimental Horizon',
      scenario_class: 'experimental_unknown' as any,
      narrative_summary: 'Wildcard scenario test.',
      time_horizon_months: 6,
      ebitda_impact_usd: 100000,
      transition_cost_usd: 50000,
      net_new_roles: 1,
      confidence_score: 0.5,
      uncertainty_range_pct: 30.0,
      assumptions: ['None'],
      invalidation_triggers: ['Immediate failure'],
      evidence_ids: [],
    },
  ];

  it('renders loading state when scenarios list is empty', () => {
    render(<ScenarioCard scenarios={[]} />);
    expect(screen.getByText(/Loading scenario simulations/i)).toBeInTheDocument();
  });

  it('renders active scenario details and formats metrics', () => {
    render(<ScenarioCard scenarios={mockScenarios} />);

    expect(screen.getByText('Human-Centered Inspection Augmentation')).toBeInTheDocument();
    expect(screen.getByText('CONSERVATIVE HORIZON')).toBeInTheDocument();
    expect(screen.getByText('$1,200,000')).toBeInTheDocument();
    expect(screen.getByText('$350,000')).toBeInTheDocument();
    expect(screen.getByText('+3 Roles')).toBeInTheDocument();
    expect(screen.getByText('92% (±7.5%)')).toBeInTheDocument();
    expect(screen.getByText('High optical density cameras installed')).toBeInTheDocument();
    expect(screen.getByText('Worker resistance > 20%')).toBeInTheDocument();
  });

  it('switches tabs across different scenario classes', () => {
    render(<ScenarioCard scenarios={mockScenarios} />);

    // Click Accelerated tab
    fireEvent.click(screen.getByRole('button', { name: 'ACCELERATED' }));
    expect(screen.getByText('Accelerated Agent Fleet Deployment')).toBeInTheDocument();
    expect(screen.getByText('ACCELERATED HORIZON')).toBeInTheDocument();

    // Click Disruptive tab
    fireEvent.click(screen.getByRole('button', { name: 'DISRUPTIVE' }));
    expect(screen.getByText('Disruptive Dark Warehouse Conversion')).toBeInTheDocument();
    expect(screen.getByText('DISRUPTIVE HORIZON')).toBeInTheDocument();

    // Click Human First tab
    fireEvent.click(screen.getByRole('button', { name: 'HUMAN FIRST' }));
    expect(screen.getByText('Frontline Craft Upskilling Paradigm')).toBeInTheDocument();
    expect(screen.getByText('HUMAN FIRST HORIZON')).toBeInTheDocument();

    // Click Experimental / fallback style tab
    fireEvent.click(screen.getByRole('button', { name: 'EXPERIMENTAL UNKNOWN' }));
    expect(screen.getByText('Experimental Horizon')).toBeInTheDocument();
  });
});
