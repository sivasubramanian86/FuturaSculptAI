"""Pydantic schemas for Google ADK Multi-Agent Swarm and Autonomy Governance."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class AutonomyTier(str, Enum):
    """FuturaSculptAI Autonomy Tiers (A0-A4) enforcing Responsible AI red lines."""

    A0_READ_ONLY = "A0_READ_ONLY"  # Read-only observation, zero operational effect
    A1_RECOMMENDATION = "A1_RECOMMENDATION"  # Synthesis and recommendation requiring human review
    A2_APPROVAL_GATE = "A2_APPROVAL_GATE"  # Structured change proposal requiring human authorization
    A3_REVERSIBLE_ACTION = "A3_REVERSIBLE_ACTION"  # Reversible operational adjustment with rollback
    A4_DISALLOWED = "A4_DISALLOWED"  # Prohibited consequential decision (termination, punitive ranking)


class AgentRole(str, Enum):
    """Specialized swarm agents participating in work transformation sculpting."""

    ORCHESTRATOR = "EngagementOrchestrator"
    WORKGRAPH_ARCHITECT = "WorkGraphArchitectAgent"
    FUTURE_SIGNALS = "FutureSignalsAgent"
    TASK_REDESIGN = "TaskRedesignAgent"
    TASK_DECOMPOSER = "TaskDecompositionAgent"
    SKILLS_MOBILITY = "SkillsMobilityAgent"
    SKILL_GAP_ANALYST = "SkillGapAgent"
    BUSINESS_SOLUTION = "BusinessSolutionAgent"
    AGENT_BLUEPRINT = "AgentBlueprintAgent"
    TRUST_GOVERNANCE = "TrustGovernanceAgent"
    GOVERNANCE_CRITIC = "GovernanceCriticAgent"
    FINOPS = "FinOpsAgent"
    FINOPS_EVALUATOR = "FinOpsCostAgent"
    ADVERSARIAL_CRITIC = "AdversarialCriticAgent"


class TaskClassificationType(str, Enum):
    """Six-part task classification taxonomy for AI and automation transformation."""

    RETAIN = "RETAIN"
    ASSIST = "ASSIST"
    AUGMENT = "AUGMENT"
    AUTOMATE = "AUTOMATE"
    REDESIGN = "REDESIGN"
    RETIRE = "RETIRE"


class TaskAllocationItem(BaseModel):
    """Fine-grained allocation of a task across human operators and autonomous agents."""

    task_id: str
    task_name: str
    classification: TaskClassificationType
    human_share_pct: float
    agent_share_pct: float
    justification: str


class AgentBlueprintSpec(BaseModel):
    """Concrete Google ADK agent deployment specification."""

    blueprint_id: str
    name: str
    target_role_id: str
    model_tier: str = "gemini-2.5-flash"
    autonomy_tier: AutonomyTier = AutonomyTier.A1_RECOMMENDATION
    tools_bound: List[str] = Field(default_factory=list)
    trigger_events: List[str] = Field(default_factory=list)
    circuit_breaker_condition: str = "error_rate > 0.05"
    rollback_procedure: str = "Disable autonomous triage, route 100% traffic to human supervisor."


class BusinessSolutionDossier(BaseModel):
    """13-part enterprise work transformation proposal."""

    transformation_title: str
    target_sector: str
    horizon_years: int
    current_state_assessment: str
    target_state_architecture: str
    task_allocations: List[TaskAllocationItem] = Field(default_factory=list)
    net_ebitda_impact_usd: float = 0.0
    payback_period_months: float = 0.0
    reskilling_roadmap_weeks: int = 6
    risk_mitigation_plan: str = ""


class AdversarialAuditResult(BaseModel):
    """Red-team adversarial review of transformation proposals."""

    is_grounded: bool = True
    groundedness_score: float = 1.0
    hallucination_rate: float = 0.0
    red_line_violation: bool = False
    critique_notes: str = ""


class AgentStep(BaseModel):
    """Single verifiable action in an agent execution trajectory."""

    agent_role: AgentRole
    step_index: int
    thought: str
    tool_called: Optional[str] = None
    observation: str
    autonomy_tier: AutonomyTier = AutonomyTier.A1_RECOMMENDATION
    evidence_citations: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SwarmRunRequest(BaseModel):
    """Invocation payload for Google ADK Multi-Agent Swarm."""

    scenario_prompt: str
    sector: str = "food_manufacturing"
    target_role_id: Optional[str] = "ROL-001"
    target_capability_id: Optional[str] = "CAP-001"
    evidence_ids: List[str] = Field(default_factory=list)
    horizon_years: int = Field(default=3, ge=1, le=5)


class SwarmSynthesis(BaseModel):
    """Consolidated outcome from multi-agent swarm deliberation."""

    title: str
    executive_summary: str
    human_in_the_loop_recommendation: str
    projected_human_work_pct: float
    projected_agent_work_pct: float
    reskilling_pathway: str
    compliance_verdict: str
    estimated_token_cost_usd: float
    citations: List[str]
    task_matrix: List[TaskAllocationItem] = Field(default_factory=list)
    agent_blueprints: List[AgentBlueprintSpec] = Field(default_factory=list)
    solution_dossier: Optional[BusinessSolutionDossier] = None
    adversarial_critique: Optional[str] = None
    groundedness_score: float = 1.0


class SwarmRunResponse(BaseModel):
    """Verifiable execution result including complete deliberation trajectory."""

    run_id: str
    tenant_id: str
    status: str  # COMPLETED | BLOCKED_BY_POLICY | REQUIRES_APPROVAL
    autonomy_gate: AutonomyTier
    trajectories: List[AgentStep]
    synthesis: SwarmSynthesis
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GeminiLiveDialogueRequest(BaseModel):
    """Request payload for Gemini Live Audio LLM interactive dialogue."""

    message: str = Field(min_length=1, max_length=4000)
    model: str = Field(default="models/gemini-3.8-live")
    voice_persona: str = Field(default="kore")  # "kore" | "aoede"
    reasoning_budget: Optional[int] = Field(default=None, ge=0, le=8192)
    language: str = Field(default="en")
    context_topic: Optional[str] = None


class GeminiLiveDialogueResponse(BaseModel):
    """Response schema returned by Gemini Live Audio LLM."""

    response_text: str
    model_used: str
    voice_persona: str
    reasoning_trace: Optional[str] = None
    audio_base64: Optional[str] = None
    latency_ms: float
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

