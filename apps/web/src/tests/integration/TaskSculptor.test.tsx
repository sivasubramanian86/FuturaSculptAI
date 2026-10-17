/**
 * Unit tests for TaskSculptor component (Module 4).
 * Validates 6-part task classification, category filtering,
 * in-place task sculpting, and A2 Human-in-the-Loop approval gate.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskSculptor, resetTaskSculptorCache } from '../../components/TaskSculptor';
import { api } from '../../services/api';
import { TaskMatrixResponse, TaskRedesignItem } from '../../types';

const mockTasks: TaskRedesignItem[] = [
  {
    task_id: 'TSK-001',
    tenant_id: 'tenant-food-mfg-01',
    workflow_id: 'WKF-001',
    task_name: 'Continuous Surface Defect Screening',
    role_id: 'ROL-001',
    role_name: 'Packaging Quality Inspector',
    classification: 'AUTOMATE',
    rationale: 'Repetitive high-frequency visual inspection.',
    target_agent_id: 'PackagingVisionAgent',
    target_system: 'Edge-TPU Vision Pipeline',
    baseline_cycle_time_seconds: 45.0,
    target_cycle_time_seconds: 3.0,
    cycle_time_reduction_pct: 93.3,
    human_share_pct: 0.0,
    agent_share_pct: 100.0,
    status: 'DRAFT',
    approved_by: null,
    approval_timestamp: null,
    approval_notes: null,
    evidence_ids: ['EVD-001'],
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
  {
    task_id: 'TSK-002',
    tenant_id: 'tenant-food-mfg-01',
    workflow_id: 'WKF-001',
    task_name: 'Anomalous Seal Defect Adjudication',
    role_id: 'ROL-001',
    role_name: 'Packaging Quality Inspector',
    classification: 'AUGMENT',
    rationale: 'Critical regulatory sign-off with AI assistance.',
    target_agent_id: 'PackagingVisionAgent',
    target_system: 'Human-Agent Cockpit',
    baseline_cycle_time_seconds: 120.0,
    target_cycle_time_seconds: 30.0,
    cycle_time_reduction_pct: 75.0,
    human_share_pct: 60.0,
    agent_share_pct: 40.0,
    status: 'DRAFT',
    approved_by: null,
    approval_timestamp: null,
    approval_notes: null,
    evidence_ids: ['EVD-001'],
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
  {
    task_id: 'TSK-003',
    tenant_id: 'tenant-food-mfg-01',
    workflow_id: 'WKF-001',
    task_name: 'Sensor Calibration & Optical Alignment',
    role_id: 'ROL-001',
    role_name: 'Packaging Quality Inspector',
    classification: 'RETAIN',
    rationale: 'Physical precision alignment retained by technician.',
    target_agent_id: null,
    target_system: null,
    baseline_cycle_time_seconds: 300.0,
    target_cycle_time_seconds: 300.0,
    cycle_time_reduction_pct: 0.0,
    human_share_pct: 100.0,
    agent_share_pct: 0.0,
    status: 'APPROVED',
    approved_by: 'Lead Technician',
    approval_timestamp: '2026-10-11T01:00:00Z',
    approval_notes: 'Safety verified.',
    evidence_ids: ['EVD-002'],
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
  {
    task_id: 'TSK-004',
    tenant_id: 'tenant-food-mfg-01',
    workflow_id: 'WKF-001',
    task_name: 'SOP & Compliance Lookups',
    role_id: 'ROL-001',
    role_name: 'Packaging Quality Inspector',
    classification: 'ASSIST',
    rationale: 'Contextual RAG procedure retrieval.',
    target_agent_id: 'Vertex AI Search Copilot',
    target_system: 'Vertex AI Search Engine',
    baseline_cycle_time_seconds: 180.0,
    target_cycle_time_seconds: 20.0,
    cycle_time_reduction_pct: 88.9,
    human_share_pct: 30.0,
    agent_share_pct: 70.0,
    status: 'DRAFT',
    approved_by: null,
    approval_timestamp: null,
    approval_notes: null,
    evidence_ids: ['EVD-003'],
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
  {
    task_id: 'TSK-005',
    tenant_id: 'tenant-food-mfg-01',
    workflow_id: 'WKF-001',
    task_name: 'End-of-Shift Paperwork',
    role_id: 'ROL-001',
    role_name: 'Packaging Quality Inspector',
    classification: 'RETIRE',
    rationale: 'Retired in favor of BigQuery telemetry.',
    target_agent_id: 'BigQuery Telemetry Pipeline',
    target_system: 'Google Cloud BigQuery',
    baseline_cycle_time_seconds: 900.0,
    target_cycle_time_seconds: 0.0,
    cycle_time_reduction_pct: 100.0,
    human_share_pct: 0.0,
    agent_share_pct: 100.0,
    status: 'DRAFT',
    approved_by: null,
    approval_timestamp: null,
    approval_notes: null,
    evidence_ids: ['EVD-004'],
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
  {
    task_id: 'TSK-006',
    tenant_id: 'tenant-food-mfg-01',
    workflow_id: 'WKF-001',
    task_name: 'Packaging Anomaly Root-Cause Review',
    role_id: 'ROL-001',
    role_name: 'Packaging Quality Inspector',
    classification: 'REDESIGN',
    rationale: 'Collaborative swarm incident debrief.',
    target_agent_id: 'FuturaSculpt Swarm Coordinator',
    target_system: 'ADK Swarm Deliberation Engine',
    baseline_cycle_time_seconds: 3600.0,
    target_cycle_time_seconds: 600.0,
    cycle_time_reduction_pct: -20.0,
    human_share_pct: 50.0,
    agent_share_pct: 50.0,
    status: 'REJECTED',
    approved_by: 'Safety Auditor',
    approval_timestamp: '2026-10-11T02:00:00Z',
    approval_notes: 'Denied.',
    evidence_ids: ['EVD-001'],
    created_at: '2026-10-11T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
];

const mockMatrixResponse: TaskMatrixResponse = {
  tenant_id: 'tenant-food-mfg-01',
  workflow_id: 'WKF-001',
  workflow_name: 'High-Speed Packaging Line Quality Inspection',
  total_tasks: 6,
  classification_summary: {
    AUTOMATE: 1,
    AUGMENT: 1,
    ASSIST: 1,
    RETAIN: 1,
    REDESIGN: 1,
    RETIRE: 1,
  },
  overall_human_share_pct: 40.0,
  overall_agent_share_pct: 60.0,
  overall_cycle_time_reduction_pct: 73.4,
  tasks: mockTasks,
};

describe('TaskSculptor Component', () => {
  beforeEach(() => {
    resetTaskSculptorCache();
    vi.spyOn(api, 'getTaskMatrix').mockResolvedValue(mockMatrixResponse);
  });

  afterEach(() => {
    resetTaskSculptorCache();
    vi.restoreAllMocks();
  });

  it('renders loading state initially and then displays the complete matrix', async () => {
    render(<TaskSculptor />);
    expect(screen.getByText(/loading task transformation matrix/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Task Redesign Matrix & Sculptor')).toBeInTheDocument();
    });

    expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    expect(screen.getByText('Anomalous Seal Defect Adjudication')).toBeInTheDocument();
    expect(screen.getByText('Sensor Calibration & Optical Alignment')).toBeInTheDocument();
    expect(screen.getByText('SOP & Compliance Lookups')).toBeInTheDocument();
    expect(screen.getByText('End-of-Shift Paperwork')).toBeInTheDocument();
    expect(screen.getByText('Packaging Anomaly Root-Cause Review')).toBeInTheDocument();

    // Check executive metrics
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('-73.4%')).toBeInTheDocument();
  });

  it('filters task cards by 6-part transformation taxonomy', async () => {
    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    // Click on RETAIN filter
    const retainTab = screen.getByRole('tab', { name: /RETAIN/i });
    fireEvent.click(retainTab);

    // Only TSK-003 should be visible
    expect(screen.getByText('Sensor Calibration & Optical Alignment')).toBeInTheDocument();
    expect(screen.queryByText('Continuous Surface Defect Screening')).not.toBeInTheDocument();

    // Click on ALL tab
    const allTab = screen.getByRole('tab', { name: /ALL/i });
    fireEvent.click(allTab);

    expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
  });

  it('handles API error when loading matrix fails', async () => {
    vi.spyOn(api, 'getTaskMatrix').mockRejectedValueOnce(new Error('Network error loading matrix'));

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error loading matrix');
    });
  });

  it('handles matrix refresh button', async () => {
    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Task Redesign Matrix & Sculptor')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /refresh task redesign matrix/i });
    fireEvent.click(refreshBtn);

    expect(api.getTaskMatrix).toHaveBeenCalledTimes(2);
  });

  it('opens sculpt editor, updates task fields, and saves redesign successfully', async () => {
    const updatedTask = {
      ...mockTasks[0],
      classification: 'REDESIGN' as const,
      status: 'DRAFT' as const,
    };
    vi.spyOn(api, 'updateTask').mockResolvedValueOnce(updatedTask);

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const sculptBtn = screen.getByRole('button', { name: /sculpt and edit task tsk-001/i });
    fireEvent.click(sculptBtn);

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sculpt Task: TSK-001')).toBeInTheDocument();

    // Modify fields
    const classSelect = screen.getByLabelText(/6-Part Classification Taxonomy/i);
    fireEvent.change(classSelect, { target: { value: 'REDESIGN' } });

    const rationaleInput = screen.getByLabelText(/Transformation Rationale/i);
    fireEvent.change(rationaleInput, { target: { value: 'Updated rationale for multi-modal' } });

    const agentInput = screen.getByLabelText(/Target ADK Agent ID/i);
    fireEvent.change(agentInput, { target: { value: 'PackagingVisionAgentV2' } });

    const systemInput = screen.getByLabelText(/Target Cloud \/ Physical System/i);
    fireEvent.change(systemInput, { target: { value: 'Edge Pipeline V2' } });

    const timeInput = screen.getByLabelText(/Target Cycle Time/i);
    fireEvent.change(timeInput, { target: { value: '5.5' } });

    const humanSlider = screen.getByLabelText(/Human Share %/i);
    fireEvent.change(humanSlider, { target: { value: '30' } });

    const agentSlider = screen.getByLabelText(/Agent Share %/i);
    fireEvent.change(agentSlider, { target: { value: '70' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /Save Task Redesign/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateTask).toHaveBeenCalledWith('TSK-001', {
        classification: 'REDESIGN',
        rationale: 'Updated rationale for multi-modal',
        target_agent_id: 'PackagingVisionAgentV2',
        target_system: 'Edge Pipeline V2',
        target_cycle_time_seconds: 5.5,
        human_share_pct: 30,
        agent_share_pct: 70,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Updated TSK-001 successfully/i)).toBeInTheDocument();
    });
  });

  it('cancels edit modal without submitting', async () => {
    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const sculptBtn = screen.getByRole('button', { name: /sculpt and edit task tsk-001/i });
    fireEvent.click(sculptBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles edit failure gracefully and displays error alert', async () => {
    vi.spyOn(api, 'updateTask').mockRejectedValueOnce(new Error('Update failed on server'));

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const sculptBtn = screen.getByRole('button', { name: /sculpt and edit task tsk-001/i });
    fireEvent.click(sculptBtn);

    const saveBtn = screen.getByRole('button', { name: /Save Task Redesign/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update task: Update failed on server/i)).toBeInTheDocument();
    });
  });

  it('submits human approval decision in A2 Sign-Off Gate successfully', async () => {
    vi.spyOn(api, 'approveTask').mockResolvedValueOnce({
      task_id: 'TSK-001',
      status: 'APPROVED',
      approved_by: 'Chief Quality Officer',
      approval_timestamp: '2026-10-11T12:00:00Z',
      approval_notes: 'Full verification completed',
      task: { ...mockTasks[0], status: 'APPROVED' },
    });

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const gateBtn = screen.getByRole('button', { name: /submit governance approval gate for tsk-001/i });
    fireEvent.click(gateBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/A2 Human Sign-Off Gate: TSK-001/i)).toBeInTheDocument();

    const approverInput = screen.getByLabelText(/Authorized Approver ID/i);
    fireEvent.change(approverInput, { target: { value: 'Chief Quality Officer' } });

    const notesInput = screen.getByLabelText(/Audit Justification Notes/i);
    fireEvent.change(notesInput, { target: { value: 'Full verification completed' } });

    const submitBtn = screen.getByRole('button', { name: /Commit Governance Decision/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.approveTask).toHaveBeenCalledWith('TSK-001', {
        approver_id: 'Chief Quality Officer',
        decision: 'APPROVED',
        notes: 'Full verification completed',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Task TSK-001 marked as APPROVED by Chief Quality Officer/i)).toBeInTheDocument();
    });
  });

  it('submits rejection decision in A2 Sign-Off Gate', async () => {
    vi.spyOn(api, 'approveTask').mockResolvedValueOnce({
      task_id: 'TSK-001',
      status: 'REJECTED',
      approved_by: 'Safety Inspector',
      approval_timestamp: '2026-10-11T12:00:00Z',
      task: { ...mockTasks[0], status: 'REJECTED' },
    });

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const gateBtn = screen.getByRole('button', { name: /submit governance approval gate for tsk-001/i });
    fireEvent.click(gateBtn);

    const rejectRadio = screen.getByLabelText(/Reject Proposal/i);
    fireEvent.click(rejectRadio);

    const approverInput = screen.getByLabelText(/Authorized Approver ID/i);
    fireEvent.change(approverInput, { target: { value: 'Safety Inspector' } });

    const submitBtn = screen.getByRole('button', { name: /Commit Governance Decision/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.approveTask).toHaveBeenCalledWith('TSK-001', {
        approver_id: 'Safety Inspector',
        decision: 'REJECTED',
        notes: undefined,
      });
    });
  });

  it('dismisses sign-off gate modal and action notification message', async () => {
    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const gateBtn = screen.getByRole('button', { name: /submit governance approval gate for tsk-001/i });
    fireEvent.click(gateBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses notification alert when close button is clicked', async () => {
    vi.spyOn(api, 'updateTask').mockResolvedValueOnce({
      ...mockTasks[0],
      status: 'DRAFT',
    });

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const sculptBtn = screen.getByRole('button', { name: /sculpt and edit task tsk-001/i });
    fireEvent.click(sculptBtn);

    const saveBtn = screen.getByRole('button', { name: /Save Task Redesign/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Updated TSK-001 successfully/i)).toBeInTheDocument();
    });

    const dismissAlertBtn = screen.getByRole('button', { name: /Dismiss message/i });
    fireEvent.click(dismissAlertBtn);

    expect(screen.queryByText(/Updated TSK-001 successfully/i)).not.toBeInTheDocument();
  });

  it('handles approval failure and displays error', async () => {
    vi.spyOn(api, 'approveTask').mockRejectedValueOnce(new Error('Sign-off rejected by policy'));

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const gateBtn = screen.getByRole('button', { name: /submit governance approval gate for tsk-001/i });
    fireEvent.click(gateBtn);

    const approverInput = screen.getByLabelText(/Authorized Approver ID/i);
    fireEvent.change(approverInput, { target: { value: 'Safety Inspector' } });

    const submitBtn = screen.getByRole('button', { name: /Commit Governance Decision/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Approval failed: Sign-off rejected by policy/i)).toBeInTheDocument();
    });
  });

  it('closes sculpt modal and approval modal via top-right close buttons', async () => {
    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    // Open and close sculpt modal
    const sculptBtn = screen.getByRole('button', { name: /sculpt and edit task tsk-001/i });
    fireEvent.click(sculptBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeSculptBtn = screen.getByRole('button', { name: /close sculpt editor/i });
    fireEvent.click(closeSculptBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Open and close approval modal
    const gateBtn = screen.getByRole('button', { name: /submit governance approval gate for tsk-001/i });
    fireEvent.click(gateBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeApprovalBtn = screen.getByRole('button', { name: /close approval modal/i });
    fireEvent.click(closeApprovalBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('updates agent share slider, clears agent/system strings, and sets cycle time to empty', async () => {
    vi.spyOn(api, 'updateTask').mockResolvedValueOnce({
      ...mockTasks[0],
      target_agent_id: null,
      target_system: null,
      target_cycle_time_seconds: 0,
      human_share_pct: 10,
      agent_share_pct: 90,
    });

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    const sculptBtn = screen.getByRole('button', { name: /sculpt and edit task tsk-001/i });
    fireEvent.click(sculptBtn);

    // Agent share input
    const agentSlider = document.getElementById('edit-agent-share-input') as HTMLInputElement;
    fireEvent.change(agentSlider, { target: { value: '90' } });

    // Empty agent and system
    const agentInput = screen.getByLabelText(/Target ADK Agent ID/i);
    fireEvent.change(agentInput, { target: { value: '   ' } });

    const systemInput = screen.getByLabelText(/Target Cloud \/ Physical System/i);
    fireEvent.change(systemInput, { target: { value: '   ' } });

    // Empty cycle time
    const timeInput = screen.getByLabelText(/Target Cycle Time/i);
    fireEvent.change(timeInput, { target: { value: '' } });

    const saveBtn = screen.getByRole('button', { name: /Save Task Redesign/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateTask).toHaveBeenCalledWith('TSK-001', {
        classification: 'AUTOMATE',
        rationale: 'Repetitive high-frequency visual inspection.',
        target_agent_id: null,
        target_system: null,
        target_cycle_time_seconds: 0,
        human_share_pct: 10,
        agent_share_pct: 90,
      });
    });
  });

  it('handles load error without message property', async () => {
    vi.spyOn(api, 'getTaskMatrix').mockRejectedValueOnce({});

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load task redesign matrix');
    });
  });

  it('handles update and approval errors without message property', async () => {
    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Continuous Surface Defect Screening')).toBeInTheDocument();
    });

    // Update error without message
    vi.spyOn(api, 'updateTask').mockRejectedValueOnce({});
    const sculptBtn = screen.getByRole('button', { name: /sculpt and edit task tsk-001/i });
    fireEvent.click(sculptBtn);
    const saveBtn = screen.getByRole('button', { name: /Save Task Redesign/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update task: undefined/i)).toBeInTheDocument();
    });

    // Approval error without message
    vi.spyOn(api, 'approveTask').mockRejectedValueOnce({});
    const gateBtn = screen.getByRole('button', { name: /submit governance approval gate for tsk-001/i });
    fireEvent.click(gateBtn);
    const approverInput = screen.getByLabelText(/Authorized Approver ID/i);
    fireEvent.change(approverInput, { target: { value: 'Lead' } });
    const submitApprovalBtn = screen.getByRole('button', { name: /Commit Governance Decision/i });
    fireEvent.click(submitApprovalBtn);

    await waitFor(() => {
      expect(screen.getByText(/Approval failed: undefined/i)).toBeInTheDocument();
    });
  });

  it('exercises editing task with null agent/system, human slider change, approval radio toggle, and empty approver submit', async () => {
    const approveSpy = vi.spyOn(api, 'approveTask');

    render(<TaskSculptor />);

    await waitFor(() => {
      expect(screen.getByText('Sensor Calibration & Optical Alignment')).toBeInTheDocument();
    });

    // 1. Open sculpt modal for TSK-003 (which has null target_agent_id and target_system)
    const sculptBtn = screen.getByRole('button', { name: /sculpt and edit task tsk-003/i });
    fireEvent.click(sculptBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sculpt Task: TSK-003')).toBeInTheDocument();

    // Change human share slider
    const humanSlider = document.getElementById('edit-human-share-input') as HTMLInputElement;
    fireEvent.change(humanSlider, { target: { value: '45' } });

    // Close sculpt modal
    const closeBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(closeBtn);

    // 2. Open approval modal
    const gateBtn = screen.getByRole('button', { name: /submit governance approval gate for tsk-003/i });
    fireEvent.click(gateBtn);

    // Submit form while approverId is empty (triggers early return in handleApprovalSubmit)
    const approverInput = screen.getByLabelText(/Authorized Approver ID/i);
    expect(approverInput).toHaveValue('');
    const form = approverInput.closest('form')!;
    fireEvent.submit(form);
    expect(approveSpy).not.toHaveBeenCalled();

    // Toggle radio to REJECTED then back to APPROVED (triggers line 968 onChange)
    const rejectRadio = screen.getByLabelText(/Reject Proposal/i);
    fireEvent.click(rejectRadio);
    const approveRadio = screen.getByLabelText(/Approve Proposal/i);
    fireEvent.click(approveRadio);

    const dismissBtn = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissBtn);
  });
});

