import React from 'react';
import { RoleResilienceResult, TrustScoreResult } from '../types';

interface TrustScoreCardProps {
  trustBoard: TrustScoreResult | null;
  roleResilience: RoleResilienceResult | null;
}

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({
  trustBoard,
  roleResilience,
}) => {
  if (!trustBoard || !roleResilience) {
    return <div className="glass-panel panel-card">Evaluating governance posture...</div>;
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'HIGH_RESILIENCE': return 'var(--accent-emerald)';
      case 'MODERATE_RESILIENCE': return 'var(--accent-amber)';
      default: return 'var(--accent-rose)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* TrustBoard Card */}
      <div className="glass-panel panel-card">
        <div className="section-header">
          <h2 className="section-title">
            <span>🛡️</span> TrustBoard Governance
          </h2>
          <span
            className="badge"
            style={{
              background: trustBoard.gate_status === 'PASSED' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              color: trustBoard.gate_status === 'PASSED' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}
          >
            GATE: {trustBoard.gate_status}
          </span>
        </div>

        <div className="score-circle">
          <div className="score-inner">
            <span className="score-num">{trustBoard.trust_score.toFixed(0)}</span>
            <span className="score-title">TRUST SCORE</span>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <div className="metric-row">
            <span className="metric-label">Google SAIF Security (25%)</span>
            <span className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
              {trustBoard.saif_security_score}%
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Operational Excellence (15%)</span>
            <span className="metric-value">{trustBoard.operational_excellence_score}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">System Reliability (15%)</span>
            <span className="metric-value">{trustBoard.reliability_score}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Cost Optimization / FinOps (15%)</span>
            <span className="metric-value">{trustBoard.cost_optimization_score}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Sustainability & Carbon (15%)</span>
            <span className="metric-value">{trustBoard.sustainability_score}%</span>
          </div>
          <div className="metric-row" style={{ borderBottom: 'none' }}>
            <span className="metric-label">Red Lines Breached</span>
            <span
              className="metric-value"
              style={{ color: trustBoard.red_lines_breached === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}
            >
              {trustBoard.red_lines_breached}
            </span>
          </div>
        </div>
      </div>

      {/* Role Resilience Index Card */}
      <div className="glass-panel panel-card">
        <div className="section-header">
          <h2 className="section-title">
            <span>👤</span> Role Resilience Index
          </h2>
          <span
            className="badge"
            style={{ color: getTierColor(roleResilience.tier), borderColor: getTierColor(roleResilience.tier) }}
          >
            {roleResilience.tier.replace('_', ' ')}
          </span>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{roleResilience.role_name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Formula: {roleResilience.formula_version} (Deterministic)
          </div>
        </div>

        <div className="score-circle" style={{ background: `conic-gradient(${getTierColor(roleResilience.tier)} 0% ${roleResilience.score}%, rgba(255,255,255,0.1) ${roleResilience.score}% 100%)` }}>
          <div className="score-inner">
            <span className="score-num">{roleResilience.score.toFixed(0)}</span>
            <span className="score-title">RRI INDEX</span>
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          {roleResilience.components.map((comp, idx) => (
            <div key={idx} className="metric-row">
              <span className="metric-label" style={{ fontSize: '12px' }}>
                {comp.name} ({(comp.weight * 100).toFixed(0)}%)
              </span>
              <span className="metric-value" style={{ fontSize: '13px' }}>
                {comp.raw_value.toFixed(0)} / 100
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RECOMMENDED TRANSITION PATHWAY</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {roleResilience.recommended_pathway}
          </div>
        </div>
      </div>
    </div>
  );
};
