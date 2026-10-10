import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TrustScoreCard } from './TrustScoreCard';
import { RoleResilienceResult, TrustScoreResult } from '../types';

describe('TrustScoreCard Component', () => {
  const mockTrustBoardPassed: TrustScoreResult = {
    trust_score: 94.5,
    gate_status: 'PASSED',
    saif_security_score: 98,
    operational_excellence_score: 92,
    reliability_score: 95,
    cost_optimization_score: 90,
    sustainability_score: 88,
    red_lines_breached: 0,
    remediation_recommendations: [],
  };

  const mockTrustBoardFailed: TrustScoreResult = {
    trust_score: 62.0,
    gate_status: 'FAILED',
    saif_security_score: 55,
    operational_excellence_score: 60,
    reliability_score: 65,
    cost_optimization_score: 70,
    sustainability_score: 60,
    red_lines_breached: 2,
    remediation_recommendations: ['Enforce IAM least privilege'],
  };

  const mockHighResilience: RoleResilienceResult = {
    role_id: 'ROL-001',
    role_name: 'Lead Packaging Inspector',
    score: 88.0,
    tier: 'HIGH_RESILIENCE',
    formula_version: 'v1.0.0',
    components: [
      { name: 'Task Diversity', weight: 0.35, raw_value: 85 },
      { name: 'AI Complementarity', weight: 0.30, raw_value: 90 },
      { name: 'Cross-Functional Mobility', weight: 0.20, raw_value: 80 },
      { name: 'Strategic Criticality', weight: 0.15, raw_value: 95 },
    ],
    recommended_pathway: 'Upskill to Autonomous Quality Systems Lead.',
  };

  const mockModerateResilience: RoleResilienceResult = {
    role_id: 'ROL-002',
    role_name: 'Manual Palletizer',
    score: 65.0,
    tier: 'MODERATE_RESILIENCE',
    formula_version: 'v1.0.0',
    components: [{ name: 'Task Diversity', weight: 1.0, raw_value: 65 }],
    recommended_pathway: 'Cross-train into robotic fleet maintenance technician.',
  };

  const mockLowResilience: RoleResilienceResult = {
    role_id: 'ROL-003',
    role_name: 'Data Entry Clerk',
    score: 42.0,
    tier: 'AT_RISK_DISPLACEMENT',
    formula_version: 'v1.0.0',
    components: [{ name: 'Task Diversity', weight: 1.0, raw_value: 42 }],
    recommended_pathway: 'Transition to prompt design and QA verification.',
  };

  it('renders loading placeholder when props are null', () => {
    render(<TrustScoreCard trustBoard={null} roleResilience={null} />);
    expect(screen.getByText(/Evaluating governance posture.../i)).toBeInTheDocument();
  });

  it('renders PASSED TrustBoard and HIGH_RESILIENCE Role correctly', () => {
    render(<TrustScoreCard trustBoard={mockTrustBoardPassed} roleResilience={mockHighResilience} />);

    expect(screen.getByText('GATE: PASSED')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument(); // trust score rounded
    expect(screen.getByText('98%')).toBeInTheDocument(); // saif security
    expect(screen.getByText('Lead Packaging Inspector')).toBeInTheDocument();
    expect(screen.getByText('HIGH RESILIENCE')).toBeInTheDocument();
    expect(screen.getByText('Upskill to Autonomous Quality Systems Lead.')).toBeInTheDocument();
  });

  it('renders FAILED TrustBoard with red lines breached and MODERATE_RESILIENCE', () => {
    render(<TrustScoreCard trustBoard={mockTrustBoardFailed} roleResilience={mockModerateResilience} />);

    expect(screen.getByText('GATE: FAILED')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // red lines breached
    expect(screen.getByText('MODERATE RESILIENCE')).toBeInTheDocument();
    expect(screen.getByText('Manual Palletizer')).toBeInTheDocument();
  });

  it('renders AT_RISK_DISPLACEMENT (default tier color) correctly', () => {
    render(<TrustScoreCard trustBoard={mockTrustBoardPassed} roleResilience={mockLowResilience} />);

    expect(screen.getByText('AT RISK DISPLACEMENT')).toBeInTheDocument();
    expect(screen.getByText('Data Entry Clerk')).toBeInTheDocument();
  });
});
