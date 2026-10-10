/**
 * Google ADK Multi-Agent Swarm Orchestrator Console.
 * Coordinates 5 specialized Google ADK agents with real-time A0-A4 autonomy tiers,
 * step-by-step thoughts, tool observations, and verifiable executive synthesis.
 * Conforms to WCAG 2.1 AA with role="region", role="log", role="alert", and accessible form labels.
 */

import React, { useState } from 'react';
import { api } from '../services/api';
import { SwarmRunRequest, SwarmRunResponse } from '../types';

export interface AgentSwarmConsoleProps {
  /** Optional custom executor for multi-agent swarm deliberation. */
  onRunSwarm?: (request: SwarmRunRequest) => Promise<SwarmRunResponse>;
}

export const AgentSwarmConsole: React.FC<AgentSwarmConsoleProps> = ({
  onRunSwarm,
}) => {
  const [prompt, setPrompt] = useState<string>(
    'Augment high-speed seal verification with Edge-TPU vision sensors.'
  );
  const [horizonYears, setHorizonYears] = useState<number>(3);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [swarmResult, setSwarmResult] = useState<SwarmRunResponse | null>(null);
  const [swarmError, setSwarmError] = useState<string | null>(null);

  const handleLaunchSwarm = async (): Promise<void> => {
    if (!prompt.trim()) return;

    try {
      setIsRunning(true);
      setSwarmError(null);
      const fn =
        onRunSwarm ||
        ((req: SwarmRunRequest) => api.runAgentSwarm(req));

      const payload: SwarmRunRequest = {
        scenario_prompt: prompt,
        sector: 'food_manufacturing',
        target_role_id: 'ROL-001',
        target_capability_id: 'CAP-001',
        horizon_years: horizonYears,
        evidence_ids: ['EVD-SOP-01', 'EVD-STRAT-01'],
      };

      const result = await fn(payload);
      setSwarmResult(result);
    } catch (err: any) {
      setSwarmError(err.message || 'Swarm execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'A4_DISALLOWED':
        return 'var(--accent-rose, #f43f5e)';
      case 'A2_APPROVAL_GATE':
        return 'var(--accent-amber, #f59e0b)';
      case 'A1_RECOMMENDATION':
        return 'var(--accent-cyan, #06b6d4)';
      default:
        return 'var(--accent-emerald, #10b981)';
    }
  };

  return (
    <div
      className="glass-panel panel-card"
      style={{ marginTop: '24px' }}
      role="region"
      aria-label="Google ADK Multi-Agent Swarm Orchestrator"
    >
      <div className="section-header">
        <h2 className="section-title">
          <span>🤖</span> Google ADK Multi-Agent Swarm Orchestrator
        </h2>
        <span
          className="badge"
          style={{
            background: 'rgba(99,102,241,0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
          aria-label="Supervisor framework: Google GenAI ADK"
        >
          GENAI-ADK SUPERVISOR
        </span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
        Coordinates 5 specialized Google ADK agents (WorkGraph Architect, Task Decomposer, Skill Gap Analyst, Governance Critic, FinOps Evaluator). Enforces Responsible AI Red Lines and A0-A4 autonomy tiers.
      </p>

      {/* Input Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          style={{
            flex: 1,
            minWidth: '280px',
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
          placeholder="Enter transformation scenario prompt..."
          aria-label="Transformation scenario prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isRunning}
        />

        <select
          className="form-select"
          style={{ width: 'auto', fontSize: '12px', padding: '6px 12px' }}
          value={horizonYears}
          onChange={(e) => setHorizonYears(Number(e.target.value))}
          disabled={isRunning}
          aria-label="Select horizon years"
        >
          <option value={1}>Horizon: 1 Year</option>
          <option value={2}>Horizon: 2 Years</option>
          <option value={3}>Horizon: 3 Years</option>
          <option value={5}>Horizon: 5 Years</option>
        </select>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleLaunchSwarm}
          disabled={isRunning}
          style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
          aria-label="Launch Swarm Deliberation"
        >
          {isRunning ? 'Deliberating...' : '🚀 Launch Swarm Deliberation'}
        </button>
      </div>

      {swarmError && (
        <div
          role="alert"
          style={{
            background: 'rgba(244,63,94,0.1)',
            color: 'var(--accent-rose)',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '13px',
            marginBottom: '14px',
          }}
        >
          {swarmError}
        </div>
      )}

      {/* Swarm Result and Trajectory Inspector */}
      {swarmResult && (
        <div
          className="drawer-panel"
          style={{ marginTop: '16px' }}
          role="region"
          aria-label="Swarm Deliberation Result and Synthesis"
        >
          {/* Header Status */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>RUN ID: </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{swarmResult.run_id}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(15,23,42,0.8)',
                  color: getTierColor(swarmResult.autonomy_gate),
                  border: `1px solid ${getTierColor(swarmResult.autonomy_gate)}`,
                }}
                aria-label={`Autonomy tier gate: ${swarmResult.autonomy_gate}`}
              >
                AUTONOMY: {swarmResult.autonomy_gate}
              </span>
              <span className="badge badge-tenant" aria-label={`Execution status: ${swarmResult.status}`}>
                {swarmResult.status}
              </span>
            </div>
          </div>

          {/* Executive Synthesis Card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
              {swarmResult.synthesis.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              {swarmResult.synthesis.executive_summary}
            </p>

            <div
              className="grid-cards"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}
            >
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>WORK ALLOCATION</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  Human: {swarmResult.synthesis.projected_human_work_pct}% | Agent:{' '}
                  {swarmResult.synthesis.projected_agent_work_pct}%
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RESKILLING PATHWAY</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {swarmResult.synthesis.reskilling_pathway}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>COMPLIANCE & FINOPS</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {swarmResult.synthesis.compliance_verdict} (${swarmResult.synthesis.estimated_token_cost_usd} USD)
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Deliberation Trajectory */}
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
            Multi-Agent Deliberation Trajectory ({swarmResult.trajectories.length} steps)
          </div>
          <div
            role="log"
            aria-label="Agent Deliberation Trajectory"
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.25)',
              padding: '10px',
              borderRadius: '6px',
            }}
          >
            {swarmResult.trajectories.map((step) => (
              <div
                key={step.step_index}
                style={{
                  fontSize: '11px',
                  padding: '6px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong style={{ color: '#a5b4fc' }}>
                    #{step.step_index} {step.agent_role}
                  </strong>
                  {step.tool_called && (
                    <span
                      style={{
                        background: 'rgba(6,182,212,0.15)',
                        color: 'var(--accent-cyan)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                      }}
                    >
                      tool: {step.tool_called}
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <em>Thought:</em> {step.thought}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <em>Obs:</em> {step.observation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
