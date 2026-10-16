import React, { useState } from 'react';
import { TranslationKeys } from '../i18n';
import { TransformationRoadmapStudio } from './TransformationRoadmapStudio';

interface CitizenOverviewProps {
  i18n: TranslationKeys;
  onNavigateTab: (tabId: string) => void;
  trustScore?: number;
  taskCount?: number;
  resilienceScore?: number;
  onOpenTour?: () => void;
  sector?: string;
}

export const CitizenOverview: React.FC<CitizenOverviewProps> = ({
  i18n,
  onNavigateTab,
  trustScore = 94.3,
  taskCount = 18,
  resilienceScore = 78.4,
  onOpenTour,
  sector = 'food_manufacturing',
}) => {
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(false);
  const [spokenAudioText, setSpokenAudioText] = useState<string | null>(null);

  const speakSimpleText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const UtteranceClass = (window as any).SpeechSynthesisUtterance || (globalThis as any).SpeechSynthesisUtterance;
      if (UtteranceClass) {
        const utterance = new UtteranceClass(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.onend = () => setSpokenAudioText(null);
        window.speechSynthesis.speak(utterance);
      }
      setSpokenAudioText(text);
    }
  };

  const SIMPLE_GUIDES = [
    {
      icon: '🛡️',
      title: 'Am I Safe? (வேலை பாதுகாப்பு)',
      summary: 'YES! No one gets laid off. Your salary is 100% guaranteed for 90 days with legal protection bonds while you learn.',
      spoken: 'Yes, you are safe! FuturaSculptAI guarantees your salary and ensures no algorithmic layoffs occur. Your livelihood is legally protected.',
    },
    {
      icon: '🤖',
      title: 'Robot Helper (ரோபோ நண்பன்)',
      summary: 'Robots do heavy lifting, repetitive paperwork, and hazardous chores. You do the creative, caring, and human decision-making.',
      spoken: 'Think of robots as friendly helpers. They carry heavy loads and fill boring forms, leaving you in control of high-value human work.',
    },
    {
      icon: '🎓',
      title: 'Easy 2-Min Lessons (எளிய பயிற்சி)',
      summary: 'Zero computer degrees needed. 2-minute voice and video lessons in your mother tongue with hands-on practice.',
      spoken: 'You do not need a computer science degree. Our platform gives you short two-minute audio and video tutorials in your native language.',
    },
    {
      icon: '🎙️',
      title: 'Talk to Futura in Your Language (நேரடி பேச்சு)',
      summary: 'Tap the purple orb in the bottom-right corner! Futura speaks Tamil, Hindi, Telugu, Kannada, Malayalam, and English.',
      spoken: 'Whenever you have questions, tap Futura, the purple holographic assistant in the bottom right corner, to talk in your mother tongue.',
    },
  ];

  return (
    <div className="citizen-overview-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Hero Banner with Ultra-Glassmorphic Gradient */}
      <div
        className="glass-panel"
        style={{
          padding: '32px 36px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.16) 50%, rgba(16, 21, 36, 0.88) 100%)',
          border: '1px solid var(--border-accent)',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.25), 0 20px 48px -10px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ maxWidth: '880px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div
              className="badge badge-emerald"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', borderRadius: '9999px', padding: '6px 14px' }}
            >
              <span>🛡️</span>
              <span>{i18n.badgeGuaranteed} — Zero Algorithmic Layoffs</span>
            </div>

            <button
              type="button"
              onClick={() => setIsSimpleMode(!isSimpleMode)}
              className="btn-subtle"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isSimpleMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: isSimpleMode ? '#fbbf24' : 'var(--text-secondary)',
                border: isSimpleMode ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span>{isSimpleMode ? '👶 🧓 Simple Voice Mode (Active)' : '👶 🧓 Switch to Simple Voice & Visual Mode'}</span>
            </button>
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
              style={{ padding: '12px 26px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🧬</span>
              <span>{i18n.quickActionSculptTitle}</span>
            </button>
            {onOpenTour && (
              <button
                type="button"
                onClick={onOpenTour}
                className="btn-secondary"
                style={{
                  padding: '12px 26px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderColor: 'var(--accent-cyan)',
                  color: '#fff',
                }}
              >
                <span>✨</span>
                <span>One-Click Guided Tour</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('opportunity')}
              className="btn-subtle"
              style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🚀</span>
              <span>{i18n.quickActionOpportunityTitle}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('multimodal')}
              className="btn-subtle"
              style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>👁️</span>
              <span>{i18n.quickActionMediaTitle}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Universal Simplicity View for 5-Year-Olds, Seniors (60+), and Non-Tech Workers */}
      {isSimpleMode && (
        <div
          className="glass-panel"
          style={{
            padding: '24px 28px',
            borderRadius: '24px',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌟</span>
              <span>Simple Mode &mdash; No Tech Jargon (Age 5 to 60+ & Voice-First)</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {spokenAudioText && (
                <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="status-dot" />
                  <span>Playing Audio Guide...</span>
                </span>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Click any &ldquo;🔊 Listen&rdquo; button to hear instructions read aloud
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {SIMPLE_GUIDES.map((item, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '32px' }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
                  {item.summary}
                </div>
                <button
                  type="button"
                  onClick={() => speakSimpleText(item.spoken)}
                  className="btn-subtle"
                  style={{
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '8px 14px',
                    color: '#fbbf24',
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🔊</span>
                  <span>Listen in Your Language</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Future Work Transformation Simulator (1Y, 3Y, 5Y, 10Y Roadmap) */}
      <TransformationRoadmapStudio i18n={i18n} sector={sector} />

      {/* 4 Citizen Metric Highlights */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
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

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
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

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
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

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {i18n.statHumanFirst}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f43f5e', marginTop: '6px' }}>
            90 Days
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Wage Guarantee Escrow Protection
          </div>
        </div>
      </div>

      {/* Future Industry Safety Guidance Hub (UPI, Ride-Hailing, Cinema, Healthcare, IT) */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          borderRadius: '24px',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌐</span>
            <span>{i18n.safetyHubTitle}</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {i18n.safetyHubSubtitle}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Clinical Healthcare & Patient Protection */}
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: sector === 'healthcare' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: sector === 'healthcare' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>🏥</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {i18n.safetyHealthTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {i18n.safetyHealthDesc}
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              🛡️ HIPAA / EHR Differential Privacy & Diagnostic Grounding
            </div>
          </div>

          {/* IT & Software Engineering Titans */}
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: sector === 'it_technology' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: sector === 'it_technology' ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>💻</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-indigo)' }}>
              {i18n.safetyTechTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {i18n.safetyTechDesc}
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              ⚡ Monorepo Agent Mesh & License Provenance Shield
            </div>
          </div>

          {/* UPI & QR Code Transactional Apps */}
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: sector === 'banking' || sector === 'fintech_banking' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: sector === 'banking' || sector === 'fintech_banking' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>💳</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {i18n.safetyUpiTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {i18n.safetyUpiDesc}
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              🛡️ Cloud DLP Tokenization & Reverse QR Verification
            </div>
          </div>

          {/* Autonomous Mobility & Drivers */}
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: sector === 'mobility_autonomous' || sector === 'mobility_fleet' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: sector === 'mobility_autonomous' || sector === 'mobility_fleet' ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>🚖</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-indigo)' }}>
              {i18n.safetyTransitTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {i18n.safetyTransitDesc}
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              🎮 Tele-Driving Simulator Certifications & 90-Day Bond
            </div>
          </div>

          {/* Cinema & Creative Entertainment */}
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: sector === 'cinema_creative' ? 'rgba(244, 114, 182, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: sector === 'cinema_creative' ? '1px solid #f472b6' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>🎬</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f472b6' }}>
              {i18n.safetyMediaTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {i18n.safetyMediaDesc}
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#f472b6', fontWeight: 600 }}>
              📜 Actor Digital Likeness Contracts & Royalty Smart Escrow
            </div>
          </div>

          {/* Automotive EV & Precision Engineering */}
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: sector === 'automotive_ev' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: sector === 'automotive_ev' ? '1px solid #f97316' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>🚗</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f97316' }}>
              {i18n.safetyAutomotiveTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {i18n.safetyAutomotiveDesc}
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#f97316', fontWeight: 600 }}>
              ⚡ Edge-TPU Vision Sensors & Cobotic Ergonomics Protection
            </div>
          </div>

          {/* Food Manufacturing & Cold-Chain */}
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              borderRadius: '18px',
              background: sector === 'food_manufacturing' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: sector === 'food_manufacturing' ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>🍞</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>
              {i18n.safetyFoodTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {i18n.safetyFoodDesc}
            </p>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
              🥖 Continuous Optical QA & Cryptographic HACCP Proof
            </div>
          </div>
        </div>
      </div>


      {/* 3 Core Worker Protection Pillars */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
          🛡️ Responsible Workforce Governance Guarantees
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '22px', borderRadius: '20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤝</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {i18n.pillarZeroLayoffTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              {i18n.pillarZeroLayoffDesc}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px', borderRadius: '20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔒</div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {i18n.pillarPrivacyTitle}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              {i18n.pillarPrivacyDesc}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px', borderRadius: '20px' }}>
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
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border-subtle)', borderRadius: '20px' }}
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
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border-subtle)', borderRadius: '20px' }}
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
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border-subtle)', borderRadius: '20px' }}
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
            style={{ padding: '20px', cursor: 'pointer', border: '1px solid var(--border-subtle)', borderRadius: '20px' }}
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
