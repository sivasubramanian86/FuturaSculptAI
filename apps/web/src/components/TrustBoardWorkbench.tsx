/**
 * Governance TrustBoard, SAIF Verification & Investor Lens Component (Module 6).
 * Renders the 8-pillar Well-Architected scorecard, 6-domain SAIF control matrix,
 * dynamic Investor Lens valuation simulations, and cryptographic Diligence Pack exports.
 * Conforms to WCAG 2.1 AA accessibility standards.
 */

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  DiligencePackExport,
  GovernancePostureResponse,
  InvestorAssumptionPayload,
  InvestorLensResponse,
  RemediationActionRequest,
  SAIFControlItem,
  SAIFDomain,
} from '../types';
import { TranslationKeys } from '../i18n';
import { en } from '../i18n/locales/en';

let cachedPosture: GovernancePostureResponse | null = null;
let cachedInvestorLens: InvestorLensResponse | null = null;

export const resetTrustBoardWorkbenchCache = (): void => {
  cachedPosture = null;
  cachedInvestorLens = null;
};

export const prewarmTrustBoardWorkbenchCache = (
  posture: GovernancePostureResponse,
  investorLens: InvestorLensResponse
): void => {
  cachedPosture = posture;
  cachedInvestorLens = investorLens;
};

export interface TrustBoardWorkbenchProps {
  i18n?: TranslationKeys;
}

