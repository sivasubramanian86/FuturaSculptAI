/**
 * Future Scenario Foundry component.
 * Displays predictive scenario modeling across conservative, accelerated, disruptive,
 * and human-first workforce horizons with financial and headcount metrics.
 * Includes interactive What-If Counterfactual Simulator & Sensitivity Workbench.
 * Conforms to WCAG 2.1 AA with role="region", tablist semantics, and accessible form controls.
 */

import React, { useState } from 'react';
import { api } from '../services/api';
import {
  FutureScenario,
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
} from '../types';
import { TranslationKeys } from '../i18n';
import { en } from '../i18n/locales/en';

export interface ScenarioCardProps {
  /** Array of simulated future workforce scenarios. */
  scenarios: FutureScenario[];
  /** Optional custom simulation runner for testing or mocking. */
  onSimulate?: (req: ScenarioSimulationRequest) => Promise<ScenarioSimulationResponse>;
  /** Optional localized translations dictionary. */
  i18n?: TranslationKeys;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenarios, onSimulate, i18n }) => {
  const t = i18n || en;
  const [activeTab, setActiveTab] = useState<string>(

    scenarios.length > 0 ? scenarios[0].scenario_id : 'SCEN-001'
  );

  // Counterfactual Workbench state
  const [adoptionSpeed, setAdoptionSpeed] = useState<number>(1.0);
  const [wageInflation, setWageInflation] = useState<number>(3.0);
  const [automationAggression, setAutomationAggression] = useState<number>(1.0);
  const [capitalCostDelta, setCapitalCostDelta] = useState<number>(0.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResponse | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const activeScenario = scenarios.find((s) => s.scenario_id === activeTab) || scenarios[0];

  if (!activeScenario) {
    return (
      <div className="glass-panel panel-card" role="status" aria-live="polite">
        Loading scenario simulations...
      </div>
    );
  }

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getBadgeStyle = (sClass: string) => {
    switch (sClass) {
      case 'conservative':
        return { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' };
      case 'accelerated':
        return { color: '#6366f1', bg: 'rgba(99,102,241,0.15)' };
      case 'disruptive':
        return { color: '#a855f7', bg: 'rgba(168,85,247,0.15)' };
      case 'human_first':
        return { color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
      default:
        return { color: '#94a3b8', bg: 'rgba(255,255,255,0.1)' };
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH_RETURN':
        return 'var(--accent-emerald)';
      case 'LOW_VOLATILITY':
        return 'var(--accent-cyan)';
      case 'HIGH_CAPITAL_EXPOSURE':
        return 'var(--accent-amber)';
      case 'ELEVATED_FRICTION':
        return 'var(--accent-rose)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationError(null);
    try {
      const payload: ScenarioSimulationRequest = {
        scenario_id: activeScenario.scenario_id,
        adoption_speed_multiplier: adoptionSpeed,
        wage_inflation_pct: wageInflation,
        automation_aggression: automationAggression,
        capital_cost_delta_pct: capitalCostDelta,
      };

      const result = onSimulate
        ? await onSimulate(payload)
        : await api.simulateScenario(payload);
      setSimulationResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Counterfactual simulation failed';
      setSimulationError(msg);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetParameters = () => {
    setAdoptionSpeed(1.0);
    setWageInflation(3.0);
    setAutomationAggression(1.0);
    setCapitalCostDelta(0.0);
    setSimulationResult(null);
    setSimulationError(null);
  };

  const badgeStyle = getBadgeStyle(activeScenario.scenario_class);

  const invalidationTriggers = activeScenario.invalidation_triggers ?? [];
  const counterfactuals = activeScenario.counterfactuals ?? [];

  return (
    <div className="glass-panel panel-card" role="region" aria-label="Future Scenario Foundry">
      <div className="section-header">
        <h2 className="section-title">
          <span>🔮</span> {t.wgScenariosTitle}
        </h2>
        <span
          className="badge"
          style={{ background: badgeStyle.bg, color: badgeStyle.color, border: 'none' }}
          aria-label={`Scenario class: ${activeScenario.scenario_class}`}
        >
          {activeScenario.scenario_class.replace('_', ' ').toUpperCase()} HORIZON
        </span>
      </div>

      {/* Scenario Class Selector Tabs */}
      <div
        className="cockpit-tabs"
        role="tablist"
        aria-label="Scenario Class Projections"
        style={{ marginBottom: '16px' }}
      >
        {scenarios.map((scen) => (
          <button
            key={scen.scenario_id}
            type="button"
            role="tab"
            aria-selected={activeTab === scen.scenario_id}
            className={`tab-btn ${activeTab === scen.scenario_id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(scen.scenario_id);
              setSimulationResult(null);
            }}
          >
            {scen.scenario_class.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Active Scenario Card Body */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          {activeScenario.title}
        </h3>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            marginBottom: '16px',
            lineHeight: 1.6,
          }}
        >
          {activeScenario.narrative_summary}
        </p>

        {/* Metrics Grid */}
        <div
          className="grid-cards"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '16px' }}
        >
          <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NET EBITDA IMPACT</div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--accent-emerald)',
                marginTop: '4px',
              }}
            >
              +{formatCurrency(activeScenario.ebitda_impact_usd)}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TRANSITION INVESTMENT</div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--accent-amber)',
                marginTop: '4px',
              }}
            >
              {formatCurrency(activeScenario.transition_cost_usd)}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NET NEW ROLES</div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                marginTop: '4px',
              }}
            >
              +{activeScenario.net_new_roles} Specialized
            </div>
          </div>
        </div>

        {/* Confidence and Invalidation Triggers */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <div>
            <strong>Confidence Score:</strong> {(activeScenario.confidence_score * 100).toFixed(0)}% (±
            {activeScenario.uncertainty_range_pct}% uncertainty envelope)
          </div>
          <div>
            <strong>Invalidation Triggers:</strong> {invalidationTriggers.join(' • ')}
          </div>
        </div>

        {/* Counterfactual Lineage (Minimum 3 Assumptions) */}
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚖️</span> Counterfactual Lineage ({counterfactuals.length} Assumptions)
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '18px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {counterfactuals.map((cf, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {cf}
              </li>
            ))}
          </ul>
        </div>

        {/* What-If Counterfactual Workbench Section */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(99, 102, 241, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent-indigo)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🎛️ What-If Parameter Sensitivity & Simulation</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetParameters}
              style={{ fontSize: '11px', padding: '4px 8px' }}
              aria-label="Reset simulation parameters to defaults"
            >
              Reset Defaults
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            <div>
              <label
                htmlFor="adoption-speed-input"
                style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}
              >
                Adoption Speed Multiplier: <strong>{adoptionSpeed.toFixed(1)}x</strong>
              </label>
              <input
                id="adoption-speed-input"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={adoptionSpeed}
                onChange={(e) => setAdoptionSpeed(parseFloat(e.target.value))}
                style={{ width: '100%' }}
                aria-label="Adoption speed multiplier"
              />
            </div>

            <div>
              <label
                htmlFor="aggression-input"
                style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}
              >
                Automation Aggression: <strong>{automationAggression.toFixed(1)}x</strong>
              </label>
              <input
                id="aggression-input"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={automationAggression}
                onChange={(e) => setAutomationAggression(parseFloat(e.target.value))}
                style={{ width: '100%' }}
                aria-label="Automation aggression factor"
              />
            </div>

            <div>
              <label
                htmlFor="wage-inflation-input"
                style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}
              >
                Wage Inflation %: <strong>{wageInflation.toFixed(1)}%</strong>
              </label>
              <input
                id="wage-inflation-input"
                type="range"
                min="-2.0"
                max="10.0"
                step="0.5"
                value={wageInflation}
                onChange={(e) => setWageInflation(parseFloat(e.target.value))}
                style={{ width: '100%' }}
                aria-label="Wage inflation percentage"
              />
            </div>

            <div>
              <label
                htmlFor="capital-cost-input"
                style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}
              >
                Capital Cost Delta %: <strong>{capitalCostDelta >= 0 ? `+${capitalCostDelta}` : capitalCostDelta}%</strong>
              </label>
              <input
                id="capital-cost-input"
                type="range"
                min="-20.0"
                max="50.0"
                step="5.0"
                value={capitalCostDelta}
                onChange={(e) => setCapitalCostDelta(parseFloat(e.target.value))}
                style={{ width: '100%' }}
                aria-label="Capital cost delta percentage"
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            style={{ width: '100%', marginBottom: simulationResult || simulationError ? '12px' : '0' }}
            aria-label="Run What-If Counterfactual Simulation"
          >
            {isSimulating ? 'Simulating Dynamic Scenario...' : 'Run Counterfactual Simulation'}
          </button>

          {/* Simulation Error Alert */}
          {simulationError && (
            <div
              className="error-banner"
              role="alert"
              style={{ marginTop: '12px', fontSize: '12px', padding: '8px' }}
            >
              {simulationError}
            </div>
          )}

          {/* Simulation Result Output */}
          {simulationResult && (
            <div
              className="glass-panel"
              role="region"
              aria-label="Counterfactual Simulation Outcome"
              style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Simulated Outcome:</span>
                <span
                  className="badge"
                  style={{
                    color: getRiskColor(simulationResult.impact.risk_assessment),
                    border: `1px solid ${getRiskColor(simulationResult.impact.risk_assessment)}`,
                    fontSize: '11px',
                  }}
                  aria-label={`Risk assessment: ${simulationResult.impact.risk_assessment}`}
                >
                  {simulationResult.impact.risk_assessment}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginBottom: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SIMULATED EBITDA</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    +{formatCurrency(simulationResult.impact.simulated_ebitda_usd)}
                  </div>
                  <div style={{ fontSize: '10px', color: simulationResult.impact.delta_ebitda_usd >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    ({simulationResult.impact.delta_ebitda_usd >= 0 ? '+' : ''}
                    {formatCurrency(simulationResult.impact.delta_ebitda_usd)} delta)
                  </div>
                </div>

                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TRANSITION COST</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                    {formatCurrency(simulationResult.impact.simulated_transition_cost_usd)}
                  </div>
                </div>

                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ROLES SHIFT</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {simulationResult.impact.net_roles_created_delta >= 0 ? '+' : ''}
                    {simulationResult.impact.net_roles_created_delta} Roles
                  </div>
                </div>
              </div>

              {/* Tripped Invalidation Triggers Alert */}
              {simulationResult.impact.tripped_triggers.length > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: 'var(--accent-rose)',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    marginBottom: '8px',
                  }}
                  role="alert"
                >
                  <strong>⚠️ Boundary Condition Invalidation:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                    {simulationResult.impact.tripped_triggers.map((trig, idx) => (
                      <li key={idx}>{trig}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {simulationResult.impact.counterfactual_narrative}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
