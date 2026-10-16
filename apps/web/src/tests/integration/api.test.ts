import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClient } from '../../services/api';

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

  it('fetches workforce opportunity metrics with defaults and custom params', async () => {
    const mockMetrics = {
      tenant_id: 'tenant-food-mfg-01',
      cohort_size: 25,
      k_anonymity_passed: true,
      pathways: [],
    };

    // Default params
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetrics,
    } as Response);

    const res1 = await client.getOpportunityMetrics();
    expect(res1).toEqual(mockMetrics);

    // Custom params
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetrics,
    } as Response);

    const res2 = await client.getOpportunityMetrics(8, 'ROL-002');
    expect(res2).toEqual(mockMetrics);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    } as Response);

    await expect(client.getOpportunityMetrics()).rejects.toThrow(
      'Failed to load workforce opportunity metrics: Service Unavailable'
    );
  });

  it('fetches role transition pathways and handles failure', async () => {
    const mockPathways = [{ pathway_id: 'PTH-001', source_role_id: 'ROL-001' }];

    // Default params
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPathways,
    } as Response);

    const res1 = await client.getTransitionPathways();
    expect(res1).toEqual(mockPathways);

    // Custom roleId
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPathways,
    } as Response);

    const res2 = await client.getTransitionPathways('ROL-003');
    expect(res2).toEqual(mockPathways);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getTransitionPathways()).rejects.toThrow(
      'Failed to load role transition pathways: Not Found'
    );
  });

  it('submits pathway appeal and handles failure', async () => {
    const mockAppeal = {
      appeal_id: 'APL-12345678',
      pathway_id: 'PTH-001',
      appellant_id: 'EMP-101',
      status: 'PENDING_AUDIT_REVIEW',
    };
    const payload = {
      pathway_id: 'PTH-001',
      contested_skill: 'Vision Tuning',
      rationale: 'Prior 5-year certification.',
      appellant_id: 'EMP-101',
    };

    // Success
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockAppeal,
    } as Response);

    const res = await client.submitPathwayAppeal(payload);
    expect(res).toEqual(mockAppeal);

    // Failure
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response);

    await expect(client.submitPathwayAppeal(payload)).rejects.toThrow(
      'Failed to submit pathway appeal: Bad Request'
    );
  });

  it('fetches governance posture and handles failure', async () => {
    const mockPosture = { overall_trust_score: 92.5, gate_status: 'PASSED' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosture,
    } as Response);

    const res = await client.getGovernancePosture();
    expect(res).toEqual(mockPosture);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Error',
    } as Response);

    await expect(client.getGovernancePosture()).rejects.toThrow(
      'Failed to load governance posture: Internal Error'
    );
  });

  it('fetches SAIF controls with and without domain filter, and handles failure', async () => {
    const mockControls = [{ control_id: 'SAIF-01' }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockControls,
    } as Response);

    const res1 = await client.getSAIFControls();
    expect(res1).toEqual(mockControls);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockControls,
    } as Response);

    const res2 = await client.getSAIFControls('SECURE_AI_SYSTEMS');
    expect(res2).toEqual(mockControls);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getSAIFControls()).rejects.toThrow(
      'Failed to load SAIF controls: Not Found'
    );
  });

  it('fetches investor lens and handles failure', async () => {
    const mockLens = { organization_name: 'Apex Food Mfg', net_roi_multiple: 6.25 };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockLens,
    } as Response);

    const res = await client.getInvestorLens();
    expect(res).toEqual(mockLens);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    } as Response);

    await expect(client.getInvestorLens()).rejects.toThrow(
      'Failed to load investor lens: Service Unavailable'
    );
  });

  it('simulates investor lens assumptions and handles failure', async () => {
    const mockSim = { net_roi_multiple: 8.5 };
    const payload = {
      wage_uplift_multiplier: 1.5,
      automation_yield_factor: 1.4,
      transition_capex_usd: 300000,
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockSim,
    } as Response);

    const res = await client.simulateInvestorLens(payload);
    expect(res).toEqual(mockSim);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response);

    await expect(client.simulateInvestorLens(payload)).rejects.toThrow(
      'Failed to simulate investor lens: Bad Request'
    );
  });

  it('updates governance remediation and handles failure', async () => {
    const mockRemediation = { control_id: 'SAIF-01', status: 'VERIFIED' };
    const payload = {
      control_id: 'SAIF-01',
      remediation_owner: 'Lead SecOps',
      action_notes: 'Applied pinned hashes.',
      resolved: true,
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRemediation,
    } as Response);

    const res = await client.updateRemediation(payload);
    expect(res).toEqual(mockRemediation);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Error',
    } as Response);

    await expect(client.updateRemediation(payload)).rejects.toThrow(
      'Failed to update governance remediation: Internal Error'
    );
  });

  it('exports diligence pack and handles failure', async () => {
    const mockPack = { pack_id: 'DIL-001', cryptographic_seal_hash: 'abcdef123456' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPack,
    } as Response);

    const res = await client.exportDiligencePack();
    expect(res).toEqual(mockPack);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
    } as Response);

    await expect(client.exportDiligencePack()).rejects.toThrow(
      'Failed to export diligence pack: Forbidden'
    );
  });

  it('inspects DLP content and handles failure', async () => {
    const mockResult = {
      original_text: 'SSN: 000-11-2222',
      redacted_text: 'SSN: [REDACTED_SSN]',
      redacted_items_count: 1,
      findings: [{ info_type: 'US_SOCIAL_SECURITY_NUMBER', likelihood: 'VERY_LIKELY', quote: '000-11-2222' }],
      has_violations: true,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    } as Response);

    const res = await client.inspectDlp('SSN: 000-11-2222');
    expect(res).toEqual(mockResult);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    } as Response);

    await expect(client.inspectDlp('SSN: 000-11-2222', false)).rejects.toThrow(
      'Failed to inspect DLP content: Service Unavailable'
    );
  });

  it('generates transformation roadmap and handles failure', async () => {
    const mockRoadmap = {
      firm_title: 'Mayo Clinic',
      category: 'public_health',
      horizons: { baseline: {} },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoadmap,
    } as Response);

    const res = await client.generateTransformationRoadmap({
      firm_name: 'Mayo Clinic',
      scenario_prompt: 'Clinical triage',
    });
    expect(res).toEqual(mockRoadmap);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Error',
    } as Response);

    await expect(
      client.generateTransformationRoadmap({
        firm_name: 'Mayo Clinic',
        scenario_prompt: 'Clinical triage',
      })
    ).rejects.toThrow('Failed to generate transformation roadmap: Internal Error');
  });

  it('fetches company intelligence and handles failure', async () => {
    const mockIntelligence = {
      company_name: 'Tesla',
      sector: 'automotive_ev',
      core_business: 'Electric vehicles and clean energy',
      grounded_facts: ['Gigafactory manufacturing automation'],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockIntelligence,
    } as Response);

    const res = await client.fetchCompanyIntelligence({
      company_name: 'Tesla',
      sector: 'automotive_ev',
      website_url: 'https://tesla.com',
    });
    expect(res).toEqual(mockIntelligence);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Gateway Timeout',
    } as Response);

    await expect(
      client.fetchCompanyIntelligence({ company_name: 'Tesla' })
    ).rejects.toThrow('Failed to fetch company intelligence: Gateway Timeout');
  });

  it('generates Gemini Live dialogue and handles failure', async () => {
    const mockDialogue = {
      response_text: 'Hello from Gemini Live voice engine',
      model_used: 'models/gemini-3.8-live',
      voice_persona: 'kore',
      audio_base64: 'UklGRgAAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=',
      latency_ms: 120.5,
      input_tokens: 15,
      output_tokens: 30,
      estimated_cost_usd: 0.00001,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockDialogue,
    } as Response);

    const res = await client.geminiLiveDialogue({
      message: 'Hello Futura',
      voice_persona: 'kore',
    });
    expect(res).toEqual(mockDialogue);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(
      client.geminiLiveDialogue({ message: 'Hello Futura' })
    ).rejects.toThrow('Failed to generate Gemini Live dialogue: Internal Server Error');
  });

  it('manages WorkTwin manifests and handles failures', async () => {
    const mockManifests = [
      {
        twin_id: 'twin-role-cto',
        tenant_id: 'tenant-food-mfg-01',
        twin_type: 'ROLE_TWIN',
        role_archetype: 'CTO Role Twin',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockManifests,
    } as Response);

    const manifests = await client.getWorkTwinManifests();
    expect(manifests).toEqual(mockManifests);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getWorkTwinManifests()).rejects.toThrow('Failed to fetch WorkTwin manifests: Not Found');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockManifests[0],
    } as Response);

    const twin = await client.getWorkTwinById('twin-role-cto');
    expect(twin).toEqual(mockManifests[0]);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getWorkTwinById('twin-unknown')).rejects.toThrow('Failed to fetch WorkTwin manifest for twin-unknown: Not Found');
  });

  it('creates RoleTwin and handles failure', async () => {
    const mockCreated = {
      twin_id: 'twin-role-new',
      role_archetype: 'Test Role',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockCreated,
    } as Response);

    const res = await client.createRoleTwin({
      role_archetype: 'Test Role',
      declared_purpose: 'Test Purpose',
      skills: ['Skill1'],
    });
    expect(res).toEqual(mockCreated);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response);

    await expect(
      client.createRoleTwin({
        role_archetype: '',
        declared_purpose: '',
        skills: [],
      })
    ).rejects.toThrow('Failed to create RoleTwin: Bad Request');
  });

  it('simulates Future Boardroom and handles failure', async () => {
    const mockResult = {
      simulation_id: 'sim-001',
      perspectives: [],
      conflict_resolution: { consensus_points: [] },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult,
    } as Response);

    const res = await client.simulateFutureBoardroom({
      proposal_title: 'Test Proposal',
      proposal_description: 'Test Desc',
    });
    expect(res).toEqual(mockResult);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Forbidden',
    } as Response);

    await expect(
      client.simulateFutureBoardroom({
        proposal_title: 'Fire workers',
        proposal_description: 'Terminate all',
      })
    ).rejects.toThrow('Failed to simulate Future Boardroom: Forbidden');
  });

  it('registers PersonalWorkTwin consent and handles failure', async () => {
    const mockConsentRes = {
      twin_id: 'twin-personal-emp1',
      twin_type: 'PERSONAL_WORKTWIN',
      owner_id: 'emp1',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockConsentRes,
    } as Response);

    const res = await client.registerPersonalTwinConsent({
      employee_id: 'emp1',
      knowledge_consent: true,
      writing_style_consent: true,
      delegated_task_consent: true,
      voice_avatar_consent: false,
      revoked: false,
      consent_timestamp: '2026-10-16T10:00:00Z',
    });
    expect(res).toEqual(mockConsentRes);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      statusText: 'Unprocessable Entity',
    } as Response);

    await expect(
      client.registerPersonalTwinConsent({
        employee_id: '',
        knowledge_consent: false,
        writing_style_consent: false,
        delegated_task_consent: false,
        voice_avatar_consent: false,
        revoked: false,
        consent_timestamp: '',
      })
    ).rejects.toThrow('Failed to register PersonalWorkTwin consent: Unprocessable Entity');
  });
});



