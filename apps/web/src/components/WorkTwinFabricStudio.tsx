/**
 * Futura WorkTwin Fabric Studio Component.
 * "Every role understood. Every employee augmented. Every future safely simulated."
 * 
 * Provides:
 * 1. Future Boardroom Simulation Arena: Multi-agent executive debate (CEO, CTO, CFO, CHRO, CISO, COO, Sustainability, Advocate).
 * 2. RoleTwin Archetype Catalog: Governed synthetic role archetypes with explicit autonomy bounds (WT0 - WT4).
 * 3. PersonalWorkTwin (Consent-Based Demo): Employee-controlled assistant with granular consent and strict clone prohibitions.
 * 
 * Conforms to WCAG 2.1 AA accessibility standards and EU AI Act / OECD workplace safety guidelines.
 */

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  BoardroomPerspective,
  BoardroomSimulationRequest,
  BoardroomSimulationResult,
  ExecutivePersona,
  PersonalWorkTwinConsent,
  WorkTwinManifest,
} from '../types';
import { TranslationKeys } from '../i18n';

export interface WorkTwinFabricStudioProps {
  i18n?: TranslationKeys;
}

export const WorkTwinFabricStudio: React.FC<WorkTwinFabricStudioProps> = ({ i18n: _i18n }) => {
  const [activeTab, setActiveTab] = useState<'boardroom' | 'archetypes' | 'personal'>('boardroom');

  // Boardroom state
  const [proposalTitle, setProposalTitle] = useState<string>(
    'Line 3 Packaging Computer Vision & Cobotics Deployment'
  );
  const [proposalDesc, setProposalDesc] = useState<string>(
    'Deploy high-speed edge TPU cameras on Line 3 conveyor to automatically detect seal micro-defects, coupled with a robotic arm rejection sorter and automated HACCP compliance logging.'
  );
  const [selectedTwins, setSelectedTwins] = useState<ExecutivePersona[]>([
    'CEO',
    'CTO',
    'CFO',
    'CHRO',
    'CISO',
    'EMPLOYEE_ADVOCATE',
  ]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<BoardroomSimulationResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Archetypes state
  const [manifests, setManifests] = useState<WorkTwinManifest[]>([]);
  const [loadingManifests, setLoadingManifests] = useState<boolean>(false);
  const [newRoleArchetype, setNewRoleArchetype] = useState<string>('');
  const [newRolePurpose, setNewRolePurpose] = useState<string>('');
  const [newRoleSkills, setNewRoleSkills] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // Personal WorkTwin Consent Demo state
  const [knowledgeConsent, setKnowledgeConsent] = useState<boolean>(true);
  const [writingStyleConsent, setWritingStyleConsent] = useState<boolean>(true);
  const [delegatedTaskConsent, setDelegatedTaskConsent] = useState<boolean>(true);
  const [twinRevoked, setTwinRevoked] = useState<boolean>(false);
  const [consentMsg, setConsentMsg] = useState<string | null>(null);

  const executiveList: { id: ExecutivePersona; label: string; icon: string }[] = [
    { id: 'CEO', label: 'CEO Twin', icon: '👔' },
    { id: 'CTO', label: 'CTO Twin', icon: '💻' },
    { id: 'CFO', label: 'CFO Twin', icon: '📊' },
    { id: 'CHRO', label: 'CHRO Twin', icon: '👥' },
    { id: 'CISO', label: 'CISO Twin', icon: '🛡️' },
    { id: 'COO', label: 'COO Twin', icon: '⚙️' },
    { id: 'SUSTAINABILITY', label: 'Sustainability Twin', icon: '🌱' },
    { id: 'EMPLOYEE_ADVOCATE', label: 'Worker Advocate Twin', icon: '✊' },
  ];

  const loadManifests = async (): Promise<void> => {
    try {
      setLoadingManifests(true);
      const res = await api.getWorkTwinManifests();
      setManifests(res);
    } catch (err: any) {
      console.error('Failed to load manifests:', err);
    } finally {
      setLoadingManifests(false);
    }
  };

  useEffect(() => {
    loadManifests();
  }, []);

  const handleToggleTwin = (persona: ExecutivePersona): void => {
    if (selectedTwins.includes(persona)) {
      if (selectedTwins.length > 2) {
        setSelectedTwins(selectedTwins.filter((p) => p !== persona));
      }
    } else {
      setSelectedTwins([...selectedTwins, persona]);
    }
  };

  const handleSimulateBoardroom = async (): Promise<void> => {
    try {
      setIsSimulating(true);
      setSimError(null);
      const req: BoardroomSimulationRequest = {
        proposal_title: proposalTitle,
        proposal_description: proposalDesc,
        sector: 'food_manufacturing',
        target_enterprise: 'Artisan Food Processing Group',
        participating_twins: selectedTwins,
      };
      const res = await api.simulateFutureBoardroom(req);
      setSimResult(res);
    } catch (err: any) {
      setSimError(err.message || 'Boardroom simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCreateRoleTwin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newRoleArchetype.trim() || !newRolePurpose.trim()) {
      setCreateMsg('Role archetype title and declared purpose are required.');
      return;
    }
    try {
      const skills = newRoleSkills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      await api.createRoleTwin({
        role_archetype: newRoleArchetype.trim(),
        declared_purpose: newRolePurpose.trim(),
        skills: skills.length > 0 ? skills : ['Operational Standard Process'],
      });
      setCreateMsg('Synthetic RoleTwin archetype successfully registered!');
      setNewRoleArchetype('');
      setNewRolePurpose('');
      setNewRoleSkills('');
      setShowCreateModal(false);
      await loadManifests();
    } catch (err: any) {
      setCreateMsg(`Failed to create RoleTwin: ${err.message}`);
    }
  };

  const handleSaveConsent = async (): Promise<void> => {
    try {
      const payload: PersonalWorkTwinConsent = {
        employee_id: 'EMP-4102',
        knowledge_consent: knowledgeConsent,
        writing_style_consent: writingStyleConsent,
        delegated_task_consent: delegatedTaskConsent,
        voice_avatar_consent: false,
        revoked: twinRevoked,
        consent_timestamp: new Date().toISOString(),
      };
      await api.registerPersonalTwinConsent(payload);
      setConsentMsg(
        twinRevoked
          ? 'Personal WorkTwin has been REVOKED and suspended from memory brokers.'
          : 'Personal WorkTwin consent envelope updated and verified with audit trail.'
      );
    } catch (err: any) {
      setConsentMsg(`Consent update failed: ${err.message}`);
    }
  };

  const getStanceBadge = (stance: string) => {
    switch (stance) {
      case 'FAVORABLE':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'CONDITIONAL':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'SKEPTICAL':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' };
    }
  };

  return (
    <section
      className="glass-panel panel-card"
      aria-labelledby="worktwin-fabric-heading"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Header & Tagline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 id="worktwin-fabric-heading" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Futura WorkTwin Fabric
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-indigo)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              GOVERNED DIGITAL TWINS
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ZERO IDENTITY REPLICATION
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
            Every role understood. Every employee augmented. Every future safely simulated.
          </p>
        </div>

        {/* Responsible AI Compliance Badge */}
        <div
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚖️</span>
          <span>EU AI Act Art. 14 / OECD Workplace AI Governed</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('boardroom')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            background: activeTab === 'boardroom' ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'boardroom' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          🏛️ Future Boardroom Simulation Arena
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archetypes')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            background: activeTab === 'archetypes' ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'archetypes' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          👥 RoleTwin Archetype Catalog ({manifests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            background: activeTab === 'personal' ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'personal' ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          🛡️ Personal WorkTwin (Consent Demo)
        </button>
      </div>

      {/* TAB 1: FUTURE BOARDROOM SIMULATION ARENA */}
      {activeTab === 'boardroom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Proposal Config Card */}
          <div
            style={{
              padding: '18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Target Transformation Proposal
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setProposalTitle('Line 3 Packaging Computer Vision & Cobotics Deployment');
                    setProposalDesc(
                      'Deploy high-speed edge TPU cameras on Line 3 conveyor to automatically detect seal micro-defects, coupled with a robotic arm rejection sorter and automated HACCP compliance logging.'
                    );
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    color: 'var(--accent-indigo)',
                    cursor: 'pointer',
                  }}
                >
                  Preset 1: Line 3 CV & Cobotics
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProposalTitle('Autonomous Quality Micro-Defect Agent Swarm');
                    setProposalDesc(
                      'Introduce a distributed swarm of 4 ADK verification subagents with tool calling privileges over packaging telemetry and digital batch records.'
                    );
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: 'var(--accent-emerald)',
                    cursor: 'pointer',
                  }}
                >
                  Preset 2: Agent Swarm
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Proposal Title
              </label>
              <input
                type="text"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Transformation Scope & Architecture Description
              </label>
              <textarea
                rows={3}
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Twin Selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Participating Executive RoleTwins (Click to toggle)
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {executiveList.map((item) => {
                  const isSelected = selectedTwins.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleTwin(item.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                        border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      <span>{isSelected ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                * Role archetypes evaluate from role perspective; does not represent real persons.
              </div>
              <button
                type="button"
                onClick={handleSimulateBoardroom}
                disabled={isSimulating}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  background: isSimulating ? 'rgba(99, 102, 241, 0.4)' : 'var(--accent-indigo)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isSimulating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isSimulating ? 'Deliberating Future Boardroom...' : '⚖️ Run Governed Boardroom Simulation'}
              </button>
            </div>

            {simError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  fontSize: '12px',
                }}
              >
                {simError}
              </div>
            )}
          </div>

          {/* Simulation Results Display */}
          {simResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Governed Consensus & Conflict Card */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05))',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🏛️</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Boardroom Conflict & Consensus Synthesis
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Automated multi-twin synthesis via TwinConflictResolverAgent
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {simResult.conflict_resolution.governed_recommendation}
                  </span>
                </div>

                {/* 2x2 grid of synthesis details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {/* Consensus Points */}
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✓</span> Boardroom Consensus Points
                    </span>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {(simResult.conflict_resolution?.consensus_points || []).map((pt, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Unresolved Disagreements */}
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚠️</span> Unresolved Executive Disagreements
                    </span>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {(simResult.conflict_resolution?.unresolved_disagreements || simResult.conflict_resolution?.disagreements || []).map((dis, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{dis}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Blocking Controls */}
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🛡️</span> Mandatory SAIF/CISO Blocking Controls
                    </span>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {(simResult.conflict_resolution?.blocking_controls || []).map((ctrl, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{ctrl}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Alternative Paths */}
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🔀</span> Alternative Transformation Pathways
                    </span>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {(simResult.conflict_resolution?.alternative_transformation_paths || []).map((alt, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Required Human Approvers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Designated Human Decision-Makers Required:
                  </span>
                  {(simResult.conflict_resolution?.required_human_approvers || (simResult.conflict_resolution as any)?.recommended_human_decision_makers || []).map((approver: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      👤 {approver}
                    </span>
                  ))}
                </div>
              </div>

              {/* Individual Executive Perspective Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Synthetic Executive Perspectival Stances ({(simResult.perspectives || []).length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                  {(simResult.perspectives || []).map((persp: BoardroomPerspective, idx: number) => {
                    const badge = getStanceBadge(persp.stance);
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {persp.role_title} Twin
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Autonomy: {persp.autonomy_limit} • Role Archetype
                            </div>
                          </div>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.text,
                              border: badge.border,
                            }}
                          >
                            {persp.stance}
                          </span>
                        </div>

                        {/* Assessment */}
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            background: 'rgba(0, 0, 0, 0.2)',
                            padding: '10px',
                            borderRadius: '6px',
                            borderLeft: `3px solid ${badge.text}`,
                          }}
                        >
                          "{persp.assessment}"
                        </div>

                        {/* Key Arguments */}
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Key Arguments
                          </span>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {(persp.key_arguments || []).map((arg, i) => (
                              <li key={i}>{arg}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Identified Risks */}
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase' }}>
                            Identified Risks
                          </span>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {(persp.identified_risks || (persp as any).blocking_risks || []).map((risk: string, i: number) => (
                              <li key={i}>{risk}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Mandatory Conditions */}
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                            Mandatory Conditions
                          </span>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {(persp.mandatory_conditions || (persp as any).approval_conditions || []).map((cond: string, i: number) => (
                              <li key={i}>{cond}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Citations */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '8px' }}>
                          {(persp.evidence_citations || (persp as any).cited_evidence_ids || []).map((cite: string, i: number) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--accent-indigo)',
                              }}
                            >
                              📄 {cite}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit & Traceability Bar */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  Trace: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{simResult.trace_id}</span> •
                  Model: <span style={{ color: 'var(--accent-indigo)' }}>{simResult.model_route}</span>
                </div>
                <div>
                  Cost: <span style={{ color: 'var(--accent-emerald)' }}>${simResult.total_cost_usd.toFixed(4)}</span> •
                  Audit Verdict: <span style={{ color: '#10b981', fontWeight: 700 }}>{simResult.audit_verdict}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLETWIN ARCHETYPE CATALOG */}
      {activeTab === 'archetypes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Seeded RoleTwin Archetypes ({manifests.length})
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Synthetic role models derived from process and sector taxonomies. Default twin class.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'var(--accent-indigo)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              + Register Custom Role Archetype
            </button>
          </div>

          {/* Archetypes Grid */}
          {loadingManifests ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading governed role manifests...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {(manifests || []).map((m: WorkTwinManifest) => (
                <div
                  key={m.twin_id}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.role_archetype}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {m.twin_id}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent-indigo)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {m.autonomy_level}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {m.declared_purpose}
                  </p>

                  {/* Skills tags */}
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Approved Skills:</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {(m.skills || []).map((skill, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Disclosure Banner */}
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      marginTop: 'auto',
                    }}
                  >
                    ⚖️ {m.disclosure_text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Modal */}
          {showCreateModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
              }}
            >
              <form
                onSubmit={handleCreateRoleTwin}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  background: 'var(--bg-panel, #1e1e2d)',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Register Synthetic Role Archetype</h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Role Archetype Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cobotics Calibration Specialist"
                    value={newRoleArchetype}
                    onChange={(e) => setNewRoleArchetype(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-subtle)',
                      color: 'inherit',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Declared Purpose
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Purpose & boundary of role simulation..."
                    value={newRolePurpose}
                    onChange={(e) => setNewRolePurpose(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-subtle)',
                      color: 'inherit',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Approved Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Joint Calibration, Barrier Inspection, Telemetry"
                    value={newRoleSkills}
                    onChange={(e) => setNewRoleSkills(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-subtle)',
                      color: 'inherit',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    fontSize: '11px',
                    color: '#f43f5e',
                  }}
                >
                  🔒 Autonomy capped at WT2_SIMULATE. WT5 (consequential hiring/firing) is strictly blocked by code.
                </div>

                {createMsg && (
                  <div style={{ fontSize: '12px', color: 'var(--accent-indigo)' }}>{createMsg}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      background: 'var(--accent-indigo)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Register Archetype
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERSONAL WORKTWIN (CONSENT DEMO) */}
      {activeTab === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Banner: EU AI Act & OECD compliance */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                Governed Personal WorkTwin Framework (Opt-in Demo Persona)
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Personal WorkTwins are employee-visible, revocable assistants restricted exclusively to assisting their
                owner. FuturaSculptAI never creates unrestricted clones, never infers emotional states, and strictly
                prohibits use for termination ranking or autonomous personnel decisions.
              </p>
            </div>
          </div>

          {/* Synthetic Demo Persona Card */}
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--accent-indigo)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  EV
                </div>
                <div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Elena Vance (EMP-4102)
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Role: Senior Quality & HACCP Specialist • Status: {twinRevoked ? 'REVOKED' : 'ACTIVE_GOVERNED'}
                  </div>
                </div>
              </div>

              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: twinRevoked ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: twinRevoked ? '#f43f5e' : '#10b981',
                  border: twinRevoked ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {twinRevoked ? 'TWIN REVOKED' : 'CONSENT ACTIVE'}
              </span>
            </div>

            {/* Granular Consent Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Granular Employee Consent Envelopes
              </span>

              {/* Control 1: Knowledge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    1. Approved Knowledge Context Retrieval
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Twin may query employee's approved SOPs, project logs, and handover notes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={knowledgeConsent}
                  onChange={(e) => setKnowledgeConsent(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {/* Control 2: Writing Style */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    2. Document & Meeting Brief Formatting Assistance
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Twin may draft inspection summaries in employee's structural format.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={writingStyleConsent}
                  onChange={(e) => setWritingStyleConsent(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {/* Control 3: Delegated Tasks */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    3. Delegated Reversible Task Preparation (WT3_PREPARE)
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Twin may prepare calibration tickets, but requires human approval before dispatch.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={delegatedTaskConsent}
                  onChange={(e) => setDelegatedTaskConsent(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              {/* Control 4: Voice & Avatar Replication (LOCKED / PROHIBITED) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.05)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f43f5e' }}>
                      4. Biometric Voice & Avatar Cloning
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: '#f43f5e',
                        color: '#ffffff',
                      }}
                    >
                      PROHIBITED
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Permanently locked per platform policy & EU AI Act to eliminate deepfake and identity replication attack surfaces.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked={false}
                  style={{ width: '18px', height: '18px', cursor: 'not-allowed', opacity: 0.5 }}
                />
              </div>

              {/* Control 5: Autonomous Employment Decisions (LOCKED / PROHIBITED) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.05)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f43f5e' }}>
                      5. Autonomous Hiring, Discipline, or Termination Ranking
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: '#f43f5e',
                        color: '#ffffff',
                      }}
                    >
                      PROHIBITED (WT5)
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Zero adverse employment action red line enforced at the kernel layer.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked={false}
                  style={{ width: '18px', height: '18px', cursor: 'not-allowed', opacity: 0.5 }}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setTwinRevoked(!twinRevoked)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: twinRevoked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                  color: twinRevoked ? '#10b981' : '#f43f5e',
                  border: twinRevoked ? '1px solid #10b981' : '1px solid #f43f5e',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {twinRevoked ? 'Restore Consent' : '🚨 Revoke Personal Twin Immediately'}
              </button>

              <button
                type="button"
                onClick={handleSaveConsent}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  background: 'var(--accent-indigo)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save Consent & Update Boundary Envelope
              </button>
            </div>

            {consentMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--accent-indigo)',
                  fontSize: '12px',
                }}
              >
                {consentMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
