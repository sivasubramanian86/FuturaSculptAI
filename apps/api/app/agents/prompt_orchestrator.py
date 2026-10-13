"""Dynamic Prompt Orchestrator and Pydantic v2 Structured Output Engine for Google ADK Mesh."""

from typing import List
from pydantic import BaseModel, Field

from app.adapters.vertex_adapter import ModelTier, vertex_adapter
from app.agents.base import AgentContext
from app.models.agent_swarm import AgentRole


# -----------------------------------------------------------------------------
# Pydantic v2 Structured Schemas for Agent Swarm Outputs
# -----------------------------------------------------------------------------

class ScoutStructuredOutput(BaseModel):
    """Structured observation produced by Future Signals Scout Agent."""

    technology_readiness_level: int = Field(ge=1, le=9)
    relevant_regulations: List[str]
    sector_adoption_velocity: str
    observation_summary: str


class DecomposerStructuredOutput(BaseModel):
    """Structured work allocation produced by Task Decomposer / Redesign Agent."""

    human_work_pct: float = Field(ge=0.0, le=100.0)
    agent_work_pct: float = Field(ge=0.0, le=100.0)
    task_count: int
    rationale: str


class MobilityStructuredOutput(BaseModel):
    """Structured reskilling pathway produced by Skills Mobility Advisor Agent."""

    source_role: str
    target_role: str
    training_duration_weeks: int
    required_credentials: List[str]
    transition_difficulty: str


class FinOpsStructuredOutput(BaseModel):
    """Structured financial and token audit produced by FinOps Budget Agent."""

    token_cost_usd: float
    context_cache_hit_rate_pct: float
    annual_savings_usd: float
    roi_multiple: float
    carbon_offset_kg: float


class GovernanceStructuredOutput(BaseModel):
    """Structured safety evaluation produced by Trust & Governance Critic Agent."""

    autonomy_tier: str
    human_in_loop_guarantee: bool
    saif_verdict: str
    red_line_passed: bool


class CriticStructuredOutput(BaseModel):
    """Structured adversarial critique produced by Adversarial Critic Agent."""

    is_grounded: bool
    groundedness_score: float = Field(ge=0.0, le=1.0)
    hallucination_rate_pct: float = Field(ge=0.0, le=100.0)
    adverse_action_detected: bool
    critique_notes: str


# -----------------------------------------------------------------------------
# Dynamic Prompt Orchestrator
# -----------------------------------------------------------------------------

REGULATORY_CORPUS_BASELINE = """
[REGULATORY CORPUS & WORKFORCE SAFEGUARDS]
1. EU AI Act High-Risk Standard (Regulation 2024/1689): Mandatory human oversight and auditability.
2. Responsible Workforce Red-Line: Zero autonomous terminations or punitive adverse employment actions.
3. 90-Day Salary Escrow Guarantee: Worker wages guaranteed during autonomous automation pilots.
4. Google SAIF (Secure AI Framework): Multi-tenant cryptographic isolation and DLP tokenization.
5. Differential Privacy: Minimum k-anonymity (k >= 10) on all workforce telemetry.
"""


