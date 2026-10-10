import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClient } from './api';

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
    } as Response);

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
    } as Response);

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
});
