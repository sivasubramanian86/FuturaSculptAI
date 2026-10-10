import React, { useState } from 'react';
import { WorkGraphNode, WorkGraphEdge } from '../types';

interface WorkGraphViewProps {
  nodes: WorkGraphNode[];
  edges: WorkGraphEdge[];
  onSelectNode: (node: WorkGraphNode) => void;
  selectedNode: WorkGraphNode | null;
}

export const WorkGraphView: React.FC<WorkGraphViewProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedNode,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredNodes = filterType === 'all'
    ? nodes
    : nodes.filter((n) => n.node_type === filterType);

  const getTagClass = (type: string) => {
    switch (type) {
      case 'outcome': return 'tag-outcome';
      case 'capability': return 'tag-capability';
      case 'workflow': return 'tag-workflow';
      case 'task': return 'tag-task';
      case 'role': return 'tag-role';
      case 'agent': return 'tag-agent';
      case 'control': return 'tag-control';
      default: return 'tag-capability';
    }
  };

  return (
    <div className="glass-panel panel-card">
      <div className="section-header">
        <h2 className="section-title">
          <span>🌐</span> Temporal Work Transformation Graph
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter nodes by type"
          >
            <option value="all">All Entity Types ({nodes.length})</option>
            <option value="outcome">Outcomes</option>
            <option value="capability">Capabilities</option>
            <option value="workflow">Workflows</option>
            <option value="task">Tasks</option>
            <option value="role">Roles</option>
            <option value="skill">Skills</option>
            <option value="system">Systems</option>
            <option value="agent">Agents</option>
            <option value="control">Controls</option>
          </select>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        Temporal digital twin connecting business outcomes, operational workflows, tasks, skills, and autonomous Google ADK agents ({nodes.length} nodes, {edges.length} directed edges). Click any node to inspect evidence lineage.
      </p>

      <div className="nodes-grid">
        {filteredNodes.map((node) => {
          const isSelected = selectedNode?.node_id === node.node_id;
          return (
            <div
              key={node.node_id}
              className="node-item"
              style={{
                borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                background: isSelected ? 'rgba(6, 182, 212, 0.12)' : undefined,
              }}
              onClick={() => onSelectNode(node)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectNode(node)}
            >
              <span className={`node-tag ${getTagClass(node.node_type)}`}>
                {node.node_type}
              </span>
              <div className="node-name">{node.name}</div>
              <div className="node-desc">{node.description}</div>
              <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ID: {node.node_id} • Citations: {node.evidence_ids.length}
              </div>
            </div>
          );
        })}
      </div>

      {selectedNode && (
        <div className="drawer-panel" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
              Node Detail: <span style={{ color: 'var(--accent-cyan)' }}>{selectedNode.name}</span>
            </h3>
            <span className={`node-tag ${getTagClass(selectedNode.node_type)}`}>
              {selectedNode.node_type}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {selectedNode.description}
          </p>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CRITICALITY</div>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                {selectedNode.properties.criticality || 'Standard'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TEMPORAL STATUS</div>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                {selectedNode.properties.status || 'Active'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>EVIDENCE CITATIONS</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                {selectedNode.evidence_ids.join(', ') || 'Direct Ingestion'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