class DynamicPromptOrchestrator:
    """Orchestrates dynamic prompt templating, model tier assignment, and structured schema generation."""

    def __init__(self):
        """Initialize Prompt Orchestrator with reference to Vertex adapter."""
        self.adapter = vertex_adapter

    def get_tier_for_role(self, role: AgentRole) -> ModelTier:
        """Assign target Gemini model tier based on cognitive complexity of agent role.

        Args:
            role: AgentRole enum.

        Returns:
            ModelTier: Assigned Gemini tier.
        """
        deep_reasoning_roles = {
            AgentRole.WORKGRAPH_ARCHITECT,
            AgentRole.TASK_REDESIGN,
            AgentRole.BUSINESS_SOLUTION,
            AgentRole.ADVERSARIAL_CRITIC,
            AgentRole.TRUST_GOVERNANCE,
        }
        utility_roles = {
            AgentRole.FUTURE_SIGNALS,
            AgentRole.FINOPS,
        }

        if role in deep_reasoning_roles:
            return ModelTier.DEEP_REASONING
        if role in utility_roles:
            return ModelTier.HIGH_VOLUME_UTILITY
        return ModelTier.WORKHORSE

    def build_prompt(self, role: AgentRole, context: AgentContext) -> str:
        """Construct context-aware dynamic prompt for specialist agent.

        Args:
            role: The target agent role.
            context: Execution context containing scenario, sector, horizon, and citations.

        Returns:
            str: Compiled dynamic prompt with parameter injection and regulatory grounding.
        """
        req = context.request
        sector = req.sector or "food_manufacturing"
        horizon = req.horizon_years
        target_role = req.target_role_id or "ROL-001"
        citations = ", ".join(context.citations) if context.citations else "EVD-STRAT-01"

        base_prompt = (
            f"You are the specialist {role.value} operating in the Google ADK Workforce Evolution Mesh.\n"
            f"Target Sector: {sector}\n"
            f"Strategic Horizon: Year {horizon}\n"
            f"Target Role: {target_role}\n"
            f"Scenario Directive: {req.scenario_prompt}\n"
            f"Grounding Citations: {citations}\n"
            f"Tenant ID: {context.tenant_id}\n\n"
            f"Mandatory Principles:\n"
            f"- Strictly observe the Responsible Workforce anti-hallucination covenant.\n"
            f"- Respect human agency and never propose unconstrained adverse workforce decisions.\n"
            f"- Cite verifiable evidence tokens in all analytical claims.\n"
        )
        return base_prompt

    async def execute_scout_reasoning(self, context: AgentContext) -> ScoutStructuredOutput:
        """Execute Future Signals Scout Agent with dynamic prompt and high-volume utility tier."""
        prompt = self.build_prompt(AgentRole.FUTURE_SIGNALS, context)
        horizon = context.request.horizon_years
        mock_payload = {
            "technology_readiness_level": 8 if horizon >= 3 else 7,
            "relevant_regulations": ["EU AI Act High-Risk Standard", "FDA 21 CFR Part 11 Audit Trail"],
            "sector_adoption_velocity": "Accelerated (CAGR 34.2%)",
            "observation_summary": f"Identified mature Edge-TPU vision telemetry for Year {horizon} transformation.",
        }
        return await self.adapter.generate_structured(
            prompt,
            ScoutStructuredOutput,
            model_tier=ModelTier.HIGH_VOLUME_UTILITY,
            mock_data=mock_payload,
        )

    async def execute_decomposer_reasoning(self, context: AgentContext) -> DecomposerStructuredOutput:
        """Execute Task Decomposer Agent with dynamic prompt and deep reasoning flagship tier."""
        prompt = self.build_prompt(AgentRole.TASK_REDESIGN, context)
        horizon = context.request.horizon_years
        human_work_pct = 100.0 - min(80.0, float(horizon) * 26.0)
        agent_work_pct = 100.0 - human_work_pct
        mock_payload = {
            "human_work_pct": human_work_pct,
            "agent_work_pct": agent_work_pct,
            "task_count": 3,
            "rationale": "Repetitive screening automated while retaining human supervisory adjudication.",
        }
        return await self.adapter.generate_structured(
            prompt,
            DecomposerStructuredOutput,
            model_tier=ModelTier.DEEP_REASONING,
            mock_data=mock_payload,
        )

    async def execute_critic_reasoning(self, context: AgentContext, has_redline: bool) -> CriticStructuredOutput:
        """Execute Adversarial Critic Agent with dynamic prompt and deep reasoning flagship tier."""
        prompt = self.build_prompt(AgentRole.ADVERSARIAL_CRITIC, context)
        mock_payload = {
            "is_grounded": not has_redline,
            "groundedness_score": 0.94 if not has_redline else 0.0,
            "hallucination_rate_pct": 2.1 if not has_redline else 98.5,
            "adverse_action_detected": has_redline,
            "critique_notes": (
                "Zero unsupported claims detected. Evidence lineage verified."
                if not has_redline
                else "CRITICAL RED-LINE BREACH: Prohibited adverse action."
            ),
        }
        return await self.adapter.generate_structured(
            prompt,
            CriticStructuredOutput,
            model_tier=ModelTier.DEEP_REASONING,
            mock_data=mock_payload,
        )


prompt_orchestrator = DynamicPromptOrchestrator()
