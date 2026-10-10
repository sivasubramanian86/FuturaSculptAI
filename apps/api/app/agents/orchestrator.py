"""Google ADK Multi-Agent Swarm Orchestrator with Parallel Sub-Agent Execution and A0-A4 Gates."""

import asyncio
import concurrent.futures
import uuid
from typing import Dict, List, Optional

from app.agents.base import AgentContext
from app.agents.subagents.finops_evaluator import FinOpsEvaluatorAgent
from app.agents.subagents.governance_critic import GovernanceCriticAgent
from app.agents.subagents.skill_gap_analyst import SkillGapAnalystAgent
from app.agents.subagents.task_decomposer import TaskDecomposerAgent
from app.agents.subagents.workgraph_architect import WorkGraphArchitectAgent
from app.models.agent_swarm import (
    AgentRole,
    AgentStep,
    AutonomyTier,
    SwarmRunRequest,
    SwarmRunResponse,
    SwarmSynthesis,
)

# In-memory store for multi-tenant swarm runs
_SWARM_RUNS: Dict[str, SwarmRunResponse] = {}


class SwarmOrchestrator:
    """Supervises and coordinates specialist Google ADK agents with parallel execution."""

    def __init__(self):
        """Initialize SwarmOrchestrator and instantiate specialist Google ADK sub-agents."""
        self.architect = WorkGraphArchitectAgent()
        self.decomposer = TaskDecomposerAgent()
        self.skill_analyst = SkillGapAnalystAgent()
        self.governance_critic = GovernanceCriticAgent()
        self.finops = FinOpsEvaluatorAgent()

    async def run_swarm_async(self, tenant_id: str, request: SwarmRunRequest) -> SwarmRunResponse:
        """Execute the multi-agent deliberation loop over a strategic scenario asynchronously.

        Coordinates sequential architectural framing followed by parallel sub-agent analysis
        and governance gate verification.

        Args:
            tenant_id: Tenant identifier.
            request: SwarmRunRequest specifying scenario prompt, horizon, and target roles.

        Returns:
            SwarmRunResponse: Execution outcome with complete deliberation trajectory.
        """
        run_id = f"RUN-{uuid.uuid4().hex[:10].upper()}"
        trajectories: List[AgentStep] = []
        citations = request.evidence_ids if request.evidence_ids else ["EVD-STRAT-01", "EVD-SOP-01"]

        base_context = AgentContext(
            tenant_id=tenant_id,
            request=request,
            citations=citations,
            step_index=1,
            shared_memory={},
        )

        # 1. Orchestrator Step: Framing and Seed Graph Hydration
        trajectories.append(
            AgentStep(
                agent_role=AgentRole.ORCHESTRATOR,
                step_index=1,
                thought=(
                    f"Decomposing organizational transformation request for {request.sector} "
                    f"over horizon {request.horizon_years} years."
                ),
                tool_called="hydrate_temporal_workgraph",
                observation=(
                    f"Active seed graph loaded for tenant {tenant_id}. "
                    f"Identified target role {request.target_role_id} and capability {request.target_capability_id}."
                ),
                autonomy_tier=AutonomyTier.A0_READ_ONLY,
                evidence_citations=citations,
            )
        )

        # 2. Responsible AI Governance Pre-Flight Check (Red-line interceptor)
        gov_preflight_context = AgentContext(
            tenant_id=tenant_id,
            request=request,
            citations=citations,
            step_index=2,
            shared_memory=base_context.shared_memory,
        )
        preflight_violation = self.governance_critic.audit_preflight(gov_preflight_context)

        if preflight_violation:
            trajectories.append(preflight_violation)
            synthesis = SwarmSynthesis(
                title="Halted by Governance Critic (Red Line Breach)",
                executive_summary=(
                    "Swarm deliberation terminated. The proposed scenario breaches the enterprise "
                    "ethical contract prohibiting autonomous termination."
                ),
                human_in_the_loop_recommendation="Human HR & Ethics board mandatory intervention required.",
                projected_human_work_pct=100.0,
                projected_agent_work_pct=0.0,
                reskilling_pathway="Halted: Review Responsible Workforce guidelines.",
                compliance_verdict="REJECTED_A4_BREACH",
                estimated_token_cost_usd=0.00001,
                citations=[],
            )

            response = SwarmRunResponse(
                run_id=run_id,
                tenant_id=tenant_id,
                status="BLOCKED_BY_POLICY",
                autonomy_gate=AutonomyTier.A4_DISALLOWED,
                trajectories=trajectories,
                synthesis=synthesis,
            )
            _SWARM_RUNS[run_id] = response
            return response

        # 3. WorkGraph Architect Step
        architect_context = AgentContext(
            tenant_id=tenant_id,
            request=request,
            citations=citations,
            step_index=2,
            shared_memory=base_context.shared_memory,
        )
        architect_step = await self.architect.execute(architect_context)
        trajectories.append(architect_step)

        # 4. Parallel Sub-Agent Execution (Task Decomposition + Skill Gap + FinOps)
        task_ctx = AgentContext(
            tenant_id=tenant_id,
            request=request,
            citations=citations,
            step_index=3,
            shared_memory=base_context.shared_memory,
        )
        skill_ctx = AgentContext(
            tenant_id=tenant_id,
            request=request,
            citations=citations,
            step_index=4,
            shared_memory=base_context.shared_memory,
        )
        finops_ctx = AgentContext(
            tenant_id=tenant_id,
            request=request,
            citations=citations,
            step_index=6,
            shared_memory=base_context.shared_memory,
        )

        task_step, skill_step, finops_step = await asyncio.gather(
            self.decomposer.execute(task_ctx),
            self.skill_analyst.execute(skill_ctx),
            self.finops.execute(finops_ctx),
        )

        trajectories.append(task_step)
        trajectories.append(skill_step)

        # 5. Governance Critic Verification Step (Post-deliberation HITL gate)
        gov_post_ctx = AgentContext(
            tenant_id=tenant_id,
            request=request,
            citations=citations,
            step_index=5,
            shared_memory=base_context.shared_memory,
        )
        gov_step = await self.governance_critic.execute(gov_post_ctx)
        trajectories.append(gov_step)

        # 6. FinOps Evaluator Step appended
        trajectories.append(finops_step)

        # Synthesis construction
        human_work_pct = base_context.shared_memory.get("human_work_pct", 50.0)
        agent_work_pct = base_context.shared_memory.get("agent_work_pct", 50.0)
        autonomy_gate = base_context.shared_memory.get("autonomy_gate", AutonomyTier.A1_RECOMMENDATION)
        token_cost = base_context.shared_memory.get("token_cost_usd", 0.0009)
        reskilling = base_context.shared_memory.get(
            "reskilling_pathway",
            "ROL-001 Inspector -> ROL-003 AI Automation Supervisor (6-week certified module).",
        )

        status = "REQUIRES_APPROVAL" if autonomy_gate == AutonomyTier.A2_APPROVAL_GATE else "COMPLETED"

        synthesis = SwarmSynthesis(
            title=f"Enterprise Work Transformation: Horizon Year {request.horizon_years}",
            executive_summary=(
                f"Multi-agent swarm synthesized hybrid augmentation strategy for {request.sector}. "
                f"Routine task allocation transitions to {agent_work_pct:.1f}% autonomous agent triage while "
                f"upskilling operators to supervisory roles with {human_work_pct:.1f}% agency retention."
            ),
            human_in_the_loop_recommendation="Empower operators with Edge-TPU anomaly adjudication cockpits with explicit fallback stop-buttons.",
            projected_human_work_pct=human_work_pct,
            projected_agent_work_pct=agent_work_pct,
            reskilling_pathway=reskilling,
            compliance_verdict="PASSED_SAIF_CONTROLS",
            estimated_token_cost_usd=round(token_cost, 5),
            citations=citations,
        )

        response = SwarmRunResponse(
            run_id=run_id,
            tenant_id=tenant_id,
            status=status,
            autonomy_gate=autonomy_gate,
            trajectories=trajectories,
            synthesis=synthesis,
        )

        _SWARM_RUNS[run_id] = response
        return response

    def run_swarm(self, tenant_id: str, request: SwarmRunRequest) -> SwarmRunResponse:
        """Synchronous bridge for multi-agent swarm execution.

        Args:
            tenant_id: Tenant identifier.
            request: SwarmRunRequest specifying scenario parameters.

        Returns:
            SwarmRunResponse: Verifiable swarm execution outcome.
        """
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(asyncio.run, self.run_swarm_async(tenant_id, request)).result()
        else:
            return asyncio.run(self.run_swarm_async(tenant_id, request))

    def get_run(self, run_id: str) -> Optional[SwarmRunResponse]:
        """Retrieve stored multi-agent deliberation run.

        Args:
            run_id: Unique swarm run identifier.

        Returns:
            Optional[SwarmRunResponse]: Swarm response or None if not found.
        """
        return _SWARM_RUNS.get(run_id)


swarm_orchestrator = SwarmOrchestrator()
