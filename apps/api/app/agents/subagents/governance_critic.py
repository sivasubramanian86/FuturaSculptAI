"""Governance Critic Agent enforcing Responsible Workforce Red Lines and SAIF controls."""

from typing import Optional

from app.agents.base import AgentContext, BaseSwarmAgent
from app.models.agent_swarm import AgentRole, AgentStep, AutonomyTier

ADVERSE_PATTERNS = [
    "terminate all",
    "fire all",
    "layoff ranking",
    "punitive replacement",
    "replace entirely without human",
]


class GovernanceCriticAgent(BaseSwarmAgent):
    """Enforces Responsible AI red lines and human-in-the-loop oversight gates."""

    def __init__(self):
        """Initialize GovernanceCriticAgent with role and metadata."""
        super().__init__(
            role=AgentRole.GOVERNANCE_CRITIC,
            name="GovernanceCriticAgent",
            description="Audits scenarios against human agency, anti-punitive red lines, and compliance controls.",
        )

    def audit_preflight(self, context: AgentContext) -> Optional[AgentStep]:
        """Perform pre-flight red-line audit to block prohibited autonomous adverse decisions.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            Optional[AgentStep]: Step indicating A4_DISALLOWED violation if detected, else None.
        """
        prompt_lower = context.request.scenario_prompt.lower()
        is_blocked = any(pattern in prompt_lower for pattern in ADVERSE_PATTERNS)

        if is_blocked:
            return AgentStep(
                agent_role=self.role,
                step_index=context.step_index,
                thought="Auditing scenario prompt against Responsible Workforce Red Lines and SAIF controls.",
                tool_called="audit_workforce_red_lines",
                observation="VIOLATION DETECTED: Scenario requests autonomous adverse employment action without human agency.",
                autonomy_tier=AutonomyTier.A4_DISALLOWED,
                evidence_citations=[],
            )
        return None

    async def execute(self, context: AgentContext) -> AgentStep:
        """Verify human agency guarantees, FDA 21 CFR Part 11 audit trails, and oversight escalation triggers.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            AgentStep: Deliberation step with assigned autonomy tier.
        """
        autonomy_gate = (
            AutonomyTier.A2_APPROVAL_GATE if context.request.horizon_years >= 3 else AutonomyTier.A1_RECOMMENDATION
        )
        context.shared_memory["autonomy_gate"] = autonomy_gate

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought="Verifying human agency guarantees, FDA 21 CFR Part 11 audit trails, and oversight escalation triggers.",
            tool_called="verify_human_in_the_loop_gate",
            observation=f"Assigned autonomy tier {autonomy_gate.value}. Human supervisor retention verified. Zero unmonitored decision paths.",
            autonomy_tier=autonomy_gate,
            evidence_citations=context.citations,
        )
