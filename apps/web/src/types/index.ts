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

export interface ScenarioSimulationRequest {
  scenario_id: string;
  adoption_speed_multiplier?: number;
  wage_inflation_pct?: number;
  automation_aggression?: number;
  capital_cost_delta_pct?: number;
  custom_counterfactual_query?: string | null;
}

export interface CounterfactualImpact {
  base_ebitda_usd: number;
  simulated_ebitda_usd: number;
  delta_ebitda_usd: number;
  base_transition_cost_usd: number;
  simulated_transition_cost_usd: number;
  net_roles_created_delta: number;
  displaced_tasks_pct_simulated: number;
  risk_assessment: 'LOW_VOLATILITY' | 'HIGH_RETURN' | 'ELEVATED_FRICTION' | 'HIGH_CAPITAL_EXPOSURE';
  tripped_triggers: string[];
  counterfactual_narrative: string;
}

export interface ScenarioSimulationResponse {
  tenant_id: string;
  scenario: FutureScenario;
  simulation_parameters: Record<string, unknown>;
  impact: CounterfactualImpact;
  simulated_at: string;
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

export interface BlastRadiusNodeImpact {
  node_id: string;
  name: string;
  node_type: string;
  depth: number;
  relationship_chain: string[];
}

export interface BlastRadiusResponse {
  target_node_id: string;
  target_node_name: string;
  target_node_type: string;
  total_affected_nodes: number;
  affected_roles: string[];
  affected_tasks: string[];
  affected_systems: string[];
  affected_controls: string[];
  cascade: BlastRadiusNodeImpact[];
  disruption_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  analyzed_at: string;
}

export interface TemporalSimulationSummary {
  horizon_year: number;
  human_task_allocation_pct: number;
  agent_task_allocation_pct: number;
  active_agent_count: number;
  active_human_roles_count: number;
  net_productivity_gain_pct: number;
  governance_checkpoint_count: number;
}

export interface TemporalGraphResponse {
  graph: WorkGraphResponse;
  summary: TemporalSimulationSummary;
}

export type AutonomyTier =
  | 'A0_READ_ONLY'
  | 'A1_RECOMMENDATION'
  | 'A2_APPROVAL_GATE'
  | 'A3_REVERSIBLE_ACTION'
  | 'A4_DISALLOWED';

export type AgentRole =
  | 'EngagementOrchestrator'
  | 'WorkGraphArchitectAgent'
  | 'TaskDecompositionAgent'
  | 'SkillGapAgent'
  | 'GovernanceCriticAgent'
  | 'FinOpsCostAgent';

export interface AgentStep {
  agent_role: AgentRole;
  step_index: number;
  thought: string;
  tool_called?: string;
  observation: string;
  autonomy_tier: AutonomyTier;
  evidence_citations: string[];
  timestamp: string;
}

export interface SwarmRunRequest {
  scenario_prompt: string;
  sector?: string;
  target_role_id?: string;
  target_capability_id?: string;
  evidence_ids?: string[];
  horizon_years?: number;
}

export interface SwarmSynthesis {
  title: string;
  executive_summary: string;
  human_in_the_loop_recommendation: string;
  projected_human_work_pct: number;
  projected_agent_work_pct: number;
  reskilling_pathway: string;
  compliance_verdict: string;
  estimated_token_cost_usd: number;
  citations: string[];
}

export interface SwarmRunResponse {
  run_id: string;
  tenant_id: string;
  status: 'COMPLETED' | 'BLOCKED_BY_POLICY' | 'REQUIRES_APPROVAL';
  autonomy_gate: AutonomyTier;
  trajectories: AgentStep[];
  synthesis: SwarmSynthesis;
  started_at: string;
  completed_at: string;
}

export type TaskClassificationCategory =
  | 'RETAIN'
  | 'ASSIST'
  | 'AUGMENT'
  | 'AUTOMATE'
  | 'REDESIGN'
  | 'RETIRE';

export type TaskRedesignStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface TaskRedesignItem {
  task_id: string;
  tenant_id: string;
  workflow_id: string;
  task_name: string;
  role_id: string;
  role_name: string;
  classification: TaskClassificationCategory;
  rationale: string;
  target_agent_id?: string | null;
  target_system?: string | null;
  baseline_cycle_time_seconds: number;
  target_cycle_time_seconds: number;
  cycle_time_reduction_pct: number;
  human_share_pct: number;
  agent_share_pct: number;
  status: TaskRedesignStatus;
  approved_by?: string | null;
  approval_timestamp?: string | null;
  approval_notes?: string | null;
  evidence_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskMatrixResponse {
  tenant_id: string;
  workflow_id: string;
  workflow_name: string;
  total_tasks: number;
  classification_summary: Record<string, number>;
  overall_human_share_pct: number;
  overall_agent_share_pct: number;
  overall_cycle_time_reduction_pct: number;
  tasks: TaskRedesignItem[];
}

export interface TaskRedesignUpdateRequest {
  classification?: TaskClassificationCategory;
  rationale?: string;
  target_agent_id?: string | null;
  target_system?: string | null;
  target_cycle_time_seconds?: number;
  human_share_pct?: number;
  agent_share_pct?: number;
}

export interface TaskApprovalRequest {
  approver_id: string;
  decision: 'APPROVED' | 'REJECTED';
  notes?: string;
}

export interface TaskApprovalResponse {
  task_id: string;
  status: TaskRedesignStatus;
  approved_by: string;
  approval_timestamp: string;
  approval_notes?: string | null;
  task: TaskRedesignItem;
}

export type FeasibilityTier = 'HIGH_FEASIBILITY' | 'MODERATE_FEASIBILITY' | 'HIGH_EFFORT';
export type AdaptabilityTier = 'ELITE_AGILITY' | 'ADAPTIVE' | 'TRANSITIONING' | 'RESISTANT';
export type OpportunitySentimentTier = 'HIGHLY_EMPOWERING' | 'BALANCED' | 'DISPLACEMENT_RISK';

export interface TransitionReadinessScore {
  source_role_id: string;
  target_role_id: string;
  score: number;
  shared_skills_pct: number;
  critical_gap_pct: number;
  learning_velocity_pct: number;
  feasibility_tier: FeasibilityTier;
  formula_version: string;
  components: {
    name: string;
    weight: number;
    raw_value: number;
    weighted_value: number;
    rationale: string;
    evidence_ids: string[];
  }[];
  evidence_ids: string[];
  calculated_at: string;
}

export interface WorkforceAdaptabilityIndex {
  tenant_id: string;
  score: number;
  learning_velocity_pct: number;
  tech_absorption_pct: number;
  skill_mobility_rate_pct: number;
  culture_readiness_pct: number;
  adaptability_tier: AdaptabilityTier;
  cohort_size: number;
  k_anonymity_passed: boolean;
  privacy_notice?: string | null;
  formula_version: string;
  components: {
    name: string;
    weight: number;
    raw_value: number;
    weighted_value: number;
    rationale: string;
    evidence_ids: string[];
  }[];
  evidence_ids: string[];
  calculated_at: string;
}

export interface HumanOpportunityScore {
  tenant_id: string;
  score: number;
  new_roles_count: number;
  augmented_tasks_count: number;
  automated_tasks_count: number;
  sentiment_tier: OpportunitySentimentTier;
  formula_version: string;
  evidence_ids: string[];
  calculated_at: string;
}

export interface ReskillingModule {
  module_id: string;
  title: string;
  duration_weeks: number;
  skill_gaps_addressed: string[];
  delivery_format: string;
  certification: string;
}

export interface RoleTransitionPathway {
  pathway_id: string;
  tenant_id: string;
  source_role_id: string;
  source_role_name: string;
  target_role_id: string;
  target_role_name: string;
  transition_readiness: TransitionReadinessScore;
  skill_overlap_pct: number;
  skill_gaps: string[];
  curriculum: ReskillingModule[];
  estimated_duration_weeks: number;
  wage_impact_pct: number;
  status: string;
  evidence_ids: string[];
  created_at: string;
}

export interface PathwayAppealRequest {
  pathway_id: string;
  contested_skill: string;
  rationale: string;
  supporting_evidence_uri?: string | null;
  appellant_id: string;
}

export interface PathwayAppealResponse {
  appeal_id: string;
  pathway_id: string;
  appellant_id: string;
  status: string;
  received_at: string;
  notice: string;
}

export interface OpportunityMetricsResponse {
  tenant_id: string;
  role_resilience: RoleResilienceResult;
  transition_readiness: TransitionReadinessScore[];
  workforce_adaptability: WorkforceAdaptabilityIndex;
  human_opportunity_score: HumanOpportunityScore;
  cohort_size: number;
  k_anonymity_passed: boolean;
  pathways: RoleTransitionPathway[];
}

export type SAIFDomain =
  | 'EXPAND_ECOSYSTEM'
  | 'SAFEGUARD_ARCH'
  | 'SECURE_AI_SYSTEMS'
  | 'PROTECT_DATA'
  | 'CONTINUOUS_MONITOR'
  | 'INCIDENT_RESPONSE';

export type ControlStatus = 'VERIFIED' | 'IN_PROGRESS' | 'ACTION_REQUIRED';

export interface SAIFControlItem {
  control_id: string;
  domain: SAIFDomain;
  title: string;
  description: string;
  status: ControlStatus;
  evidence_ids: string[];
  verifier_component: string;
  remediation_owner?: string | null;
  notes?: string | null;
}

export interface WellArchitectedPillarScore {
  pillar: string;
  score: number;
  weight_pct: number;
  status: string;
  failed_checks_count: number;
  remediation_owner: string;
  evidence_ids: string[];
}

export interface GovernancePostureResponse {
  tenant_id: string;
  overall_trust_score: number;
  gate_status: 'PASSED' | 'FLAGGED' | 'BLOCKED';
  red_lines_breached: number;
  policy_version: string;
  pillars: WellArchitectedPillarScore[];
  saif_controls: SAIFControlItem[];
  evaluated_at: string;
}

export interface InvestorAssumptionPayload {
  wage_uplift_multiplier: number;
  automation_yield_factor: number;
  transition_capex_usd: number;
}

export interface RoadmapMilestone {
  horizon: '30_DAYS' | '90_DAYS' | '365_DAYS';
  title: string;
  deliverables: string[];
  target_roi_multiplier: number;
  governance_checkpoint: string;
}

export interface InvestorLensResponse {
  tenant_id: string;
  organization_name: string;
  transformation_thesis: string;
  projected_ebitda_impact_usd: number;
  transition_cost_usd: number;
  net_roi_multiple: number;
  payback_period_months: number;
  defensibility_moat_score: number;
  assumptions_applied: InvestorAssumptionPayload;
  roadmaps: RoadmapMilestone[];
  disclaimer: string;
  generated_at: string;
}

export interface RemediationActionRequest {
  control_id: string;
  remediation_owner: string;
  action_notes: string;
  resolved: boolean;
}

export interface RemediationActionResponse {
  control_id: string;
  status: ControlStatus;
  remediation_owner: string;
  notes: string;
  updated_at: string;
}

export interface DiligencePackExport {
  pack_id: string;
  tenant_id: string;
  organization_name: string;
  trust_score: number;
  saif_compliance_pct: number;
  red_lines_breached: number;
  gate_status: string;
  evidence_envelopes_count: number;
  evidence_hashes: string[];
  cryptographic_seal_hash: string;
  exported_at: string;
  disclaimer: string;
}

export interface DlpFinding {
  info_type: string;
  likelihood: string;
  quote: string;
}

export interface DlpRedactionResult {
  original_text: string;
  redacted_text: string;
  redacted_items_count: number;
  findings: DlpFinding[];
  has_violations: boolean;
}

