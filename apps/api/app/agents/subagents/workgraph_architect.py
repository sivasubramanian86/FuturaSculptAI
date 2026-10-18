"""WorkGraph Architect Agent formulating topological mutations for enterprise capabilities."""

from app.agents.base import AgentContext, BaseSwarmAgent
from app.models.agent_swarm import AgentRole, AgentStep, AutonomyTier


class WorkGraphArchitectAgent(BaseSwarmAgent):
    """Mutates WorkGraph ontology nodes and edges for future-state capabilities."""

    def __init__(self):
        """Initialize WorkGraphArchitectAgent with role and metadata."""
        super().__init__(
            role=AgentRole.WORKGRAPH_ARCHITECT,
            name="WorkGraphArchitectAgent",
            description="Designs WorkGraph topological shifts across multi-year transformation horizons.",
        )

    async def execute(self, context: AgentContext) -> AgentStep:
        """Formulate structural mutations for the targeted enterprise capability.

        Args:
            context: Shared swarm deliberation context.

        Returns:
            AgentStep: Topology mutation plan and citations.
        """
        from app.agents.enterprise_profiles import resolve_enterprise_profile

        req = context.request
        profile = context.shared_memory.get("enterprise_profile") or resolve_enterprise_profile(req)
        target_cap = req.target_capability_id or profile.target_capability_id

        context.shared_memory["topology_mutation"] = {
            "target_capability": target_cap,
            "horizon_years": req.horizon_years,
            "introduced_system": f"{profile.company_name} Edge-TPU Inference Fabric",
            "introduced_agent": profile.blueprint_agent_name,
        }

        return AgentStep(
            agent_role=self.role,
            step_index=context.step_index,
            thought=f"Formulating structural mutations for {target_cap} ({profile.target_capability_name}) across Year {req.horizon_years} horizon.",
            tool_called="mutate_graph_topology",
            observation=(
                f"Mapped introduction of {profile.company_name} Edge-TPU Inference Fabric and {profile.blueprint_agent_name} "
                f"for tenant {context.tenant_id}."
            ),
            autonomy_tier=AutonomyTier.A1_RECOMMENDATION,
            evidence_citations=context.citations,
        )
