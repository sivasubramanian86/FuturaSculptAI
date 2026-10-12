import React, { useEffect, useState } from 'react';

export interface TourStep {
  step: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  keyFeatures: string[];
  tabId: string;
  tagColor: string;
}

export interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    badge: 'STAGE 1: SEED & PERSONA',
    title: 'Industry Simulation & Multi-Tenant Personas',
    subtitle: 'Simulate cross-sector digital twins with 6 role-based enterprise lenses',
    icon: '🏭',
    tagColor: 'var(--accent-cyan)',
    tabId: 'overview',
    description:
      'FuturaSculptAI seeds digital twins across Food Processing, Automotive EV, Healthcare Logistics, and Advanced Robotics. Switch between 6 RBAC personas (Citizen Worker, Enterprise Architect, Investor, HR Executive, Workforce Care Lead, AI Safety Officer) to inspect real-time permissions.',
    keyFeatures: [
      'Multi-industry scenario presets: Food, Automotive, Healthcare, Precision Robotics',
      'Dual-mode operation: Local high-fidelity simulation + Google Cloud Vertex AI deployment',
      'Instant IAM persona switching with automated JWT claims and least-privilege scoping',
    ],
  },
  {
    step: 2,
    badge: 'STAGE 2: SCULPT',
    title: 'Task Sculptor & 6-Taxonomy Allocation',
    subtitle: 'Rebalance human creativity and agent automation with zero layoffs',
    icon: '🧬',
    tagColor: 'var(--accent-indigo)',
    tabId: 'task_sculptor',
    description:
      'Deconstruct complex workflows into tasks categorized across Automate, Augment, Assist, Retain, Redesign, and Retire. Adjust human/agent contribution sliders and enforce the A2 Sign-Off human gate.',
    keyFeatures: [
      '6-part work transformation taxonomy respecting worker dignity',
      'Cycle time compression and cognitive load rebalancing',
      'A2 Human Sign-Off Gate enforcing mandatory supervisor approval',
    ],
  },
  {
    step: 3,
    badge: 'STAGE 3: MOBILITY',
    title: 'Opportunity Engine & Career Mobility',
    subtitle: 'Deterministic indices, wage mobility, and reskilling pathways',
    icon: '🚀',
    tagColor: 'var(--accent-purple)',
    tabId: 'opportunity',
    description:
      'Evaluate workforce health through 4 deterministic indices (RRI, TCI, HVI, SRI). Automated tasks unlock sponsored reskilling pathways protected by differential privacy (k>=10) and a guaranteed right to appeal.',
    keyFeatures: [
      'Role Resilience Index (RRI) and wage mobility trajectory calculations',
      'Differential privacy shield: cohorts < 10 workers automatically masked',
      'Statutory right of appeal with immutable evidence ledger review',
    ],
  },
  {
    step: 4,
    badge: 'STAGE 4: SIMULATE',
    title: 'Temporal WorkGraph Digital Twin',
    subtitle: 'Project cascade effects across 4 horizons (T0, T+30, T+90, T+365)',
    icon: '🌐',
    tagColor: 'var(--accent-blue)',
    tabId: 'workgraph',
    description:
      'Model interdependent nodes (Outcomes, Capabilities, Workflows, Tasks, Roles, Skills, Systems, Agents). Simulate multi-year horizons and evaluate automation blast radius before deploying changes.',
    keyFeatures: [
      'Multi-horizon temporal projection from baseline T0 to Year 3',
      'Blast radius cascade visualizer highlighting high-risk disruption zones',
      'Interactive entity filters across all 8 enterprise ontology layers',
    ],
  },
  {
    step: 5,
    badge: 'STAGE 5: DELIBERATE',
    title: 'Google ADK Multi-Agent Specialist Swarm',
    subtitle: '9 neuro-symbolic subagents collaborating with adversarial safety checks',
    icon: '🤖',
    tagColor: 'var(--accent-emerald)',
    tabId: 'agent_swarm',
    description:
      'Consult 9 specialized subagents (Task Decomposer, Skills Mobility, FinOps, WorkGraph Architect, Adversarial Critic, etc.). Watch tool calling trajectories and consensus voting in real-time.',
    keyFeatures: [
      '9 specialized Google ADK neuro-symbolic subagents',
      'Adversarial Safety Critic and Responsible AI red-line enforcement',
      'Transparent reasoning traces, tool executions, and audit trails',
    ],
  },
  {
    step: 6,
    badge: 'STAGE 6: GOVERN & PROVE',
    title: 'Governance TrustBoard & Cryptographic Evidence Vault',
    subtitle: '8 Well-Architected pillars, SAIF verification, and Investor Lens',
    icon: '🛡️',
    tagColor: 'var(--accent-amber)',
    tabId: 'governance',
    description:
      'Inspect holistic Well-Architected pillar scores, Google SAIF matrix controls, Cloud DLP PII redactions, and Investor Lens DCF returns. Export cryptographically sealed SHA-256 Diligence Packs.',
    keyFeatures: [
      '8 Well-Architected governance pillars & Google SAIF security matrix',
      'Cloud DLP real-time PII redaction and least-privilege IAM controls',
      'Tamper-evident SHA-256 diligence export and Investor Lens valuation',
    ],
  },
];

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setCurrentStepIndex((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleJumpToSection = () => {
    onNavigateTab(step.tabId);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
      style={{ zIndex: 9999 }}
    >
      <div
        className="glass-panel tour-modal-content"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(16, 21, 36, 0.95) 0%, rgba(10, 13, 20, 0.98) 100%)',
          border: '1px solid var(--border-accent)',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.25)',
          position: 'relative',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '28px',
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              }}
            >
              {step.icon}
            </span>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: step.tagColor,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {step.badge} • STEP {step.step} OF {TOUR_STEPS.length}
              </div>
              <h2
                id="tour-modal-title"
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  margin: '2px 0 0 0',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {step.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-subtle"
            style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '8px' }}
            aria-label="Close Tour"
          >
            ✕
          </button>
        </div>

        {/* Step Progress Dots */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '4px',
                background:
                  idx === currentStepIndex
                    ? 'linear-gradient(90deg, var(--accent-cyan), var(--accent-indigo))'
                    : idx < currentStepIndex
                    ? 'var(--accent-indigo)'
                    : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              title={`Step ${s.step}: ${s.title}`}
              aria-label={`Go to step ${s.step}`}
            />
          ))}
        </div>

        {/* Subtitle & Description */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>
            {step.subtitle}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {step.description}
          </p>
        </div>

        {/* Key Features Callout Box */}
        <div
          style={{
            padding: '16px 18px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}
          >
            KEY CAPABILITIES TO EXPLORE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {step.keyFeatures.map((feat, fIdx) => (
              <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#f1f5f9' }}>
                <span style={{ color: step.tagColor, fontSize: '14px' }}>✓</span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation & Jump Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleJumpToSection}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>🚀</span>
            <span>Jump to {step.title.split(' ')[0]} Section</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              disabled={isFirst}
              onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
              className="btn-subtle"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                opacity: isFirst ? 0.4 : 1,
                cursor: isFirst ? 'not-allowed' : 'pointer',
              }}
            >
              ← Back
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                ✓ Finish Tour
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1))}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Next Step →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
