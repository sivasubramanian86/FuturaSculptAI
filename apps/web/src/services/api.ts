/**
 * API client service for FuturaSculptAI web cockpit.
 * Connects to FastAPI backend with typed error handling and fallback resilience.
 */

import {
  BlastRadiusResponse,
  ClaimVerificationResult,
  DiligencePackExport,
  DlpRedactionResult,
  EvidenceEnvelope,
  FutureScenario,
  GovernancePostureResponse,
  IntegrityCheckResult,
  InvestorAssumptionPayload,
  InvestorLensResponse,
  OnboardingPayload,
  OpportunityMetricsResponse,
  PathwayAppealRequest,
  PathwayAppealResponse,
  RemediationActionRequest,
  RemediationActionResponse,
  RoleResilienceResult,
  RoleTransitionPathway,
  SAIFControlItem,
  SAIFDomain,
  ScenarioComparisonResponse,
  ScenarioSimulationRequest,
  ScenarioSimulationResponse,
  SwarmRunRequest,
  SwarmRunResponse,
  TaskApprovalRequest,
  TaskApprovalResponse,
  TaskMatrixResponse,
  TaskRedesignItem,
  TaskRedesignUpdateRequest,
  TemporalGraphResponse,
  TrustScoreResult,
  WorkGraphResponse,
} from '../types';
import { firebaseAuth } from './firebase';

const API_BASE = '/api/v1';

export class ApiClient {
  private tenantId: string = 'tenant-food-mfg-01';

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
    firebaseAuth.setTenant(tenantId);
  }

  getTenantId(): string {
    return this.tenantId;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId,
      ...firebaseAuth.getAuthHeaders(),
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

  async getTaskMatrix(workflowId?: string): Promise<TaskMatrixResponse> {
    const url = workflowId
      ? `${API_BASE}/tasks/matrix?workflow_id=${encodeURIComponent(workflowId)}`
      : `${API_BASE}/tasks/matrix`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load task matrix: ${res.statusText}`);
    }
    return res.json();
  }

  async getTaskById(taskId: string): Promise<TaskRedesignItem> {
    const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load task redesign item: ${res.statusText}`);
    }
    return res.json();
  }

  async updateTask(
    taskId: string,
    payload: TaskRedesignUpdateRequest
  ): Promise<TaskRedesignItem> {
    const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to update task redesign item: ${res.statusText}`);
    }
    return res.json();
  }

  async approveTask(
    taskId: string,
    payload: TaskApprovalRequest
  ): Promise<TaskApprovalResponse> {
    const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(taskId)}/approval`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to submit task approval decision: ${res.statusText}`);
    }
    return res.json();
  }

  async getOpportunityMetrics(
    cohortSize: number = 25,
    roleId: string = 'ROL-001'
  ): Promise<OpportunityMetricsResponse> {
    const res = await fetch(
      `${API_BASE}/opportunity/metrics?cohort_size=${cohortSize}&role_id=${encodeURIComponent(roleId)}`,
      {
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to load workforce opportunity metrics: ${res.statusText}`);
    }
    return res.json();
  }

  async getTransitionPathways(
    roleId: string = 'ROL-001'
  ): Promise<RoleTransitionPathway[]> {
    const res = await fetch(
      `${API_BASE}/opportunity/pathways?role_id=${encodeURIComponent(roleId)}`,
      {
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to load role transition pathways: ${res.statusText}`);
    }
    return res.json();
  }

  async submitPathwayAppeal(
    payload: PathwayAppealRequest
  ): Promise<PathwayAppealResponse> {
    const res = await fetch(`${API_BASE}/opportunity/appeal`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to submit pathway appeal: ${res.statusText}`);
    }
    return res.json();
  }

  async getGovernancePosture(): Promise<GovernancePostureResponse> {
    const res = await fetch(`${API_BASE}/governance/trustboard`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load governance posture: ${res.statusText}`);
    }
    return res.json();
  }

  async getSAIFControls(domain?: SAIFDomain): Promise<SAIFControlItem[]> {
    const url = domain
      ? `${API_BASE}/governance/saif-controls?domain=${encodeURIComponent(domain)}`
      : `${API_BASE}/governance/saif-controls`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load SAIF controls: ${res.statusText}`);
    }
    return res.json();
  }

  async getInvestorLens(): Promise<InvestorLensResponse> {
    const res = await fetch(`${API_BASE}/governance/investor-lens`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load investor lens: ${res.statusText}`);
    }
    return res.json();
  }

  async simulateInvestorLens(
    payload: InvestorAssumptionPayload
  ): Promise<InvestorLensResponse> {
    const res = await fetch(`${API_BASE}/governance/investor-lens/simulate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to simulate investor lens: ${res.statusText}`);
    }
    return res.json();
  }

  async updateRemediation(
    payload: RemediationActionRequest
  ): Promise<RemediationActionResponse> {
    const res = await fetch(`${API_BASE}/governance/remediate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to update governance remediation: ${res.statusText}`);
    }
    return res.json();
  }

  async exportDiligencePack(): Promise<DiligencePackExport> {
    const res = await fetch(`${API_BASE}/governance/diligence-pack`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to export diligence pack: ${res.statusText}`);
    }
    return res.json();
  }

  async inspectDlp(
    content: string,
    redactSensitiveFields: boolean = true
  ): Promise<DlpRedactionResult> {
    const res = await fetch(`${API_BASE}/evidence/inspect-dlp`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        content,
        redact_sensitive_fields: redactSensitiveFields,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to inspect DLP content: ${res.statusText}`);
    }
    return res.json();
  }

  async generateTransformationRoadmap(payload: {
    firm_name: string;
    scenario_prompt: string;
    sector?: string;
    target_horizon_years?: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/scenarios/transformation-roadmap`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to generate transformation roadmap: ${res.statusText}`);
    }
    return res.json();
  }
}

export const api = new ApiClient();

