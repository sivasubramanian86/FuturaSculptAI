from datetime import datetime, timezone
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.adapters.pubsub_adapter import pubsub_adapter
from app.adapters.vertex_adapter import vertex_adapter
from app.agents import swarm_orchestrator
from app.core.tenant import get_current_tenant_id, get_optional_tenant_id
from app.models.agent_swarm import (
    GeminiLiveDialogueRequest,
    GeminiLiveDialogueResponse,
    SwarmRunRequest,
    SwarmRunResponse,
)

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


@router.post("/live-dialogue", response_model=GeminiLiveDialogueResponse)
async def live_audio_dialogue(
    request: GeminiLiveDialogueRequest,
    tenant_id: str = Depends(get_optional_tenant_id),
) -> GeminiLiveDialogueResponse:
    """Generate conversational response using Gemini Live models.

    Args:
        request: Target message, Gemini Live model, and voice persona.
        tenant_id: Scoped tenant identifier.

    Returns:
        GeminiLiveDialogueResponse: Live response text, model used, reasoning trace, tokens, cost.
    """
    res = await vertex_adapter.generate_live_dialogue(
        prompt=request.message,
        model=request.model,
        voice_persona=request.voice_persona,
        reasoning_budget=request.reasoning_budget,
        language=request.language,
        context_topic=request.context_topic,
    )

    pubsub_adapter.publish(
        topic_name="futurasculpt-workforce-telemetry",
        message={
            "event_type": "GEMINI_LIVE_DIALOGUE",
            "model_used": res["model_used"],
            "voice_persona": res["voice_persona"],
            "prompt_length": len(request.message),
            "response_length": len(res["response_text"]),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        attributes={"tenant_id": tenant_id, "action": "live_dialogue"},
        tenant_id=tenant_id,
    )

    return GeminiLiveDialogueResponse(
        response_text=res["response_text"],
        model_used=res["model_used"],
        voice_persona=res["voice_persona"],
        reasoning_trace=res.get("reasoning_trace"),
        audio_base64=res.get("audio_base64"),
        latency_ms=res["latency_ms"],
        input_tokens=res["input_tokens"],
        output_tokens=res["output_tokens"],
        estimated_cost_usd=res["estimated_cost_usd"],
    )


@router.post("/live-stream")
async def live_audio_stream(
    request: GeminiLiveDialogueRequest,
    tenant_id: str = Depends(get_optional_tenant_id),
) -> StreamingResponse:
    """Stream real-time Gemini Live dialogue and voice synthesis events via SSE."""
    async def event_generator():
        try:
            async for event in vertex_adapter.stream_live_dialogue_events(
                prompt=request.message,
                model=request.model,
                voice_persona=request.voice_persona,
                reasoning_budget=request.reasoning_budget,
                language=request.language,
                context_topic=request.context_topic,
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as exc:  # pragma: no cover
            yield f"data: {json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"

    pubsub_adapter.publish(
        topic_name="futurasculpt-workforce-telemetry",
        message={
            "event_type": "GEMINI_LIVE_STREAM",
            "model_used": request.model,
            "voice_persona": request.voice_persona,
            "prompt_length": len(request.message),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        attributes={"tenant_id": tenant_id, "action": "live_stream"},
        tenant_id=tenant_id,
    )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

