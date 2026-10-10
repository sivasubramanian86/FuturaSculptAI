import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WorkGraphView } from '../components/WorkGraphView';
import { WorkGraphNode, WorkGraphEdge, BlastRadiusResponse } from '../types';
import { api } from '../services/api';

describe('WorkGraphView Component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockNodes: WorkGraphNode[] = [
    {
      node_id: 'OUT-001',
      name: 'Zero Contamination Recalls',
      node_type: 'outcome',
      description: 'Zero food safety escapes to retail shelves.',
      properties: { criticality: 'critical', status: 'active', sector: 'food_manufacturing' },
      evidence_ids: ['EV-001', 'EV-002'],
    },
    {
      node_id: 'CAP-001',
      name: 'HACCP Thermal Monitoring',
      node_type: 'capability',
      description: 'Continuous temperature monitoring.',
      properties: { criticality: 'medium', status: 'active', sector: 'food_manufacturing' },
      evidence_ids: [],
    },
    {
      node_id: 'WF-001',
      name: 'Pouch Sealing Line Workflow',
      node_type: 'workflow',
      description: 'High speed pouch sealing operation.',
      properties: { criticality: 'high', status: 'active', sector: 'food_manufacturing' },
      evidence_ids: ['EV-003'],
    },
    {
      node_id: 'TSK-001',
      name: 'Thermal Seal Integrity Check',
      node_type: 'task',
      description: 'Periodic seal testing.',
      properties: { criticality: 'medium', status: 'active', sector: 'food_manufacturing' },
      evidence_ids: ['EV-004'],
    },
    {
      node_id: 'ROL-001',
      name: 'Frontline Packaging Operator',
      node_type: 'role',
      description: 'Line inspection operator.',
      properties: { criticality: 'medium', status: 'active', sector: 'food_manufacturing' },
      evidence_ids: [],
    },
    {
      node_id: 'AGT-001',
      name: 'Vision Defect Classifier Agent',
      node_type: 'agent',
      description: 'Google ADK edge vision worker.',
      properties: { criticality: 'medium', status: 'active', sector: 'food_manufacturing' },
      evidence_ids: [],
    },
    {
      node_id: 'CTL-001',
      name: 'Emergency Seal Shutdown Interlock',
      node_type: 'control',
      description: 'Physical safety boundary.',
      properties: { criticality: 'medium', status: 'active', sector: 'food_manufacturing' },
      evidence_ids: [],
    },
    {
      node_id: 'OTH-001',
      name: 'Unknown Node',
      node_type: 'unknown_type' as any,
      description: 'Fallback test entity.',
      properties: { criticality: 'low', status: 'active', sector: 'food_manufacturing' },
      evidence_ids: [],
    },
  ];

  const mockEdges: WorkGraphEdge[] = [
    { edge_id: 'ED-01', source_id: 'OUT-001', target_id: 'CAP-001', relationship_type: 'requires' },
  ];

  it('renders all node entity types and responds to filter selection', () => {
    const onSelect = vi.fn();
    render(
      <WorkGraphView
        nodes={mockNodes}
        edges={mockEdges}
        onSelectNode={onSelect}
        selectedNode={null}
      />
    );

    expect(screen.getByText('Zero Contamination Recalls')).toBeInTheDocument();
    expect(screen.getByText('HACCP Thermal Monitoring')).toBeInTheDocument();

    // Select filter "task"
    const select = screen.getByLabelText(/Filter nodes by type/i);
    fireEvent.change(select, { target: { value: 'task' } });

    expect(screen.getByText('Thermal Seal Integrity Check')).toBeInTheDocument();
    expect(screen.queryByText('Zero Contamination Recalls')).not.toBeInTheDocument();

    // Reset filter to "all"
    fireEvent.change(select, { target: { value: 'all' } });
    expect(screen.getByText('Zero Contamination Recalls')).toBeInTheDocument();
  });

  it('selects node on click and via Enter keyboard interaction', () => {
    const onSelect = vi.fn();
    render(
      <WorkGraphView
        nodes={mockNodes}
        edges={mockEdges}
        onSelectNode={onSelect}
        selectedNode={mockNodes[0]}
      />
    );

    const taskNode = screen.getByText('Thermal Seal Integrity Check');
    fireEvent.click(taskNode);
    expect(onSelect).toHaveBeenCalledWith(mockNodes[3]);

    fireEvent.keyDown(taskNode, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(mockNodes[3]);

    // Non-enter key does not trigger
    fireEvent.keyDown(taskNode, { key: 'Escape' });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('handles horizon year switching with and without callback', () => {
    const onSelect = vi.fn();
    const onHorizonChange = vi.fn();

    const { rerender } = render(
      <WorkGraphView
        nodes={mockNodes}
        edges={mockEdges}
        onSelectNode={onSelect}
        selectedNode={null}
        onHorizonChange={onHorizonChange}
      />
    );

    fireEvent.click(screen.getByText('Yr 1: Augmented'));
    expect(onHorizonChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText('Yr 3: Autonomous'));
    expect(onHorizonChange).toHaveBeenCalledWith(3);

    // Rerender without onHorizonChange prop
    rerender(
      <WorkGraphView
        nodes={mockNodes}
        edges={mockEdges}
        onSelectNode={onSelect}
        selectedNode={null}
      />
    );
    fireEvent.click(screen.getByText('Yr 0: Baseline'));
    expect(onHorizonChange).toHaveBeenCalledTimes(2);
  });

  it('analyzes blast radius: success, risk colors, error handling, and API fallback', async () => {
    const onSelect = vi.fn();
    const onInspectBlastRadius = vi.fn();

    const mockBlast: BlastRadiusResponse = {
      target_node_id: 'CAP-001',
      target_node_name: 'HACCP Thermal Monitoring',
      target_node_type: 'capability',
      total_affected_nodes: 3,
      affected_roles: ['Frontline Operator'],
      affected_tasks: ['Pouch Sealing'],
      affected_systems: ['Conveyor #1'],
      affected_controls: ['FDA 21 CFR Part 11'],
      cascade: [
        {
          node_id: 'WF-001',
          name: 'Pouch Sealing Line Workflow',
          node_type: 'workflow',
          depth: 1,
          relationship_chain: ['CAP-001', 'WF-001'],
        },
      ],
      disruption_risk: 'CRITICAL',
      analyzed_at: '2026-10-10T12:00:00Z',
    };

    onInspectBlastRadius.mockResolvedValueOnce(mockBlast);

    render(
      <WorkGraphView
        nodes={mockNodes}
        edges={mockEdges}
        onSelectNode={onSelect}
        selectedNode={mockNodes[1]}
        onInspectBlastRadius={onInspectBlastRadius}
      />
    );

    const blastBtn = screen.getByText(/Analyze Blast Radius/i);
    fireEvent.click(blastBtn);

    await waitFor(() => {
      expect(screen.getByText(/DISRUPTION RISK: CRITICAL/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Affected Entities:/i)).toBeInTheDocument();
      expect(screen.getByText(/Roles: Frontline Operator/i)).toBeInTheDocument();
      expect(screen.getByText(/Controls Impacted: FDA 21 CFR Part 11/i)).toBeInTheDocument();
    });

    // Selecting another node resets blast radius result
    fireEvent.click(screen.getByText('Zero Contamination Recalls'));
    expect(screen.queryByText(/DISRUPTION RISK: CRITICAL/i)).not.toBeInTheDocument();

    // Test different risk levels: HIGH, MEDIUM, LOW (default color)
    onInspectBlastRadius.mockResolvedValueOnce({
      ...mockBlast,
      disruption_risk: 'HIGH',
      affected_controls: [],
    });
    fireEvent.click(screen.getByText(/Analyze Blast Radius/i));
    await waitFor(() => {
      expect(screen.getByText(/DISRUPTION RISK: HIGH/i)).toBeInTheDocument();
    });

    onInspectBlastRadius.mockResolvedValueOnce({
      ...mockBlast,
      disruption_risk: 'MEDIUM',
      affected_controls: [],
    });
    fireEvent.click(screen.getByText(/Analyze Blast Radius/i));
    await waitFor(() => {
      expect(screen.getByText(/DISRUPTION RISK: MEDIUM/i)).toBeInTheDocument();
    });

    onInspectBlastRadius.mockResolvedValueOnce({
      ...mockBlast,
      disruption_risk: 'LOW',
      affected_controls: [],
      affected_roles: [],
      cascade: [],
    });
    fireEvent.click(screen.getByText(/Analyze Blast Radius/i));
    await waitFor(() => {
      expect(screen.getByText(/DISRUPTION RISK: LOW/i)).toBeInTheDocument();
    });

    // Blast error handling with and without message
    onInspectBlastRadius.mockRejectedValueOnce(new Error('Graph engine timeout'));
    fireEvent.click(screen.getByText(/Analyze Blast Radius/i));
    await waitFor(() => {
      expect(screen.getByText('Graph engine timeout')).toBeInTheDocument();
    });

    onInspectBlastRadius.mockRejectedValueOnce({});
    fireEvent.click(screen.getByText(/Analyze Blast Radius/i));
    await waitFor(() => {
      expect(screen.getByText('Failed to analyze blast radius')).toBeInTheDocument();
    });
  });

  it('uses api.getBlastRadius as fallback when prop is omitted', async () => {
    const onSelect = vi.fn();
    vi.spyOn(api, 'getBlastRadius').mockResolvedValueOnce({
      target_node_id: 'OUT-001',
      target_node_name: 'Zero Contamination Recalls',
      target_node_type: 'outcome',
      total_affected_nodes: 0,
      affected_roles: [],
      affected_tasks: [],
      affected_systems: [],
      affected_controls: [],
      cascade: [],
      disruption_risk: 'LOW',
      analyzed_at: '2026-10-10',
    });

    render(
      <WorkGraphView
        nodes={mockNodes}
        edges={mockEdges}
        onSelectNode={onSelect}
        selectedNode={mockNodes[0]}
      />
    );

    fireEvent.click(screen.getByText(/Analyze Blast Radius/i));
    await waitFor(() => {
      expect(api.getBlastRadius).toHaveBeenCalledWith('OUT-001', 3);
      expect(screen.getByText(/DISRUPTION RISK: LOW/i)).toBeInTheDocument();
    });
  });
});
