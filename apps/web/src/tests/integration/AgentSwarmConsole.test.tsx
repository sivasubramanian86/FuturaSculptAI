import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentSwarmConsole } from '../../components/AgentSwarmConsole';
import { api } from '../../services/api';
import { SwarmRunResponse } from '../../types';

describe('AgentSwarmConsole Component', () => {
  const mockSwarmSuccess: SwarmRunResponse = {
    run_id: 'RUN-AA11BB22CC',
    tenant_id: 'tenant-food-mfg-01',
    status: 'REQUIRES_APPROVAL',
    autonomy_gate: 'A2_APPROVAL_GATE',
    trajectories: [
      {
        agent_role: 'EngagementOrchestrator',
        step_index: 1,
        thought: 'Decomposing organizational transformation request.',
        tool_called: 'hydrate_temporal_workgraph',
        observation: 'Active seed graph loaded.',
        autonomy_tier: 'A0_READ_ONLY',
        evidence_citations: ['EVD-001'],
        timestamp: '2026-10-10T00:00:00Z',
      },
      {
        agent_role: 'WorkGraphArchitectAgent',
        step_index: 2,
        thought: 'Mutating graph topology.',
        tool_called: undefined,
        observation: 'Mapped introduction of Edge-TPU Vision System.',
        autonomy_tier: 'A1_RECOMMENDATION',
        evidence_citations: ['EVD-001'],
        timestamp: '2026-10-10T00:00:01Z',
      },
    ],
    synthesis: {
      title: 'Enterprise Work Transformation: Horizon Year 3',
      executive_summary: 'Multi-agent swarm synthesized hybrid augmentation strategy.',
      human_in_the_loop_recommendation: 'Empower operators with Edge-TPU anomaly adjudication cockpits.',
      projected_human_work_pct: 22.0,
      projected_agent_work_pct: 78.0,
      reskilling_pathway: 'ROL-001 Inspector -> ROL-003 AI Automation Supervisor.',
      compliance_verdict: 'PASSED_SAIF_CONTROLS',
      estimated_token_cost_usd: 0.0009,
      citations: ['EVD-001'],
    },
    started_at: '2026-10-10T00:00:00Z',
    completed_at: '2026-10-10T00:00:02Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders input controls and ignores submission when prompt is empty', async () => {
    const handleRun = vi.fn().mockResolvedValue(mockSwarmSuccess);
    render(<AgentSwarmConsole onRunSwarm={handleRun} />);

    expect(screen.getByText(/Google ADK Multi-Agent Swarm Orchestrator/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Enter transformation scenario prompt/i);
    fireEvent.change(input, { target: { value: '   ' } });

    const launchBtn = screen.getByRole('button', { name: /Launch Swarm Deliberation/i });
    fireEvent.click(launchBtn);

    expect(handleRun).not.toHaveBeenCalled();
  });

  it('executes swarm deliberation with onRunSwarm prop, displays trajectories, and handles tier colors', async () => {
    const handleRun = vi.fn().mockResolvedValue(mockSwarmSuccess);
    render(<AgentSwarmConsole onRunSwarm={handleRun} />);

    // Change horizon select
    const horizonSelect = screen.getByLabelText(/Select horizon years/i);
    fireEvent.change(horizonSelect, { target: { value: '2' } });

    // Submit
    const launchBtn = screen.getByRole('button', { name: /Launch Swarm Deliberation/i });
    fireEvent.click(launchBtn);

    await waitFor(() => {
      expect(handleRun).toHaveBeenCalledWith(
        expect.objectContaining({
          horizon_years: 2,
        })
      );
      expect(screen.getByText('RUN-AA11BB22CC')).toBeInTheDocument();
      expect(screen.getByText(/AUTONOMY: A2_APPROVAL_GATE/i)).toBeInTheDocument();
      expect(screen.getByText('Enterprise Work Transformation: Horizon Year 3')).toBeInTheDocument();
      expect(screen.getByText(/Human: 22% \| Agent: 78%/i)).toBeInTheDocument();
      expect(screen.getByText('ROL-001 Inspector -> ROL-003 AI Automation Supervisor.')).toBeInTheDocument();
      expect(screen.getByText(/tool: hydrate_temporal_workgraph/i)).toBeInTheDocument();
    });
  });

  it('renders A4_DISALLOWED, A1_RECOMMENDATION, and default tier colors correctly', async () => {
    // 1. Test A4_DISALLOWED
    const mockA4 = {
      ...mockSwarmSuccess,
      run_id: 'RUN-A4-BLOCKED',
      autonomy_gate: 'A4_DISALLOWED' as const,
      status: 'BLOCKED_BY_POLICY',
    };
    const { rerender } = render(<AgentSwarmConsole onRunSwarm={vi.fn().mockResolvedValue(mockA4)} />);
    const launchBtn1 = screen.getByRole('button', { name: /Launch Swarm Deliberation/i });
    fireEvent.click(launchBtn1);

    await waitFor(() => {
      expect(screen.getByText(/AUTONOMY: A4_DISALLOWED/i)).toBeInTheDocument();
    });

    // 2. Test A1_RECOMMENDATION
    const mockA1 = {
      ...mockSwarmSuccess,
      run_id: 'RUN-A1-RECOMMENDED',
      autonomy_gate: 'A1_RECOMMENDATION' as const,
      status: 'COMPLETED',
    };
    rerender(<AgentSwarmConsole onRunSwarm={vi.fn().mockResolvedValue(mockA1)} />);
    const launchBtn2 = screen.getByRole('button', { name: /Launch Swarm Deliberation/i });
    fireEvent.click(launchBtn2);

    await waitFor(() => {
      expect(screen.getByText(/AUTONOMY: A1_RECOMMENDATION/i)).toBeInTheDocument();
    });

    // 3. Test default tier (A0_READ_ONLY)
    const mockA0 = {
      ...mockSwarmSuccess,
      run_id: 'RUN-A0-DEFAULT',
      autonomy_gate: 'A0_READ_ONLY' as any,
      status: 'COMPLETED',
    };
    rerender(<AgentSwarmConsole onRunSwarm={vi.fn().mockResolvedValue(mockA0)} />);
    const launchBtn3 = screen.getByRole('button', { name: /Launch Swarm Deliberation/i });
    fireEvent.click(launchBtn3);

    await waitFor(() => {
      expect(screen.getByText(/AUTONOMY: A0_READ_ONLY/i)).toBeInTheDocument();
    });
  });

  it('uses default api.runAgentSwarm when onRunSwarm prop is omitted', async () => {
    vi.spyOn(api, 'runAgentSwarm').mockResolvedValue(mockSwarmSuccess);
    render(<AgentSwarmConsole />);

    const launchBtn = screen.getByRole('button', { name: /Launch Swarm Deliberation/i });
    fireEvent.click(launchBtn);

    await waitFor(() => {
      expect(api.runAgentSwarm).toHaveBeenCalled();
      expect(screen.getByText('RUN-AA11BB22CC')).toBeInTheDocument();
    });
  });

  it('handles execution failure and displays error banner', async () => {
    const handleRun = vi.fn().mockRejectedValue(new Error('Vertex quota exhausted'));
    render(<AgentSwarmConsole onRunSwarm={handleRun} />);

    const launchBtn = screen.getByRole('button', { name: /Launch Swarm Deliberation/i });
    fireEvent.click(launchBtn);

    await waitFor(() => {
      expect(screen.getByText('Vertex quota exhausted')).toBeInTheDocument();
    });

    // Also test rejection without message
    const handleRunNoMsg = vi.fn().mockRejectedValue({});
    render(<AgentSwarmConsole onRunSwarm={handleRunNoMsg} />);
    const launchButtons = screen.getAllByRole('button', { name: /Launch Swarm Deliberation/i });
    fireEvent.click(launchButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Swarm execution failed')).toBeInTheDocument();
    });
  });

  it('restores cached result from sessionStorage and switches enterprise options via quick chips', async () => {
    window.sessionStorage.setItem('futura-demo-swarm-result', JSON.stringify(mockSwarmSuccess));
    render(<AgentSwarmConsole />);

    // Expect cached result loaded from session storage
    expect(screen.getByText('RUN-AA11BB22CC')).toBeInTheDocument();

    // Click on Tesla chip
    const teslaBtn = screen.getByRole('button', { name: /Tesla Inc/i });
    fireEvent.click(teslaBtn);
    expect(screen.getByDisplayValue(/giga-casting defect detection/i)).toBeInTheDocument();

    // Click on Apple chip
    const appleBtn = screen.getByRole('button', { name: /Apple Inc/i });
    fireEvent.click(appleBtn);
    expect(screen.getByDisplayValue(/solder joint acoustic inspection/i)).toBeInTheDocument();

    // Click on Coca-Cola chip
    const cokeBtn = screen.getByRole('button', { name: /The Coca-Cola Company/i });
    fireEvent.click(cokeBtn);
    expect(screen.getByDisplayValue(/automated beverage filling line/i)).toBeInTheDocument();

    // Click on Berkshire chip
    const berkshireBtn = screen.getByRole('button', { name: /Berkshire Hathaway/i });
    fireEvent.click(berkshireBtn);
    expect(screen.getByDisplayValue(/BNSF freight trains/i)).toBeInTheDocument();

    // Click on Custom chip
    const customBtn = screen.getByRole('button', { name: /Custom Enterprise/i });
    fireEvent.click(customBtn);
    expect(screen.getByDisplayValue(/organizational workforce transformation/i)).toBeInTheDocument();
  });
});

