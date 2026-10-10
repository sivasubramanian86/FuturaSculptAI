/**
 * TypeScript contract interfaces for FuturaSculptAI web cockpit.
 * Mirrors backend Pydantic models.
 */

export interface WorkGraphNode {
  node_id: string;
  tenant_id: string;
  node_type: 'outcome' | 'capability' | 'workflow' | 'task' | 'role' | 'skill' | 'system' | 'data' | 'agent' | 'control' | 'technology';
  name: string;
  description: string;
  properties: {
    sector: string;
    status: string;
    criticality: string;
    cost_per_hour?: number;
    cycle_time_seconds?: number;
    maturity_level?: string;
  };
  valid_from: string;
  valid_to?: string | null;
  is_current: boolean;
  evidence_ids: string[];
}

export interface WorkGraphEdge {
  edge_id: string;
  tenant_id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  allocation_percentage?: number;
  impact_weight: number;
}

export interface WorkGraphResponse {
  tenant_id: string;
  sector: string;
  nodes: WorkGraphNode[];
  edges: WorkGraphEdge[];
  total_nodes: number;
  total_edges: number;
  as_of: string;
}

export interface FutureScenario {
  scenario_id: string;
  tenant_id: string;
  scenario_class: 'conservative' | 'accelerated' | 'disruptive' | 'human_first';
  title: string;
  horizon_years: number;
  narrative_summary: string;
  ebitda_impact_usd: number;
  transition_cost_usd: number;
  net_new_roles: number;
  augmented_roles: number;
  displaced_tasks_pct: number;
  confidence_score: number;
  uncertainty_range_pct: number;
  assumptions: string[];
  invalidation_triggers: string[];
  counterfactuals: string[];
  primary_technologies: string[];
  evidence_ids: string[];
}

export interface ScenarioComparisonResponse {
  tenant_id: string;
  sector: string;
  baseline_year: number;
  scenarios: FutureScenario[];
}

export interface EvidenceEntity {
  name: string;
  entity_type: string;
  confidence: number;
}

export interface EvidenceSegment {
  segment_id: string;
  text: string;
  page_number?: number;
  offset_start?: number;
  offset_end?: number;
  timestamp_seconds?: number;
}

export interface EvidenceEnvelope {
  evidence_id: string;
  tenant_id: string;
  source_type: string;
  source_uri: string;
  sha256_hash: string;
  ingested_at: string;
  content: {
    language: string;
    normalized_text: string;
    segments: EvidenceSegment[];
    entities?: EvidenceEntity[];
  };
  provenance: {
    author_or_source: string;
    publication_date: string;
    freshness_horizon_days?: number;
    confidence: number;
  };
  acl: string[];
  sensitivity: string;
}

export interface IntegrityCheckResult {
  evidence_id: string;
  is_valid: boolean;
  computed_sha256: string;
  stored_sha256: string;
  checked_at: string;
}

export interface ClaimVerificationResult {
  claim_text: string;
  verdict: 'supported' | 'contradicted' | 'insufficient_evidence';
  confidence: number;
  cited_evidence_ids: string[];
  cited_segments: EvidenceSegment[];
  explanation: string;
}

export interface ScoreComponent {
  name: string;
  weight: number;
  raw_value: number;
  weighted_value: number;
  rationale: string;
}

export interface RoleResilienceResult {
  role_id: string;
  role_name: string;
  score: number;
  tier: string;
  formula_version?: string;
  components: ScoreComponent[];
  recommended_pathway: string;
}

export interface TrustScoreResult {
  trust_score: number;
  saif_security_score: number;
  operational_excellence_score: number;
  reliability_score: number;
  performance_score: number;
  cost_optimization_score: number;
  sustainability_score: number;
  red_lines_breached: number;
  gate_status: 'PASSED' | 'FLAGGED' | 'BLOCKED';
}

export interface OnboardingPayload {
  organization_name: string;
  sector: string;
  headcount: number;
  primary_strategic_goal: string;
  contact_email: string;
  consent_purpose?: string;
  consent_granted?: boolean;
}
