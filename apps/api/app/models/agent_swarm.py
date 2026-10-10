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
    TASK_DECOMPOSER = "TaskDecompositionAgent"
    SKILL_GAP_ANALYST = "SkillGapAgent"
    GOVERNANCE_CRITIC = "GovernanceCriticAgent"
    FINOPS_EVALUATOR = "FinOpsCostAgent"


class AgentStep(BaseModel):
    """Single verifiable action in an agent execution trajectory."""

    agent_role: AgentRole
    step_index: int
    thought: str
    tool_called: Optional[str] = None
    observation: str
    autonomy_tier: AutonomyTier = AutonomyTier.A1_RECOMMENDATION
    evidence_citations: List[str] = []
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SwarmRunRequest(BaseModel):
    """Invocation payload for Google ADK Multi-Agent Swarm."""

    scenario_prompt: str
    sector: str = "food_manufacturing"
    target_role_id: Optional[str] = "ROL-001"
    target_capability_id: Optional[str] = "CAP-001"
    evidence_ids: List[str] = []
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
