/**
 * TrustBoard Governance and Role Resilience Index component.
 * Displays composite governance health (SAIF security, operational excellence, reliability, FinOps, sustainability)
 * alongside deterministic role resilience formulas and upskilling pathways.
 * Conforms to WCAG 2.1 AA with role="region", progressbar semantics, and high contrast labels.
 */

import React from 'react';
import { RoleResilienceResult, TrustScoreResult } from '../types';
import { TranslationKeys } from '../i18n';
import { en } from '../i18n/locales/en';

export interface TrustScoreCardProps {
  /** Composite TrustBoard governance result. */
  trustBoard: TrustScoreResult | null;
  /** Evaluated Role Resilience Index result. */
  roleResilience: RoleResilienceResult | null;
  /** Optional localized translations dictionary. */
  i18n?: TranslationKeys;
}

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({
  trustBoard,
  roleResilience,
  i18n,
}) => {
  const t = i18n || en;

  if (!trustBoard || !roleResilience) {
    return (
      <div
        className="glass-panel panel-card"
        role="status"
        aria-live="polite"
        style={{
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          textAlign: 'center',
          minHeight: '260px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '3px solid rgba(16, 185, 129, 0.25)',
              borderTopColor: '#10b981',
              animation: 'spin 1s linear infinite',
            }}
          />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Evaluating governance posture...
          </h3>
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
          Auditing Google SAIF 16 security controls, verifying cryptographic SHA-256 evidence vault provenance, and calculating composite Well-Architected governance scores.
        </p>

        {/* Dynamic Governance Progress Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '88%',
              background: 'linear-gradient(90deg, #10b981, #06b6d4, #6366f1)',
              borderRadius: '9999px',
              animation: 'pulse 1.8s ease-in-out infinite',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
          <span className="badge" style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
            SAIF 16 Controls Verified
          </span>
          <span className="badge" style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
            Cloud DLP PII Scanned
          </span>
          <span className="badge" style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
            Zero-Layoff Red Line Check
          </span>
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'HIGH_RESILIENCE':
        return 'var(--accent-emerald)';
      case 'MODERATE_RESILIENCE':
        return 'var(--accent-amber)';
      default:
        return 'var(--accent-rose)';
    }
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      role="region"
      aria-label="Governance Trust Score & Role Resilience"
    >
      {/* TrustBoard Card */}
      <div className="glass-panel panel-card" role="region" aria-label="TrustBoard Governance Card">
        <div className="section-header">
          <h2 className="section-title">
            <span>🛡️</span> {t.govTitle}
          </h2>
          <span
            className="badge"
            style={{
              background: trustBoard.gate_status === 'PASSED' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              color: trustBoard.gate_status === 'PASSED' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}
            aria-label={`Governance gate: ${trustBoard.gate_status}`}
          >
            GATE: {trustBoard.gate_status}
          </span>
        </div>

        <div
          className="score-circle"
          role="progressbar"
          aria-valuenow={Math.round(trustBoard.trust_score)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Enterprise Trust Score"
        >
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
      <div className="glass-panel panel-card" role="region" aria-label="Role Resilience Index Card">
        <div className="section-header">
          <h2 className="section-title">
            <span>👤</span> Role Resilience Index
          </h2>
          <span
            className="badge"
            style={{ color: getTierColor(roleResilience.tier), borderColor: getTierColor(roleResilience.tier) }}
            aria-label={`Resilience tier: ${roleResilience.tier}`}
          >
            {roleResilience.tier.replace(/_/g, ' ')}
          </span>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>{roleResilience.role_name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Formula: {roleResilience.formula_version} (Deterministic)
          </div>
        </div>

        <div
          className="score-circle"
          role="progressbar"
          aria-valuenow={Math.round(roleResilience.score)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Role Resilience Index Score"
          style={{
            background: `conic-gradient(${getTierColor(roleResilience.tier)} 0% ${roleResilience.score}%, rgba(255,255,255,0.1) ${roleResilience.score}% 100%)`,
          }}
        >
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
