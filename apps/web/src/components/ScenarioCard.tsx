/**
 * Future Scenario Foundry component.
 * Displays predictive scenario modeling across conservative, accelerated, disruptive,
 * and human-first workforce horizons with financial and headcount metrics.
 * Conforms to WCAG 2.1 AA with role="region", tablist semantics, and focus indicators.
 */

import React, { useState } from 'react';
import { FutureScenario } from '../types';

export interface ScenarioCardProps {
  /** Array of simulated future workforce scenarios. */
  scenarios: FutureScenario[];
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenarios }) => {
  const [activeTab, setActiveTab] = useState<string>(
    scenarios.length > 0 ? scenarios[0].scenario_id : 'SCEN-001'
  );

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

  const badgeStyle = getBadgeStyle(activeScenario.scenario_class);

  return (
    <div className="glass-panel panel-card" role="region" aria-label="Future Scenario Foundry">
      <div className="section-header">
        <h2 className="section-title">
          <span>🔮</span> Future Scenario Foundry
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
      <div className="cockpit-tabs" role="tablist" aria-label="Scenario Class Projections" style={{ marginBottom: '16px' }}>
        {scenarios.map((scen) => (
          <button
            key={scen.scenario_id}
            type="button"
            role="tab"
            aria-selected={activeTab === scen.scenario_id}
            className={`tab-btn ${activeTab === scen.scenario_id ? 'active' : ''}`}
            onClick={() => setActiveTab(scen.scenario_id)}
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
          {activeScenario.narrative_summary}
        </p>

        {/* Metrics Grid */}
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '16px' }}>
          <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NET EBITDA IMPACT</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
              +{formatCurrency(activeScenario.ebitda_impact_usd)}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TRANSITION INVESTMENT</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '4px' }}>
              {formatCurrency(activeScenario.transition_cost_usd)}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NET NEW ROLES</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
              +{activeScenario.net_new_roles} Specialized
            </div>
          </div>
        </div>

        {/* Confidence and Invalidation Triggers */}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>
            <strong>Confidence Score:</strong> {(activeScenario.confidence_score * 100).toFixed(0)}% (±{activeScenario.uncertainty_range_pct}% uncertainty envelope)
          </div>
          <div>
            <strong>Invalidation Triggers:</strong> {activeScenario.invalidation_triggers.join(' • ')}
          </div>
        </div>
      </div>
    </div>
  );
};
