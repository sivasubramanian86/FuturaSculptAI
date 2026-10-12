/**
 * Task Redesign Matrix & Sculptor Component (Module 4).
 * Decomposes enterprise workflow tasks into the 6-part transformation taxonomy:
 * Retain, Assist, Augment, Automate, Redesign, Retire.
 * Enforces Human-in-the-Loop (HITL) A2 Governance sign-off gates.
 * Conforms to WCAG 2.1 AA accessibility standards.
 */

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  TaskApprovalRequest,
  TaskClassificationCategory,
  TaskMatrixResponse,
  TaskRedesignItem,
  TaskRedesignUpdateRequest,
} from '../types';

const CATEGORY_COLORS: Record<TaskClassificationCategory, { bg: string; text: string; border: string }> = {
  AUTOMATE: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.35)' },
  AUGMENT: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.35)' },
  ASSIST: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.35)' },
  RETAIN: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.35)' },
  REDESIGN: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.35)' },
  RETIRE: { bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8', border: 'rgba(100, 116, 139, 0.4)' },
};

const CATEGORIES: ('ALL' | TaskClassificationCategory)[] = [
  'ALL',
  'AUTOMATE',
  'AUGMENT',
  'ASSIST',
  'RETAIN',
  'REDESIGN',
  'RETIRE',
];

