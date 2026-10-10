"""Google ADK Multi-Agent Swarm API router."""

from fastapi import APIRouter, Depends, HTTPException

from app.agents import swarm_orchestrator
from app.core.tenant import get_current_tenant_id
from app.models.agent_swarm import SwarmRunRequest, SwarmRunResponse

router = APIRouter(prefix="/api/v1/agents", tags=["Agents"])


@router.post("/swarm/run", response_model=SwarmRunResponse)
async def run_agent_swarm(
    request: SwarmRunRequest,
    tenant_id: str = Depends(get_current_tenant_id),
) -> SwarmRunResponse:
    """Trigger Google ADK Multi-Agent Swarm deliberation for a transformation scenario.

    Args:
        request: Scenario prompt, sector, target roles, and evidence references.
        tenant_id: Scoped tenant identifier.

    Returns:
        SwarmRunResponse: Verifiable trajectory and synthesized strategy.
    """
    return await swarm_orchestrator.run_swarm_async(tenant_id=tenant_id, request=request)


@router.get("/swarm/runs/{run_id}", response_model=SwarmRunResponse)
def get_swarm_run(
    run_id: str,
    tenant_id: str = Depends(get_current_tenant_id),
) -> SwarmRunResponse:
    """Retrieve stored multi-agent deliberation trajectory by run ID.

    Args:
        run_id: Unique swarm run identifier.
        tenant_id: Scoped tenant identifier.

    Returns:
        SwarmRunResponse: Deliberation steps, thoughts, tools, and citations.
    """
    run = swarm_orchestrator.get_run(run_id)
    if not run or run.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail=f"Swarm run '{run_id}' not found for tenant.")
    return run
