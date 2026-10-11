/**
 * API client service for FuturaSculptAI web cockpit.
 * Connects to FastAPI backend with typed error handling and fallback resilience.
 */

import {
  BlastRadiusResponse,
  ClaimVerificationResult,
  EvidenceEnvelope,
  FutureScenario,
  IntegrityCheckResult,
  OnboardingPayload,
  RoleResilienceResult,
  ScenarioComparisonResponse,
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
  SwarmRunRequest,
  SwarmRunResponse,
  TemporalGraphResponse,
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

  async getScenarioById(scenarioId: string, sector: string = 'food_manufacturing'): Promise<FutureScenario> {
    const res = await fetch(`${API_BASE}/scenarios/${encodeURIComponent(scenarioId)}?sector=${encodeURIComponent(sector)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load scenario ${scenarioId}: ${res.statusText}`);
    }
    return res.json();
  }

  async simulateScenario(
    payload: ScenarioSimulationRequest,
    sector: string = 'food_manufacturing'
  ): Promise<ScenarioSimulationResponse> {
    const res = await fetch(`${API_BASE}/scenarios/simulate?sector=${encodeURIComponent(sector)}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to simulate scenario: ${res.statusText}`);
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

  async getEvidenceDetail(evidenceId: string): Promise<EvidenceEnvelope> {
    const res = await fetch(`${API_BASE}/evidence/${encodeURIComponent(evidenceId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load evidence detail: ${res.statusText}`);
    }
    return res.json();
  }

  async verifyIntegrity(evidenceId: string): Promise<IntegrityCheckResult> {
    const res = await fetch(`${API_BASE}/evidence/${encodeURIComponent(evidenceId)}/integrity`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to verify evidence integrity: ${res.statusText}`);
    }
    return res.json();
  }

  async verifyClaim(claimText: string, evidenceIds: string[] = []): Promise<ClaimVerificationResult> {
    const res = await fetch(`${API_BASE}/evidence/verify-claim`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ claim_text: claimText, evidence_ids: evidenceIds }),
    });
    if (!res.ok) {
      throw new Error(`Failed to verify claim entailment: ${res.statusText}`);
    }
    return res.json();
  }

  async uploadEvidence(
    file: File,
    author: string = 'Manual Upload',
    sourceType: string = 'pdf'
  ): Promise<EvidenceEnvelope> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('author', author);
    formData.append('source_type', sourceType);

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

  async getTemporalWorkGraph(horizonYear: number = 0): Promise<TemporalGraphResponse> {
    const res = await fetch(`${API_BASE}/workgraph/temporal?horizon_year=${horizonYear}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load temporal WorkGraph: ${res.statusText}`);
    }
    return res.json();
  }

  async getBlastRadius(nodeId: string, maxDepth: number = 3): Promise<BlastRadiusResponse> {
    const res = await fetch(
      `${API_BASE}/workgraph/blast-radius?node_id=${encodeURIComponent(nodeId)}&max_depth=${maxDepth}`,
      {
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to calculate blast radius: ${res.statusText}`);
    }
    return res.json();
  }

  async runAgentSwarm(request: SwarmRunRequest): Promise<SwarmRunResponse> {
    const res = await fetch(`${API_BASE}/agents/swarm/run`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error(`Failed to execute agent swarm: ${res.statusText}`);
    }
    return res.json();
  }

  async getSwarmRun(runId: string): Promise<SwarmRunResponse> {
    const res = await fetch(`${API_BASE}/agents/swarm/runs/${encodeURIComponent(runId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to retrieve swarm run: ${res.statusText}`);
    }
    return res.json();
  }
}

export const api = new ApiClient();