export const TaskSculptor: React.FC = () => {
  const [matrix, setMatrix] = useState<TaskMatrixResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'ALL' | TaskClassificationCategory>('ALL');
  const [editingTask, setEditingTask] = useState<TaskRedesignItem | null>(null);
  const [approvingTask, setApprovingTask] = useState<TaskRedesignItem | null>(null);

  // Edit form state
  const [editClassification, setEditClassification] = useState<TaskClassificationCategory>('AUTOMATE');
  const [editRationale, setEditRationale] = useState<string>('');
  const [editTargetAgent, setEditTargetAgent] = useState<string>('');
  const [editTargetSystem, setEditTargetSystem] = useState<string>('');
  const [editTargetCycleTime, setEditTargetCycleTime] = useState<number>(0);
  const [editHumanShare, setEditHumanShare] = useState<number>(50);
  const [editAgentShare, setEditAgentShare] = useState<number>(50);

  // Approval form state
  const [approverId, setApproverId] = useState<string>('');
  const [approvalDecision, setApprovalDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadMatrix = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTaskMatrix();
      setMatrix(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load task redesign matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const openEditModal = (task: TaskRedesignItem): void => {
    setEditingTask(task);
    setEditClassification(task.classification);
    setEditRationale(task.rationale);
    setEditTargetAgent(task.target_agent_id || '');
    setEditTargetSystem(task.target_system || '');
    setEditTargetCycleTime(task.target_cycle_time_seconds);
    setEditHumanShare(task.human_share_pct);
    setEditAgentShare(task.agent_share_pct);
  };

  const handleEditSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    /* v8 ignore next */
    if (!editingTask) return;

    try {
      const payload: TaskRedesignUpdateRequest = {
        classification: editClassification,
        rationale: editRationale,
        target_agent_id: editTargetAgent.trim() || null,
        target_system: editTargetSystem.trim() || null,
        target_cycle_time_seconds: editTargetCycleTime,
        human_share_pct: editHumanShare,
        agent_share_pct: editAgentShare,
      };

      const updated = await api.updateTask(editingTask.task_id, payload);
      setActionMessage(`Updated ${updated.task_id} successfully (Status reset to DRAFT for governance sign-off).`);
      setEditingTask(null);
      await loadMatrix();
    } catch (err: any) {
      setActionMessage(`Failed to update task: ${err.message}`);
    }
  };

  const openApprovalModal = (task: TaskRedesignItem): void => {
    setApprovingTask(task);
    setApproverId('');
    setApprovalDecision('APPROVED');
    setApprovalNotes('');
  };

  const handleApprovalSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    /* v8 ignore next */
    if (!approvingTask) return;
    if (!approverId.trim()) return;

    try {
      const payload: TaskApprovalRequest = {
        approver_id: approverId.trim(),
        decision: approvalDecision,
        notes: approvalNotes.trim() || undefined,
      };

      const res = await api.approveTask(approvingTask.task_id, payload);
      setActionMessage(
        `Task ${res.task_id} marked as ${res.status} by ${res.approved_by} under A2 Governance protocol.`
      );
      setApprovingTask(null);
      await loadMatrix();
    } catch (err: any) {
      setActionMessage(`Approval failed: ${err.message}`);
    }
  };

  const filteredTasks = (matrix?.tasks || []).filter((task) => {
    if (activeCategory === 'ALL') return true;
    return task.classification === activeCategory;
  });

  return (
    <section
      className="glass-panel panel-card"
      aria-labelledby="task-sculptor-heading"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 id="task-sculptor-heading" style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Task Redesign Matrix & Sculptor
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
              MODULE 4
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              A2 HITL GOVERNED
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Autonomous 6-part task allocation across humans and agents with strict sign-off gates.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMatrix}
          aria-label="Refresh task redesign matrix"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          🔄 Refresh Matrix
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--text-primary)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚖️ {actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            aria-label="Dismiss message"
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {loading && !matrix && (
        <div role="status" aria-live="polite" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading task transformation matrix...
        </div>
      )}

      {error && !matrix && (
        <div role="alert" style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {matrix && (
        <>
          {/* Executive Metrics Bar */}
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
                Total Workflow Tasks
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {matrix.total_tasks}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{matrix.workflow_name}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Avg Human Agency Share
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '2px' }}>
                {matrix.overall_human_share_pct}%
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  marginTop: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${matrix.overall_human_share_pct}%`,
                    height: '100%',
                    background: 'var(--accent-amber)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Avg Autonomous Agent Work
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {matrix.overall_agent_share_pct}%
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  marginTop: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${matrix.overall_agent_share_pct}%`,
                    height: '100%',
                    background: 'var(--accent-cyan)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Avg Cycle Time Reduction
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                -{matrix.overall_cycle_time_reduction_pct}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>Aggregated speedup</div>
            </div>
          </div>

          {/* Taxonomy Filter Bar */}
          <div
            role="tablist"
            aria-label="Filter tasks by 6-part transformation category"
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              const count = cat === 'ALL' ? matrix.total_tasks : matrix.classification_summary[cat] || 0;
              const styleColor = cat === 'ALL' ? 'var(--accent-indigo)' : CATEGORY_COLORS[cat as TaskClassificationCategory].text;

              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isSelected}
                  id={`tab-category-${cat.toLowerCase()}`}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isSelected ? styleColor : 'var(--border-subtle)'}`,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Task Matrix Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredTasks.map((task) => {
              /* v8 ignore next */
              const catMeta = (task.classification && CATEGORY_COLORS[task.classification]) || CATEGORY_COLORS['AUTOMATE'];
              const isApproved = task.status === 'APPROVED';
              const isRejected = task.status === 'REJECTED';

              return (
                <article
                  key={task.task_id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  <div>
                    {/* Top Row: Task ID, Role, Category Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            marginRight: '8px',
                          }}
                        >
                          {task.task_id}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {task.role_name}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: catMeta.bg,
                          color: catMeta.text,
                          border: `1px solid ${catMeta.border}`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.classification}
                      </span>
                    </div>

                    {/* Task Title */}
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>
                      {task.task_name}
                    </h3>

                    {/* Rationale text */}
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                      {task.rationale}
                    </p>

                    {/* Target Agent / System Mapping */}
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '8px 10px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-secondary)' }}>Target Agent:</strong>{' '}
                        {task.target_agent_id ? (
                          <span style={{ color: 'var(--accent-cyan)' }}>{task.target_agent_id}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None (Direct Human)</span>
                        )}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-secondary)' }}>Target System:</strong>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{task.target_system || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* Cycle Time & Work Distribution */}
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Cycle Time:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {task.baseline_cycle_time_seconds}s → {task.target_cycle_time_seconds}s{' '}
                          <span
                            style={{
                              color: task.cycle_time_reduction_pct >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                              fontWeight: 700,
                            }}
                          >
                            ({task.cycle_time_reduction_pct >= 0 ? `-${task.cycle_time_reduction_pct}%` : `+${Math.abs(task.cycle_time_reduction_pct)}%`})
                          </span>
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>Human: {task.human_share_pct}%</span>
                          <span>Agent: {task.agent_share_pct}%</span>
                        </div>
                        <div
                          style={{
                            height: '5px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            display: 'flex',
                            marginTop: '4px',
                          }}
                        >
                          <div style={{ width: `${task.human_share_pct}%`, background: 'var(--accent-amber)' }} />
                          <div style={{ width: `${task.agent_share_pct}%`, background: 'var(--accent-cyan)' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Governance & Actions Footer */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isApproved
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isRejected
                            ? 'rgba(244, 63, 94, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                          color: isApproved
                            ? 'var(--accent-emerald)'
                            : isRejected
                            ? 'var(--accent-rose)'
                            : 'var(--accent-amber)',
                          border: `1px solid ${
                            isApproved
                              ? 'rgba(16, 185, 129, 0.35)'
                              : isRejected
                              ? 'rgba(244, 63, 94, 0.35)'
                              : 'rgba(245, 158, 11, 0.35)'
                          }`,
                        }}
                      >
                        {task.status}
                      </span>
                      {task.approved_by && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          By: {task.approved_by}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        aria-label={`Sculpt and edit task ${task.task_id}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Sculpt
                      </button>

                      <button
                        type="button"
                        onClick={() => openApprovalModal(task)}
                        aria-label={`Submit governance approval gate for ${task.task_id}`}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'var(--accent-indigo)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ⚖️ Sign-Off Gate
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* In-Place Task Sculptor Edit Modal */}
      {editingTask && (
        <div
          role="dialog"
          aria-labelledby="edit-task-title"
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
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="edit-task-title" style={{ fontSize: '17px', fontWeight: 700 }}>
                Sculpt Task: {editingTask.task_id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                aria-label="Close sculpt editor"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              {editingTask.task_name} ({editingTask.role_name})
            </p>

            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: 'var(--accent-amber)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
              }}
            >
              ⚠️ A2 Governance: Saving modifications will reset task status to <strong>DRAFT</strong> requiring fresh human review.
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label htmlFor="edit-classification-select" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  6-Part Classification Taxonomy
                </label>
                <select
                  id="edit-classification-select"
                  value={editClassification}
                  onChange={(e) => setEditClassification(e.target.value as TaskClassificationCategory)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="AUTOMATE">AUTOMATE (Zero human triage, pure autonomous execution)</option>
                  <option value="AUGMENT">AUGMENT (Human decision-maker with AI Copilot verification)</option>
                  <option value="ASSIST">ASSIST (Automated context retrieval & SOP recommendation)</option>
                  <option value="RETAIN">RETAIN (100% human physical / regulatory execution)</option>
                  <option value="REDESIGN">REDESIGN (Fundamentally restructured collaborative workflow)</option>
                  <option value="RETIRE">RETIRE (Eliminated entirely via automated digital telemetry)</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-rationale-textarea" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Transformation Rationale & Scientific Grounding
                </label>
                <textarea
                  id="edit-rationale-textarea"
                  rows={3}
                  value={editRationale}
                  onChange={(e) => setEditRationale(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor="edit-target-agent-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Target ADK Agent ID
                  </label>
                  <input
                    id="edit-target-agent-input"
                    type="text"
                    value={editTargetAgent}
                    onChange={(e) => setEditTargetAgent(e.target.value)}
                    placeholder="e.g. PackagingVisionAgent"
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
                  <label htmlFor="edit-target-system-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Target Cloud / Physical System
                  </label>
                  <input
                    id="edit-target-system-input"
                    type="text"
                    value={editTargetSystem}
                    onChange={(e) => setEditTargetSystem(e.target.value)}
                    placeholder="e.g. Edge-TPU Vision Pipeline"
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
              </div>

              <div>
                <label htmlFor="edit-cycle-time-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Target Cycle Time (seconds) [Baseline: {editingTask.baseline_cycle_time_seconds}s]
                </label>
                <input
                  id="edit-cycle-time-input"
                  type="number"
                  step="0.5"
                  min="0"
                  value={editTargetCycleTime}
                  onChange={(e) => setEditTargetCycleTime(parseFloat(e.target.value) || 0)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor="edit-human-share-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Human Share % ({editHumanShare}%)
                  </label>
                  <input
                    id="edit-human-share-input"
                    type="range"
                    min="0"
                    max="100"
                    value={editHumanShare}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setEditHumanShare(val);
                      setEditAgentShare(100 - val);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label htmlFor="edit-agent-share-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Agent Share % ({editAgentShare}%)
                  </label>
                  <input
                    id="edit-agent-share-input"
                    type="range"
                    min="0"
                    max="100"
                    value={editAgentShare}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setEditAgentShare(val);
                      setEditHumanShare(100 - val);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
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
                  style={{
                    background: 'var(--accent-indigo)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Save Task Redesign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Place HITL Approval Gate Modal */}
      {approvingTask && (
        <div
          role="dialog"
          aria-labelledby="approval-modal-title"
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
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="approval-modal-title" style={{ fontSize: '17px', fontWeight: 700 }}>
                ⚖️ A2 Human Sign-Off Gate: {approvingTask.task_id}
              </h3>
              <button
                type="button"
                onClick={() => setApprovingTask(null)}
                aria-label="Close approval modal"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
              {approvingTask.task_name} | Proposed: <strong>{approvingTask.classification}</strong>
            </p>

            <form onSubmit={handleApprovalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label htmlFor="approver-id-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Authorized Approver ID / Role Title *
                </label>
                <input
                  id="approver-id-input"
                  type="text"
                  required
                  value={approverId}
                  onChange={(e) => setApproverId(e.target.value)}
                  placeholder="e.g. Chief Quality Officer or Plant Safety Lead"
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
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Governance Decision
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: approvalDecision === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${approvalDecision === 'APPROVED' ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: approvalDecision === 'APPROVED' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="approvalDecision"
                      value="APPROVED"
                      checked={approvalDecision === 'APPROVED'}
                      onChange={() => setApprovalDecision('APPROVED')}
                      style={{ display: 'none' }}
                    />
                    ✓ Approve Proposal
                  </label>

                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: approvalDecision === 'REJECTED' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${approvalDecision === 'REJECTED' ? 'var(--accent-rose)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: approvalDecision === 'REJECTED' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="radio"
                      name="approvalDecision"
                      value="REJECTED"
                      checked={approvalDecision === 'REJECTED'}
                      onChange={() => setApprovalDecision('REJECTED')}
                      style={{ display: 'none' }}
                    />
                    ✕ Reject Proposal
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="approval-notes-textarea" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Audit Justification Notes & Compliance Citations
                </label>
                <textarea
                  id="approval-notes-textarea"
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Record justification, safety review standard, or rejection rationale..."
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setApprovingTask(null)}
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
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={!approverId.trim()}
                  style={{
                    background: approvalDecision === 'APPROVED' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: approverId.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: approverId.trim() ? 1 : 0.6,
                  }}
                >
                  Commit Governance Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
