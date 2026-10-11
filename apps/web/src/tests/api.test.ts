import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClient } from '../services/api';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('manages tenant id correctly', () => {
    expect(client.getTenantId()).toBe('tenant-food-mfg-01');
    client.setTenantId('tenant-custom-99');
    expect(client.getTenantId()).toBe('tenant-custom-99');
  });

  it('fetches WorkGraph successfully', async () => {
    const mockData = { graph_id: 'WG-001', nodes: [], edges: [] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const res = await client.getWorkGraph();
    expect(res).toEqual(mockData);
  });

  it('throws error when WorkGraph fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(client.getWorkGraph()).rejects.toThrow('Failed to load WorkGraph: Internal Server Error');
  });

  it('fetches scenarios with default sector', async () => {
    const mockData = { sector: 'food_manufacturing', scenarios: [] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const res = await client.getScenarios();
    expect(res).toEqual(mockData);
  });

  it('fetches scenarios with custom sector and throws on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getScenarios('banking')).rejects.toThrow('Failed to load scenarios: Not Found');
  });

  it('fetches evidence ledger successfully and handles errors', async () => {
    const mockData = [{ evidence_id: 'EV-001' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const res = await client.getEvidenceLedger();
    expect(res).toEqual(mockData);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
    } as Response);

    await expect(client.getEvidenceLedger()).rejects.toThrow('Failed to load evidence ledger: Forbidden');
  });

  it('evaluates role resilience with default and custom role', async () => {
    const mockData = { role_id: 'ROL-001', score: 85 };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const res = await client.getRoleResilience();
    expect(res).toEqual(mockData);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response);

    await expect(client.getRoleResilience('ROL-999')).rejects.toThrow('Failed to evaluate role resilience: Bad Request');
  });

  it('evaluates trustboard posture and handles errors', async () => {
    const mockData = { trust_score: 92, gate_status: 'PASSED' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const res = await client.getTrustBoard();
    expect(res).toEqual(mockData);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    } as Response);

    await expect(client.getTrustBoard()).rejects.toThrow('Failed to evaluate trustboard posture: Service Unavailable');
  });

  it('submits onboarding successfully and handles failures', async () => {
    const payload = {
      organization_name: 'Apex Foods',
      sector: 'food_manufacturing',
      headcount: 500,
      primary_strategic_goal: 'Safety',
      contact_email: 'test@apex.com',
      consent_granted: true,
    };
    const mockData = { tenant_id: 'tenant-test' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const res = await client.onboard(payload);
    expect(res).toEqual(mockData);

    // Error with JSON detail
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({ detail: 'Custom error detail' }),
    } as Response);

    await expect(client.onboard(payload)).rejects.toThrow('Custom error detail');

    // Error with empty JSON detail (fallback to default string)
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: async () => ({}),
    } as Response);

    await expect(client.onboard(payload)).rejects.toThrow('Onboarding failed');

    // Error without JSON detail (json fails)
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Gateway Timeout',
      json: async () => {
        throw new Error('Not JSON');
      },
    } as unknown as Response);

    await expect(client.onboard(payload)).rejects.toThrow('Gateway Timeout');
  });

  it('uploads evidence successfully and handles failures', async () => {
    const mockFile = new File(['test content'], 'sop.pdf', { type: 'application/pdf' });
    const mockResponse = { evidence_id: 'EV-100', sha256_hash: 'abc' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const res = await client.uploadEvidence(mockFile);
    expect(res).toEqual(mockResponse);

    // Error with JSON detail
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Payload Too Large',
      json: async () => ({ detail: 'File exceeds 50MB' }),
    } as Response);

    await expect(client.uploadEvidence(mockFile, 'Custom Author')).rejects.toThrow('File exceeds 50MB');

    // Error with empty JSON detail (fallback to default string)
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Payload Too Large',
      json: async () => ({}),
    } as Response);

    await expect(client.uploadEvidence(mockFile, 'Custom Author')).rejects.toThrow('Upload failed');

    // Error without JSON detail
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Error',
      json: async () => {
        throw new Error('Parse error');
      },
    } as unknown as Response);

    await expect(client.uploadEvidence(mockFile)).rejects.toThrow('Internal Error');
  });

  it('fetches evidence detail and handles failure', async () => {
    const mockDetail = { evidence_id: 'EV-001', sha256_hash: '123' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    const res = await client.getEvidenceDetail('EV-001');
    expect(res).toEqual(mockDetail);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getEvidenceDetail('EV-NONEXISTENT')).rejects.toThrow(
      'Failed to load evidence detail: Not Found'
    );
  });

  it('verifies evidence integrity and handles failure', async () => {
    const mockIntegrity = {
      evidence_id: 'EV-001',
      is_valid: true,
      computed_sha256: 'abc',
      stored_sha256: 'abc',
      checked_at: '2026-10-10T00:00:00Z',
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockIntegrity,
    } as Response);

    const res = await client.verifyIntegrity('EV-001');
    expect(res).toEqual(mockIntegrity);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    } as Response);

    await expect(client.verifyIntegrity('EV-001')).rejects.toThrow(
      'Failed to verify evidence integrity: Server Error'
    );
  });

  it('verifies claim entailment and handles failure', async () => {
    const mockClaimResult = {
      claim_text: 'SOP requires valve inspection',
      verdict: 'supported',
      confidence: 0.95,
      cited_evidence_ids: ['EV-001'],
      cited_segments: [],
      explanation: 'Cited in SOP-401.',
    };

    // Test with default empty evidence_ids
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockClaimResult,
    } as Response);

    const resDefault = await client.verifyClaim('SOP requires valve inspection');
    expect(resDefault).toEqual(mockClaimResult);

    // Test with specified evidence_ids
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockClaimResult,
    } as Response);

    const resWithIds = await client.verifyClaim('SOP requires valve inspection', ['EV-001']);
    expect(resWithIds).toEqual(mockClaimResult);

    // Test failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Unprocessable Entity',
    } as Response);

    await expect(client.verifyClaim('Bad claim')).rejects.toThrow(
      'Failed to verify claim entailment: Unprocessable Entity'
    );
  });

  it('fetches temporal WorkGraph and handles failure', async () => {
    const mockTemporal = {
      horizon_year: 0,
      graph: { graph_id: 'WG-001', nodes: [], edges: [] },
      summary: { horizon_year: 0, human_task_allocation_pct: 100, agent_task_allocation_pct: 0, active_roles_count: 5, active_agents_count: 0 },
    };

    // Default horizon 0
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemporal,
    } as Response);

    const resDefault = await client.getTemporalWorkGraph();
    expect(resDefault).toEqual(mockTemporal);

    // Custom horizon 3
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockTemporal,
    } as Response);

    const resCustom = await client.getTemporalWorkGraph(3);
    expect(resCustom).toEqual(mockTemporal);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response);

    await expect(client.getTemporalWorkGraph(9)).rejects.toThrow(
      'Failed to load temporal WorkGraph: Bad Request'
    );
  });

  it('calculates blast radius and handles failure', async () => {
    const mockBlast = {
      root_node_id: 'CAP-001',
      max_depth: 3,
      overall_risk_rating: 'HIGH',
      impacted_nodes_count: 4,
      impacted_nodes: [],
      affected_entity_types: ['role', 'task'],
      citations: ['EVD-001'],
    };

    // Default depth 3
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockBlast,
    } as Response);

    const resDefault = await client.getBlastRadius('CAP-001');
    expect(resDefault).toEqual(mockBlast);

    // Custom depth 1
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockBlast,
    } as Response);

    const resCustom = await client.getBlastRadius('CAP-001', 1);
    expect(resCustom).toEqual(mockBlast);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getBlastRadius('INVALID-NODE')).rejects.toThrow(
      'Failed to calculate blast radius: Not Found'
    );
  });

  it('runs agent swarm and handles failure', async () => {
    const mockSwarmRes = {
      run_id: 'RUN-123',
      tenant_id: 'tenant-food-mfg-01',
      status: 'COMPLETED',
      autonomy_gate: 'A1_RECOMMENDATION',
      trajectories: [],
      synthesis: {},
    };

    const requestPayload = {
      scenario_prompt: 'Augment inspections',
      horizon_years: 2,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockSwarmRes,
    } as Response);

    const res = await client.runAgentSwarm(requestPayload as any);
    expect(res).toEqual(mockSwarmRes);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    } as Response);

    await expect(client.runAgentSwarm(requestPayload as any)).rejects.toThrow(
      'Failed to execute agent swarm: Service Unavailable'
    );
  });

  it('retrieves swarm run by id and handles failure', async () => {
    const mockSwarmRun = {
      run_id: 'RUN-123',
      status: 'COMPLETED',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockSwarmRun,
    } as Response);

    const res = await client.getSwarmRun('RUN-123');
    expect(res).toEqual(mockSwarmRun);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getSwarmRun('RUN-MISSING')).rejects.toThrow(
      'Failed to retrieve swarm run: Not Found'
    );
  });

  it('fetches scenario by id with default and custom sector, and handles failure', async () => {
    const mockScenario = { scenario_id: 'SCEN-001', title: 'Conservative' };

    // Default sector
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockScenario,
    } as Response);

    const resDefault = await client.getScenarioById('SCEN-001');
    expect(resDefault).toEqual(mockScenario);

    // Custom sector
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockScenario,
    } as Response);

    const resCustom = await client.getScenarioById('SCEN-001', 'pharma');
    expect(resCustom).toEqual(mockScenario);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getScenarioById('SCEN-INVALID')).rejects.toThrow(
      'Failed to load scenario SCEN-INVALID: Not Found'
    );
  });

  it('simulates scenario counterfactual with default and custom sector, and handles failure', async () => {
    const mockSimulation = {
      tenant_id: 'tenant-01',
      impact: { delta_ebitda_usd: 150000 },
    };

    const payload = { scenario_id: 'SCEN-001', adoption_speed_multiplier: 1.2 };

    // Default sector
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockSimulation,
    } as Response);

    const resDefault = await client.simulateScenario(payload);
    expect(resDefault).toEqual(mockSimulation);

    // Custom sector
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockSimulation,
    } as Response);

    const resCustom = await client.simulateScenario(payload, 'logistics');
    expect(resCustom).toEqual(mockSimulation);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response);

    await expect(client.simulateScenario(payload)).rejects.toThrow(
      'Failed to simulate scenario: Bad Request'
    );
  });

  it('fetches task matrix with and without workflowId and handles failure', async () => {
    const mockMatrix = { total_tasks: 6, tasks: [] };

    // Without workflowId
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockMatrix,
    } as Response);

    const res1 = await client.getTaskMatrix();
    expect(res1).toEqual(mockMatrix);

    // With workflowId
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockMatrix,
    } as Response);

    const res2 = await client.getTaskMatrix('WKF-001');
    expect(res2).toEqual(mockMatrix);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    } as Response);

    await expect(client.getTaskMatrix()).rejects.toThrow(
      'Failed to load task matrix: Service Unavailable'
    );
  });

  it('fetches task redesign item by id and handles failure', async () => {
    const mockItem = { task_id: 'TSK-001', classification: 'AUTOMATE' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem,
    } as Response);

    const res = await client.getTaskById('TSK-001');
    expect(res).toEqual(mockItem);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getTaskById('TSK-999')).rejects.toThrow(
      'Failed to load task redesign item: Not Found'
    );
  });

  it('updates task redesign item and handles failure', async () => {
    const mockUpdated = { task_id: 'TSK-001', classification: 'REDESIGN' };
    const payload = { classification: 'REDESIGN' as const, rationale: 'Restructured' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockUpdated,
    } as Response);

    const res = await client.updateTask('TSK-001', payload);
    expect(res).toEqual(mockUpdated);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Error',
    } as Response);

    await expect(client.updateTask('TSK-001', payload)).rejects.toThrow(
      'Failed to update task redesign item: Internal Error'
    );
  });

  it('submits task approval decision and handles failure', async () => {
    const mockApproval = {
      task_id: 'TSK-001',
      status: 'APPROVED' as const,
      approved_by: 'Lead Architect',
    };
    const payload = {
      approver_id: 'Lead Architect',
      decision: 'APPROVED' as const,
      notes: 'Sign-off complete',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApproval,
    } as Response);

    const res = await client.approveTask('TSK-001', payload);
    expect(res).toEqual(mockApproval);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response);

    await expect(client.approveTask('TSK-001', payload)).rejects.toThrow(
      'Failed to submit task approval decision: Bad Request'
    );
  });
});

