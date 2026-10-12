import React from 'react';
import { TranslationKeys } from '../i18n';

interface CitizenOverviewProps {
  i18n: TranslationKeys;
  onNavigateTab: (tabId: string) => void;
  trustScore?: number;
  taskCount?: number;
  resilienceScore?: number;
}

export const CitizenOverview: React.FC<CitizenOverviewProps> = ({
  i18n,
  onNavigateTab,
  trustScore = 94.3,
  taskCount = 18,
  resilienceScore = 78.4,
}) => {
  return (
    <div className="citizen-overview-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Hero Banner with Glassmorphic Gradient */}
      <div
        className="glass-panel"
        style={{
          padding: '32px 36px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(6, 182, 212, 0.12) 50%, rgba(16, 21, 36, 0.8) 100%)',
          border: '1px solid var(--border-accent)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '850px' }}>
          <div
            className="badge badge-emerald"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '12px' }}
          >
            <span>🛡️</span>
            <span>{i18n.badgeGuaranteed} — Zero Algorithmic Layoffs</span>
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1.25,
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '12px',
            }}
          >
            {i18n.heroTitle}
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {i18n.heroSubtitle}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => onNavigateTab('task_sculptor')}
              className="btn-primary"
              style={{ padding: '10px 22px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🧬</span>
              <span>{i18n.quickActionSculptTitle}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('opportunity')}
              className="btn-subtle"
              style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🚀</span>
              <span>{i18n.quickActionOpportunityTitle}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('multimodal')}
              className="btn-subtle"
              style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>👁️</span>
              <span>{i18n.quickActionMediaTitle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Citizen Metric Highlights */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {i18n.statTrustScore}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '6px' }}>
            {trustScore} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Google Well-Architected 8-Pillar Score
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {i18n.statActiveTasks}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '6px' }}>
            {taskCount} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Tasks</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Mapped into 6 Transformation Categories
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {i18n.statAvgResilience}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-indigo)', marginTop: '6px' }}>
            {resilienceScore}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Workforce Adaptability & Survival Index
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {i18n.statHumanFirst}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-purple)', marginTop: '6px' }}>
            A2 Sovereign
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Mandatory Human-in-the-Loop Approval Gate
          </div>
        </div>
      </div>

      {/* 4 Responsible AI & Worker Protection Pillars */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
          🛡️ Four Non-Negotiable Worker Protections
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚫</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {i18n.pillarZeroLayoffTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              {i18n.pillarZeroLayoffDesc}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚀</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {i18n.pillarMobilityTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              {i18n.pillarMobilityDesc}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔒</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {i18n.pillarPrivacyTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              {i18n.pillarPrivacyDesc}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚖️</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {i18n.pillarAppealTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              {i18n.pillarAppealDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
          🧭 Explore Platform Modules
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div
            onClick={() => onNavigateTab('task_sculptor')}
            className="glass-panel"
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px' }}>🧬</span>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{i18n.navTaskSculptor}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {i18n.quickActionSculptDesc}
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('opportunity')}
            className="glass-panel"
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px' }}>📈</span>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{i18n.navOpportunity}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {i18n.quickActionOpportunityDesc}
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('multimodal')}
            className="glass-panel"
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px' }}>👁️</span>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{i18n.navMultimodal}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {i18n.quickActionMediaDesc}
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('agent_swarm')}
            className="glass-panel"
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px' }}>🤖</span>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{i18n.navAgentSwarm}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {i18n.quickActionSwarmDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