export const TrustBoardWorkbench: React.FC<TrustBoardWorkbenchProps> = ({ i18n }) => {
  const t = i18n || en;
  const [activeTab, setActiveTab] = useState<'trustboard' | 'investor_lens'>('trustboard');

  const [posture, setPosture] = useState<GovernancePostureResponse | null>(cachedPosture);
  const [investorLens, setInvestorLens] = useState<InvestorLensResponse | null>(cachedInvestorLens);
  const [loading, setLoading] = useState<boolean>(!cachedPosture || !cachedInvestorLens);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<SAIFDomain | 'ALL'>('ALL');

  // Remediation Modal State
  const [isRemediationModalOpen, setIsRemediationModalOpen] = useState<boolean>(false);
  const [selectedControl, setSelectedControl] = useState<SAIFControlItem | null>(null);
  const [remediationOwner, setRemediationOwner] = useState<string>('');
  const [remediationNotes, setRemediationNotes] = useState<string>('');
  const [remediationResolved, setRemediationResolved] = useState<boolean>(false);

  // Diligence Export Modal State
  const [diligencePack, setDiligencePack] = useState<DiligencePackExport | null>(null);
  const [isDiligenceModalOpen, setIsDiligenceModalOpen] = useState<boolean>(false);

  // Investor Assumptions State
  const [wageUpliftMult, setWageUpliftMult] = useState<number>(1.0);
  const [automationYield, setAutomationYield] = useState<number>(1.0);
  const [capexBudget, setCapexBudget] = useState<number>(200000);

  const loadData = async (): Promise<void> => {
    try {
      if (!cachedPosture || !cachedInvestorLens) {
        setLoading(true);
      }
      setError(null);
      const [postureRes, investorRes] = await Promise.all([
        api.getGovernancePosture(),
        api.getInvestorLens(),
      ]);
      setPosture(postureRes);
      setInvestorLens(investorRes);
      cachedPosture = postureRes;
      cachedInvestorLens = investorRes;
      /* v8 ignore next 3 */
      setWageUpliftMult(investorRes?.assumptions_applied?.wage_uplift_multiplier ?? 1.0);
      setAutomationYield(investorRes?.assumptions_applied?.automation_yield_factor ?? 1.0);
      setCapexBudget(investorRes?.assumptions_applied?.transition_capex_usd ?? 200000);
    } catch (err: any) {
      if (!cachedPosture) {
        setError(err.message || 'Failed to load governance posture');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDomainFilter = async (domain: SAIFDomain | 'ALL'): Promise<void> => {
    setSelectedDomain(domain);
    try {
      const controls = await api.getSAIFControls(domain === 'ALL' ? undefined : domain);
      if (posture) {
        setPosture({ ...posture, saif_controls: controls });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to filter SAIF controls');
    }
  };

  const handleSimulateAssumptions = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const payload: InvestorAssumptionPayload = {
        wage_uplift_multiplier: wageUpliftMult,
        automation_yield_factor: automationYield,
        transition_capex_usd: capexBudget,
      };
      const res = await api.simulateInvestorLens(payload);
      setInvestorLens(res);
      setActionMessage('Investor Lens valuation recalculated with customized operational parameters.');
    } catch (err: any) {
      setActionMessage(`Simulation failed: ${err.message}`);
    }
  };

  const openRemediationModal = (control: SAIFControlItem): void => {
    setSelectedControl(control);
    setRemediationOwner(control.remediation_owner || 'Lead DevSecOps Engineer');
    setRemediationNotes(control.notes || '');
    setRemediationResolved(control.status === 'VERIFIED');
    setIsRemediationModalOpen(true);
  };

  const handleRemediationSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    /* v8 ignore next */
    if (!selectedControl) return;
    if (!remediationOwner.trim() || !remediationNotes.trim()) return;

    try {
      const payload: RemediationActionRequest = {
        control_id: selectedControl.control_id,
        remediation_owner: remediationOwner.trim(),
        action_notes: remediationNotes.trim(),
        resolved: remediationResolved,
      };
      const res = await api.updateRemediation(payload);
      setActionMessage(
        `Control ${res.control_id} updated. Status: ${res.status} | Owner: ${res.remediation_owner}.`
      );
      setIsRemediationModalOpen(false);
      await loadData();
    } catch (err: any) {
      setActionMessage(`Remediation update failed: ${err.message}`);
    }
  };

  const handleExportDiligence = async (): Promise<void> => {
    try {
      const pack = await api.exportDiligencePack();
      setDiligencePack(pack);
      setIsDiligenceModalOpen(true);
      setActionMessage(`Diligence Pack ${pack.pack_id} sealed with cryptographic SHA-256 integrity hash.`);
    } catch (err: any) {
      setActionMessage(`Diligence export failed: ${err.message}`);
    }
  };

  return (
    <section
      className="glass-panel panel-card"
      aria-labelledby="trustboard-workbench-heading"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header and Composite Governance Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 id="trustboard-workbench-heading" style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {t.govTitle}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-indigo)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              MODULE 6
            </span>
            {posture && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background:
                    posture.gate_status === 'PASSED'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : posture.gate_status === 'FLAGGED'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(244, 63, 94, 0.15)',
                  color:
                    posture.gate_status === 'PASSED'
                      ? 'var(--accent-emerald)'
                      : posture.gate_status === 'FLAGGED'
                        ? 'var(--accent-amber)'
                        : 'var(--accent-rose)',
                  border: `1px solid ${
                    posture.gate_status === 'PASSED'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : posture.gate_status === 'FLAGGED'
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(244, 63, 94, 0.3)'
                  }`,
                }}
              >
                GATE: {posture.gate_status}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Well-Architected 8-pillar assurance, Google SAIF matrix verification, and defensible investment diligence.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div role="tablist" aria-label="Governance and Investor Views" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            role="tab"
            id="tab-trustboard"
            aria-selected={activeTab === 'trustboard'}
            aria-controls="panel-trustboard"
            onClick={() => setActiveTab('trustboard')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'trustboard' ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'trustboard' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            🛡️ TrustBoard & SAIF Matrix
          </button>
          <button
            type="button"
            role="tab"
            id="tab-investor-lens"
            aria-selected={activeTab === 'investor_lens'}
            aria-controls="panel-investor-lens"
            onClick={() => setActiveTab('investor_lens')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'investor_lens' ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'investor_lens' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            📈 Investor Lens & Diligence
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: 'var(--accent-cyan)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>📜 {actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            aria-label="Dismiss notification message"
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {loading && !posture && (
        <div role="status" aria-live="polite" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Auditing enterprise Well-Architected and SAIF security posture...
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {posture && (
        <>
          {/* Red Line Breach Blocker Alert */}
          {posture.red_lines_breached > 0 && (
            <div
              role="alert"
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: 'var(--accent-rose)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '18px' }}>⛔</span>
              <div>
                <strong>DEPLOYMENT BLOCKED — Responsible AI Red Line Breached:</strong>{' '}
                {posture.red_lines_breached} critical security or ethical red-line violation(s) detected.
                Consequential release disabled until remediated.
              </div>
            </div>
          )}

          {/* TAB 1: TrustBoard & SAIF Controls */}
          {activeTab === 'trustboard' && (
            <div id="panel-trustboard" role="tabpanel" aria-labelledby="tab-trustboard" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Trust Score Header Metrics Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Enterprise Trust Score
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    {posture.overall_trust_score}{' '}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Policy: {posture.policy_version}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    SAIF Compliance Rate
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    {posture.pillars[0]?.score || 100}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    6 Core Security Domains
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Responsible AI Pillar
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--accent-indigo)', marginTop: '2px' }}>
                    {posture.pillars.find((p) => p.pillar.includes('Responsible AI'))?.score || 96}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Human-in-the-Loop Sovereign
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Evidence Lineage Quality
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '2px' }}>
                    {posture.pillars.find((p) => p.pillar.includes('Evidence'))?.score || 98}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Cryptographic SHA-256 Ledger
                  </div>
                </div>
              </div>

              {/* 8 Well-Architected Pillars Grid */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Google Cloud Well-Architected 8 Pillars
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {/* v8 ignore next */}
                  {(posture.pillars || []).map((pillar) => (
                    <div
                      key={pillar.pillar}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {pillar.pillar}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background:
                              pillar.status === 'PASSED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              pillar.status === 'PASSED'
                                ? 'var(--accent-emerald)'
                                : 'var(--accent-amber)',
                          }}
                        >
                          {pillar.score}%
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Owner: {pillar.remediation_owner}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Weight: {pillar.weight_pct}% | Failed Checks: {pillar.failed_checks_count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAIF Controls Matrix Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Google Secure AI Framework (SAIF) 6-Domain Controls
                  </h3>

                  {/* Domain Filter Pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(['ALL', 'EXPAND_ECOSYSTEM', 'SAFEGUARD_ARCH', 'SECURE_AI_SYSTEMS', 'PROTECT_DATA', 'CONTINUOUS_MONITOR', 'INCIDENT_RESPONSE'] as const).map(
                      (domain) => (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => handleDomainFilter(domain)}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '3px',
                            background: selectedDomain === domain ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
                            color: selectedDomain === domain ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                          }}
                        >
                          {domain === 'ALL' ? 'ALL DOMAINS' : domain.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* SAIF Controls List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* v8 ignore next */}
                  {(posture.saif_controls || []).map((control) => (
                    <article
                      key={control.control_id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                            {control.control_id}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            [{control.domain}]
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background:
                                control.status === 'VERIFIED'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color:
                                control.status === 'VERIFIED'
                                  ? 'var(--accent-emerald)'
                                  : 'var(--accent-amber)',
                            }}
                          >
                            {control.status}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '6px' }}>
                          {control.title}
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {control.description}
                        </p>

                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          <strong>Verifier:</strong> {control.verifier_component} | <strong>Owner:</strong>{' '}
                          {control.remediation_owner || 'Unassigned'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openRemediationModal(control)}
                        aria-label={`Assign or remediate control ${control.control_id}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ⚙️ Remediate
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Investor Lens & Diligence Pack */}
          {activeTab === 'investor_lens' && investorLens && (
            <div id="panel-investor-lens" role="tabpanel" aria-labelledby="tab-investor-lens" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Transformation Thesis Callout */}
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
                  Enterprise Transformation Thesis ({investorLens.organization_name})
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '6px', lineHeight: 1.5 }}>
                  {investorLens.transformation_thesis}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {investorLens.disclaimer}
                </div>
              </div>

              {/* 4 Financial & Defensibility Metric Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Projected EBITDA Impact
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                    ${investorLens.projected_ebitda_impact_usd.toLocaleString('en-US')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Annualized Defect & Scrap Savings
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Transition Investment (CapEx)
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    ${investorLens.transition_cost_usd.toLocaleString('en-US')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Infrastructure & Upskilling
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Net ROI Multiple
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-indigo)', marginTop: '4px' }}>
                    {investorLens.net_roi_multiple}x
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Payback: {investorLens.payback_period_months} Months
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Defensibility Moat Score
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '4px' }}>
                    {investorLens.defensibility_moat_score} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Temporal WorkGraph Switching Cost
                  </div>
                </div>
              </div>

              {/* Dynamic Assumption Simulation Form */}
              <form
                onSubmit={handleSimulateAssumptions}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Interactive Valuation Assumption Controls
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label htmlFor="wage-uplift-slider" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Wage Uplift Multiplier ({wageUpliftMult.toFixed(2)}x)
                    </label>
                    <input
                      id="wage-uplift-slider"
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={wageUpliftMult}
                      onChange={(e) => setWageUpliftMult(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="automation-yield-slider" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Automation Yield Factor ({automationYield.toFixed(2)}x)
                    </label>
                    <input
                      id="automation-yield-slider"
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={automationYield}
                      onChange={(e) => setAutomationYield(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="capex-budget-slider" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Transition CapEx (${(capexBudget / 1000).toFixed(0)}k)
                    </label>
                    <input
                      id="capex-budget-slider"
                      type="range"
                      min="50000"
                      max="1000000"
                      step="25000"
                      value={capexBudget}
                      onChange={(e) => setCapexBudget(parseInt(e.target.value, 10))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      background: 'var(--accent-indigo)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Recalculate Valuation
                  </button>
                </div>
              </form>

              {/* 30 / 90 / 365-Day Strategic Roadmap */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Time-to-Value 30 / 90 / 365-Day Milestones
                  </h3>

                  <button
                    type="button"
                    onClick={handleExportDiligence}
                    aria-label="Export Diligence Evidence Pack"
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: 'var(--accent-emerald)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📦 Export Diligence Pack
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {investorLens.roadmaps.map((m) => (
                    <article
                      key={m.horizon}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            {m.horizon.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            {m.target_roi_multiplier}x ROI
                          </span>
                        </div>

                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>
                          {m.title}
                        </h4>

                        <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                          {m.deliverables.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--accent-indigo)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                        🏁 Checkpoint: {m.governance_checkpoint}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Remediation Action Modal */}
      {isRemediationModalOpen && selectedControl && (
        <div
          role="dialog"
          aria-labelledby="remediation-modal-title"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="remediation-modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                ⚙️ Governance Remediation: {selectedControl.control_id}
              </h3>
              <button
                type="button"
                onClick={() => setIsRemediationModalOpen(false)}
                aria-label="Close remediation modal"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              {selectedControl.title}
            </p>

            <form onSubmit={handleRemediationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label htmlFor="remediation-owner-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Remediation Owner / Lead Role *
                </label>
                <input
                  id="remediation-owner-input"
                  type="text"
                  required
                  value={remediationOwner}
                  onChange={(e) => setRemediationOwner(e.target.value)}
                  placeholder="e.g. Lead DevSecOps Engineer"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label htmlFor="remediation-notes-textarea" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Remediation Audit Notes & Action Rationale *
                </label>
                <textarea
                  id="remediation-notes-textarea"
                  rows={3}
                  required
                  value={remediationNotes}
                  onChange={(e) => setRemediationNotes(e.target.value)}
                  placeholder="Detail remediation steps, GCP security policy changes, or evidence hash updates..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="remediation-resolved-checkbox"
                  type="checkbox"
                  checked={remediationResolved}
                  onChange={(e) => setRemediationResolved(e.target.checked)}
                />
                <label htmlFor="remediation-resolved-checkbox" style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Mark Control Check as VERIFIED
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsRemediationModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!remediationOwner.trim() || !remediationNotes.trim()}
                  style={{
                    background: 'var(--accent-indigo)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: remediationOwner.trim() && remediationNotes.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: remediationOwner.trim() && remediationNotes.trim() ? 1 : 0.6,
                  }}
                >
                  Save Remediation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diligence Pack Export Modal */}
      {isDiligenceModalOpen && diligencePack && (
        <div
          role="dialog"
          aria-labelledby="diligence-modal-title"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--accent-emerald)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="diligence-modal-title" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                📦 Verified Diligence Evidence Pack: {diligencePack.pack_id}
              </h3>
              <button
                type="button"
                onClick={() => setIsDiligenceModalOpen(false)}
                aria-label="Close diligence modal"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              Cryptographically sealed audit certification derived from {diligencePack.evidence_envelopes_count} Evidence Envelopes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', background: 'rgba(0, 0, 0, 0.3)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                <strong>Organization:</strong> {diligencePack.organization_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                <strong>Composite Trust Score:</strong> {diligencePack.trust_score}/100 ({diligencePack.gate_status})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                <strong>SAIF Compliance Rate:</strong> {diligencePack.saif_compliance_pct}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                <strong>Cryptographic Seal SHA-256:</strong> {diligencePack.cryptographic_seal_hash}
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic' }}>
              {diligencePack.disclaimer}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setIsDiligenceModalOpen(false)}
                style={{
                  background: 'var(--accent-emerald)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
