/**
 * API client service for FuturaSculptAI web cockpit.
 * Connects to FastAPI backend with typed error handling and fallback resilience.
 */

import {
  EvidenceEnvelope,
  OnboardingPayload,
  RoleResilienceResult,
  ScenarioComparisonResponse,
  TrustScoreResult,
  WorkGraphResponse,
} from '../types';

const API_BASE = '/api/v1';

export class ApiClient {
  private tenantId: string = 'tenant-food-mfg-01';

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId,
    };
  }

  async getWorkGraph(): Promise<WorkGraphResponse> {
    const res = await fetch(`${API_BASE}/workgraph`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load WorkGraph: ${res.statusText}`);
    }
    return res.json();
  }

  async getScenarios(sector: string = 'food_manufacturing'): Promise<ScenarioComparisonResponse> {
    const res = await fetch(`${API_BASE}/scenarios?sector=${encodeURIComponent(sector)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load scenarios: ${res.statusText}`);
    }
    return res.json();
  }

  async getEvidenceLedger(): Promise<EvidenceEnvelope[]> {
    const res = await fetch(`${API_BASE}/evidence`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load evidence ledger: ${res.statusText}`);
    }
    return res.json();
  }

  async getRoleResilience(roleId: string = 'ROL-001'): Promise<RoleResilienceResult> {
    const res = await fetch(`${API_BASE}/scoring/rri?role_id=${encodeURIComponent(roleId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to evaluate role resilience: ${res.statusText}`);
    }
    return res.json();
  }

  async getTrustBoard(): Promise<TrustScoreResult> {
    const res = await fetch(`${API_BASE}/scoring/trustboard`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to evaluate trustboard posture: ${res.statusText}`);
    }
    return res.json();
  }

  async onboard(payload: OnboardingPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/onboard`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Onboarding failed');
    }
    return res.json();
  }

  async uploadEvidence(file: File, author: string = 'Manual Upload'): Promise<EvidenceEnvelope> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('author', author);
    formData.append('source_type', 'pdf');

    const res = await fetch(`${API_BASE}/evidence/upload`, {
      method: 'POST',
      headers: {
        'X-Tenant-ID': this.tenantId,
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  }
}

export const api = new ApiClient();
