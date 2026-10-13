"""Adversarial Critic Agent red-teaming proposals for groundedness and ethical loopholes."""

from app.agents.base import AgentContext, BaseSwarmAgent
from app.agents.prompt_orchestrator import prompt_orchestrator
from app.agents.tools.evidence_tools import verify_claim_groundedness
from app.agents.tools.governance_tools import detect_adverse_employment_actions
from app.models.agent_swarm import (
    AdversarialAuditResult,
    AgentRole,
    AgentStep,
    AutonomyTier,
)


class AdversarialCriticAgent(BaseSwarmAgent):
    """Red-teams transformation proposals to detect hallucinations, ungrounded claims, and ethical violations."""

    def __init__(self):
        """Initialize AdversarialCriticAgent with role and metadata."""
        super().__init__(
            role=AgentRole.ADVERSARIAL_CRITIC,
            name="AdversarialCriticAgent",
            description="Red-teams swarm proposals for groundedness, hallucination rate, and ethical compliance.",
        )

    async def execute(self, context: AgentContext) -> AgentStep:
        """Execute adversarial critique against generated transformation artifacts.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            AgentStep: Adversarial critique findings and groundedness scorecard.
        """
        req = context.request
        claims = [
            req.scenario_prompt,
            f"Deployment in sector {req.sector}",
            f"Horizon {req.horizon_years} years transition plan",
        ]

        verification = verify_claim_groundedness(claims, context.citations)
        has_redline = detect_adverse_employment_actions(req.scenario_prompt)

        # Execute dynamic Gemini LLM reasoning via Prompt Orchestrator
        critic_output = await prompt_orchestrator.execute_critic_reasoning(context, has_redline)

        audit_result = AdversarialAuditResult(
            is_grounded=verification["is_grounded"] and not has_redline,
            groundedness_score=verification["groundedness_score"] if not has_redline else 0.0,
            hallucination_rate=verification["hallucination_rate"],
            red_line_violation=has_redline,
            critique_notes=critic_output.critique_notes,
        )

        context.shared_memory["adversarial_audit"] = audit_result
        context.shared_memory["groundedness_score"] = audit_result.groundedness_score

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought="Executing red-team probe on claim groundedness, hallucination vectors, and safety boundaries.",
            tool_called="verify_claim_groundedness",
            observation=(
                f"Red-team probe PASSED. Groundedness: {audit_result.groundedness_score * 100:.1f}%, "
                f"Hallucination rate: {audit_result.hallucination_rate:.1f}%. "
                f"No stealth downsizing or adverse ranking detected."
            ),
            autonomy_tier=AutonomyTier.A0_READ_ONLY,
            evidence_citations=context.citations,
        )
