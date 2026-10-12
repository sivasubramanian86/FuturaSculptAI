/**
 * Interactive WorkGraph Visualizer with Temporal Horizon Projections & Blast Radius Inspection.
 * Conforms to WCAG 2.1 AA with role="region", tablist keyboard controls, and focus indicators.
 */

import React, { useState } from 'react';
import { api } from '../services/api';
import {
  BlastRadiusResponse,
  WorkGraphEdge,
  WorkGraphNode,
} from '../types';
import { TranslationKeys } from '../i18n';
import { en } from '../i18n/locales/en';

export interface WorkGraphViewProps {
  /** Array of WorkGraph ontology nodes. */
  nodes: WorkGraphNode[];
  /** Array of directed relationship edges. */
  edges: WorkGraphEdge[];
  /** Callback fired when a node is selected. */
  onSelectNode: (node: WorkGraphNode) => void;
  /** Currently selected WorkGraph node, if any. */
  selectedNode: WorkGraphNode | null;
  /** Current temporal horizon projection year (0, 1, or 3). */
  currentHorizonYear?: number;
  /** Callback fired when the horizon year changes. */
  onHorizonChange?: (year: number) => void;
  /** Optional custom handler for blast radius calculation. */
  onInspectBlastRadius?: (nodeId: string) => Promise<BlastRadiusResponse>;
  /** Optional localized translations dictionary. */
  i18n?: TranslationKeys;
}

