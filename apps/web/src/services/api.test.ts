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
});
