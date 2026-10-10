import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WorkGraphView } from './WorkGraphView';
import { WorkGraphNode, WorkGraphEdge } from '../types';

describe('WorkGraphView Component', () => {
  const mockNodes: WorkGraphNode[] = [
    {
      node_id: 'OUT-001',
      name: 'Zero Contamination Recalls',
      node_type: 'outcome',
      description: 'Zero food safety escapes to retail shelves.',
      properties: { criticality: 'critical', status: 'active' },
      evidence_ids: ['EV-001', 'EV-002'],
    },
    {
      node_id: 'CAP-001',
      name: 'HACCP Thermal Monitoring',
      node_type: 'capability',
      description: 'Continuous temperature monitoring.',
      properties: {},
      evidence_ids: [],
    },
    {
      node_id: 'WF-001',
      name: 'Pouch Sealing Line Workflow',
      node_type: 'workflow',
      description: 'High speed pouch sealing operation.',
      properties: { criticality: 'high' },
      evidence_ids: ['EV-003'],
    },
    {
      node_id: 'TSK-001',
      name: 'Thermal Seal Integrity Check',
      node_type: 'task',
      description: 'Periodic seal testing.',
      properties: {},
      evidence_ids: ['EV-004'],
    },
    {
      node_id: 'ROL-001',
      name: 'Frontline Packaging Operator',
      node_type: 'role',
      description: 'Line inspection operator.',
      properties: {},
      evidence_ids: [],
    },
    {
      node_id: 'AGT-001',
      name: 'Vision Defect Classifier Agent',
      node_type: 'agent',
      description: 'Google ADK edge vision worker.',
      properties: {},
      evidence_ids: [],
    },
    {
      node_id: 'CTL-001',
      name: 'Emergency Seal Shutdown Interlock',
      node_type: 'control',
      description: 'Physical safety boundary.',
      properties: {},
      evidence_ids: [],
    },
    {
      node_id: 'OTH-001',
      name: 'Unknown Node',
      node_type: 'unknown_type' as any,
      description: 'Fallback test entity.',
      properties: {},
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

  it('renders selected node detail drawer with properties and citations', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <WorkGraphView
        nodes={mockNodes}
        edges={mockEdges}
        onSelectNode={onSelect}
        selectedNode={mockNodes[0]} // has criticality 'critical', status 'active', 2 citations
      />
    );

    expect(screen.getByText(/Node Detail:/i)).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('EV-001, EV-002')).toBeInTheDocument();

    // Rerender with node lacking explicit properties (fallback to defaults)
    rerender(
      <WorkGraphView
        nodes={mockNodes}
        edges={mockEdges}
        onSelectNode={onSelect}
        selectedNode={mockNodes[1]} // empty properties, empty evidence_ids
      />
    );

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Direct Ingestion')).toBeInTheDocument();
  });
});