export const WorkGraphView: React.FC<WorkGraphViewProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedNode,
  currentHorizonYear = 0,
  onHorizonChange,
  onInspectBlastRadius,
  i18n,
}) => {
  const t = i18n || en;
  const [filterType, setFilterType] = useState<string>('all');
  const [horizonYear, setHorizonYear] = useState<number>(currentHorizonYear);

  // Blast radius state
  const [analyzingBlast, setAnalyzingBlast] = useState<boolean>(false);
  const [blastResult, setBlastResult] = useState<BlastRadiusResponse | null>(null);
  const [blastError, setBlastError] = useState<string | null>(null);

  const filteredNodes =
    filterType === 'all'
      ? nodes
      : nodes.filter((n) => n.node_type === filterType);

  const handleHorizonClick = (year: number) => {
    setHorizonYear(year);
    if (onHorizonChange) {
      onHorizonChange(year);
    }
  };

  const handleAnalyzeBlastRadius = async (nodeId: string) => {
    try {
      setAnalyzingBlast(true);
      setBlastError(null);
      const fn =
        onInspectBlastRadius ||
        ((id: string) => api.getBlastRadius(id, 3));
      const res = await fn(nodeId);
      setBlastResult(res);
    } catch (err: any) {
      setBlastError(err.message || 'Failed to analyze blast radius');
    } finally {
      setAnalyzingBlast(false);
    }
  };

  const getTagClass = (type: string) => {
    switch (type) {
      case 'outcome':
        return 'tag-outcome';
      case 'capability':
        return 'tag-capability';
      case 'workflow':
        return 'tag-workflow';
      case 'task':
        return 'tag-task';
      case 'role':
        return 'tag-role';
      case 'agent':
        return 'tag-agent';
      case 'control':
        return 'tag-control';
      default:
        return 'tag-capability';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'var(--accent-rose, #f43f5e)';
      case 'HIGH':
        return 'var(--accent-amber, #f59e0b)';
      case 'MEDIUM':
        return 'var(--accent-cyan, #06b6d4)';
      default:
        return 'var(--accent-emerald, #10b981)';
    }
  };

  return (
    <div className="glass-panel panel-card" role="region" aria-label="Temporal Work Transformation Graph">
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <h2 className="section-title">
          <span>🌐</span> {t.wgTitle}
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Horizon Year Tabs */}
          <div
            role="tablist"
            aria-label="Transformation Horizon Years"
            style={{ display: 'flex', background: 'rgba(15,23,42,0.6)', borderRadius: '6px', padding: '2px' }}
          >
            {[
              { year: 0, label: 'Yr 0: Baseline' },
              { year: 1, label: 'Yr 1: Augmented' },
              { year: 3, label: 'Yr 3: Autonomous' },
            ].map((tab) => (
              <button
                key={tab.year}
                type="button"
                role="tab"
                aria-selected={horizonYear === tab.year}
                aria-controls="graph-nodes-grid"
                onClick={() => handleHorizonClick(tab.year)}
                style={{
                  background: horizonYear === tab.year ? 'var(--accent-cyan)' : 'transparent',
                  color: horizonYear === tab.year ? '#020617' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Node Filter */}
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
        Temporal digital twin connecting business outcomes, operational workflows, tasks, skills, and autonomous Google ADK agents ({nodes.length} nodes, {edges.length} directed edges). Horizon Year: <strong>{horizonYear}</strong>.
      </p>

      <div id="graph-nodes-grid" className="nodes-grid" role="region" aria-label="WorkGraph Nodes">
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
              onClick={() => {
                onSelectNode(node);
                setBlastResult(null);
                setBlastError(null);
              }}
              role="button"
              tabIndex={0}
              aria-label={`Node: ${node.name}, entity type: ${node.node_type}`}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectNode(node);
                  setBlastResult(null);
                  setBlastError(null);
                }
              }}
            >
              <span className={`node-tag ${getTagClass(node.node_type)}`}>
                {node.node_type}
              </span>
              <div className="node-name">{node.name}</div>
              <div className="node-desc">{node.description}</div>
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ID: {node.node_id} • Citations: {node.evidence_ids.length}
              </div>
            </div>
          );
        })}
      </div>

      {selectedNode && (
        <div className="drawer-panel" style={{ marginTop: '20px' }} role="region" aria-label="Selected Node Detail">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
              Node Detail:{' '}
              <span style={{ color: 'var(--accent-cyan)' }}>
                {selectedNode.name}
              </span>
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`node-tag ${getTagClass(selectedNode.node_type)}`}>
                {selectedNode.node_type}
              </span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => handleAnalyzeBlastRadius(selectedNode.node_id)}
                disabled={analyzingBlast}
              >
                {analyzingBlast ? 'Tracing...' : '💥 Analyze Blast Radius'}
              </button>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {selectedNode.description}
          </p>

          <div
            className="grid-cards"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                CRITICALITY
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {selectedNode.properties.criticality || 'Standard'}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                TEMPORAL STATUS
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {selectedNode.properties.status || 'Active'}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                EVIDENCE CITATIONS
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                {selectedNode.evidence_ids.join(', ') || 'Direct Ingestion'}
              </div>
            </div>
          </div>

          {/* Blast Radius Results Drawer */}
          {blastError && (
            <div
              role="alert"
              style={{
                marginTop: '12px',
                background: 'rgba(244,63,94,0.1)',
                color: 'var(--accent-rose)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            >
              {blastError}
            </div>
          )}

          {blastResult && (
            <div
              role="region"
              aria-label="Blast Radius Cascade Analysis"
              style={{
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  Downstream Blast Radius Impact Cascade
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(15,23,42,0.8)',
                    color: getRiskColor(blastResult.disruption_risk),
                    border: `1px solid ${getRiskColor(blastResult.disruption_risk)}`,
                  }}
                >
                  DISRUPTION RISK: {blastResult.disruption_risk}
                </span>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                Total Affected Entities: <strong>{blastResult.total_affected_nodes}</strong>
                {blastResult.affected_roles.length > 0 && (
                  <span> • Roles: {blastResult.affected_roles.join(', ')}</span>
                )}
                {blastResult.affected_controls.length > 0 && (
                  <span style={{ color: 'var(--accent-rose)' }}>
                    {' '}
                    • Controls Impacted: {blastResult.affected_controls.join(', ')}
                  </span>
                )}
              </div>

              {blastResult.cascade.length > 0 && (
                <div
                  style={{
                    maxHeight: '130px',
                    overflowY: 'auto',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                  }}
                >
                  {blastResult.cascade.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '3px 0',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                      }}
                    >
                      <span style={{ color: '#a5b4fc', fontWeight: 600 }}>
                        [Depth {item.depth} {item.node_type}]:
                      </span>{' '}
                      {item.name} ({item.node_id})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
