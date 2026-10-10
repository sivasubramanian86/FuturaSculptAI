import React, { useState } from 'react';
import { FutureScenario } from '../types';

interface ScenarioCardProps {
  scenarios: FutureScenario[];
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenarios }) => {
  const [activeTab, setActiveTab] = useState<string>(
    scenarios.length > 0 ? scenarios[0].scenario_id : 'SCEN-001'
  );

  const activeScenario = scenarios.find((s) => s.scenario_id === activeTab) || scenarios[0];

  if (!activeScenario) {
    return <div className="glass-panel panel-card">Loading scenario simulations...</div>;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getBadgeStyle = (sClass: string) => {
    switch (sClass) {
      case 'conservative': return { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' };
      case 'accelerated': return { color: '#6366f1', bg: 'rgba(99,102,241,0.15)' };
      case 'disruptive': return { color: '#a855f7', bg: 'rgba(168,85,247,0.15)' };
      case 'human_first': return { color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
      default: return { color: '#94a3b8', bg: 'rgba(255,255,255,0.1)' };
    }
  };

  const badgeStyle = getBadgeStyle(activeScenario.scenario_class);

  return (
    <div className="glass-panel panel-card">
      <div className="section-header">
        <h2 className="section-title">
          <span>🔮</span> Future Scenario Foundry
        </h2>
        <span
          className="badge"
          style={{ background: badgeStyle.bg, color: badgeStyle.color, border: 'none' }}
        >
          {activeScenario.scenario_class.replace('_', ' ').toUpperCase()} HORIZON
        </span>
      </div>

      {/* Scenario Class Selector Tabs */}
      <div className="cockpit-tabs" style={{ marginBottom: '16px' }}>
        {scenarios.map((scen) => (
          <button
            key={scen.scenario_id}
            className={`tab-btn ${activeTab === scen.scenario_id ? 'active' : ''}`}
            onClick={() => setActiveTab(scen.scenario_id)}
          >
            {scen.scenario_class.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
        {activeScenario.title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        {activeScenario.narrative_summary}
      </p>

      {/* Financial & Human Opportunity Metrics */}
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>3-YR EBITDA UNLOCK</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {formatCurrency(activeScenario.ebitda_impact_usd)}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TRANSITION INVESTMENT</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '4px' }}>
            {formatCurrency(activeScenario.transition_cost_usd)}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NET NEW ROLES CREATED</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            +{activeScenario.net_new_roles} Roles
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CONFIDENCE SCORE</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#a5b4fc', marginTop: '4px' }}>
            {(activeScenario.confidence_score * 100).toFixed(0)}% (±{activeScenario.uncertainty_range_pct}%)
          </div>
        </div>
      </div>

      {/* Assumptions & Invalidation Triggers */}
      <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            MODEL ASSUMPTIONS
          </div>
          <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {activeScenario.assumptions.map((assump, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{assump}</li>
            ))}
          </ul>
        </div>
        <div style={{ background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.15)', padding: '14px', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '8px' }}>
            INVALIDATION TRIGGERS
          </div>
          <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {activeScenario.invalidation_triggers.map((trig, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{trig}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
