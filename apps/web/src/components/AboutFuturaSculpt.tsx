import React from 'react';
import { TranslationKeys } from '../i18n';

interface AboutFuturaSculptProps {
  i18n: TranslationKeys;
}

const AGENTS_MATRIX = [
  { name: 'Task Decomposer', role: 'Granular SOP & work activity extraction', tier: 'A0 (Read-Only)', model: 'Gemini 2.5 Flash' },
  { name: 'Task Redesign Specialist', role: '6-part taxonomy redesign & human-AI balance', tier: 'A1 (Recommend)', model: 'Gemini 2.5 Flash' },
  { name: 'WorkGraph Architect', role: 'NetworkX graph topology & blast radius', tier: 'A1 (Recommend)', model: 'Gemini 2.5 Pro' },
  { name: 'Skills Mobility Advisor', role: 'Role transition matching & reskilling pathways', tier: 'A1 (Recommend)', model: 'Gemini 2.5 Flash' },
  { name: 'Skill Gap Analyst', role: 'Competency delta & training syllabus planning', tier: 'A1 (Recommend)', model: 'Gemini 2.5 Flash' },
  { name: 'Business Solution Architect', role: 'Process bottleneck elimination & throughput', tier: 'A1 (Recommend)', model: 'Gemini 2.5 Pro' },
  { name: 'FinOps Evaluator', role: 'Token cost budgeting & EBITDA unlock modeling', tier: 'A1 (Recommend)', model: 'Gemini 2.5 Flash' },
  { name: 'Future Signals Scout', role: 'Industry regulatory & tech trend synthesis', tier: 'A0 (Read-Only)', model: 'Gemini 2.5 Flash' },
  { name: 'Adversarial Critic', role: 'Bias audit, prompt injection & SAIF defense', tier: 'A1 (Critic/Veto)', model: 'Gemini 2.5 Thinking' },
];

export const AboutFuturaSculpt: React.FC<AboutFuturaSculptProps> = ({ i18n }) => {
  return (
    <div className="about-container glass-panel panel-card" style={{ padding: '32px' }} aria-label="About FuturaSculptAI">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="badge badge-indigo" style={{ display: 'inline-block', marginBottom: '10px' }}>
          GOOGLE CLOUD APAC AI BUILDER CUP 2026
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800 }}>
          {i18n.aboutTitle}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          {i18n.aboutSubtitle}
        </p>
      </div>

      {/* Mission & Problem Statement */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
            🎯 The Problem: $4.4T Productivity Paradox
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            85% of enterprise generative AI workforce initiatives stall in pilot purgatory. Generic chatbot copilots
            hallucinate standard operating procedures, provoke workforce resistance over perceived layoff threats, and operate
            in disconnected silos without understanding upstream or downstream task dependencies.
          </p>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '8px' }}>
            💡 The Solution: Closed-Loop Operating System
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            FuturaSculptAI replaces isolated prompts with a closed-loop operating system: Sense multimodal evidence, Model
            interdependencies in a temporal WorkGraph, Simulate counterfactual scenarios, Sculpt tasks with human oversight,
            and guarantee evidence lineage with zero hallucinations.
          </p>
        </div>
      </div>

      {/* The 9 Google ADK Agents Matrix */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>
          🤖 Google ADK Specialist Swarm Architecture (9 Sub-Agents)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Agent Specialist</th>
                <th>Domain Responsibility</th>
                <th>Bounded Autonomy Tier</th>
                <th>Vertex AI Model Gateway</th>
              </tr>
            </thead>
            <tbody>
              {AGENTS_MATRIX.map((agent, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{agent.role}</td>
                  <td>
                    <span className="badge badge-indigo">{agent.tier}</span>
                  </td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{agent.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extensible Industry Capsules */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>
          🏭 Industry Grounding & Extensibility Capsules
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>🥫 Food Manufacturing</div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Apex Food Line 4 (Deep Dive)</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              8.4% scrap rate reduction, automated optical sorting, HACCP hygiene verification.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>🏥 Healthcare & Nursing</div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>ICU Clinical Handoff</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Shift change charting acceleration, EHR transcription, medical error shield.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>💳 UPI & QR FinTech</div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Level-2 AML Alert Triage & UPI Merchant Guard</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Zero-click exploit defense, Cloud DLP UPI tokenization, reverse QR spoofing mitigation.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>🚖 Autonomous Mobility</div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Uber / Ola Fleet Tele-Ops</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Transitioning drivers to remote safety marshals & tele-operators with 90-day wage bonds.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>🎬 Cinema & Creative Arts</div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>CineSculpt VFX (ThiraiKuzhuAI)</div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              SAG-AFTRA digital likeness protection, synthetic voice contracts & smart royalty splits.
            </p>
          </div>
        </div>
      </div>

      {/* Open Source & Links */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Open Source License:</span>
          <span style={{ color: 'var(--accent-emerald)', marginLeft: '8px' }}>Apache 2.0</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href="https://github.com/sivasubramanian86/FuturaSculptAI"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-subtle"
            style={{ fontSize: '13px', textDecoration: 'none' }}
          >
            GitHub Repository ↗
          </a>
          <a
            href="https://futurasculpt-api-asia-southeast1.run.app/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-subtle"
            style={{ fontSize: '13px', textDecoration: 'none' }}
          >
            OpenAPI Swagger Docs ↗
          </a>
        </div>
      </div>
    </div>
  );
};
