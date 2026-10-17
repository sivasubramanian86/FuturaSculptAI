"""Unit and integration tests for Vertex AI Adapter and Dynamic Prompt Orchestrator."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.adapters.vertex_adapter import (
    MODEL_REGISTRY,
    ModelTier,
    VertexAIAdapter,
    VertexContextCache,
)
from app.agents.base import AgentContext
from app.agents.prompt_orchestrator import (
    DynamicPromptOrchestrator,
)
from app.main import app
from app.models.agent_swarm import AgentRole, SwarmRunRequest

client = TestClient(app)


class DummySchema(BaseModel):
    """Test schema for structured validation."""

    raw_response: str


def test_model_registry_and_tiers():
    """Verify all model tiers are registered with expected attributes."""
    for tier in [ModelTier.WORKHORSE, ModelTier.DEEP_REASONING, ModelTier.HIGH_VOLUME_UTILITY, ModelTier.FRONTIER_WORKSPACE]:
        assert tier in MODEL_REGISTRY
        meta = MODEL_REGISTRY[tier]
        assert "primary" in meta
        assert "cost_per_1k_input" in meta
        assert "cost_per_1k_output" in meta


def test_vertex_context_cache():
    """Verify context caching hit/miss lifecycle and token savings calculation."""
    cache = VertexContextCache(ttl_seconds=1800)
    corpus = "EU AI Act 2024 Article 14 Human Oversight Mandate"

    # First call -> cache miss
    res1 = cache.get_or_create_cache("eu_ai_act", corpus)
    assert not res1["hit"]
    assert res1["cache_savings_pct"] == 0.0
    assert cache.total_misses == 1

    # Second call -> cache hit
    res2 = cache.get_or_create_cache("eu_ai_act", corpus)
    assert res2["hit"]
    assert res2["cache_savings_pct"] == 88.0
    assert cache.total_hits == 1


def test_resolve_model_name():
    """Verify model resolution for aliases, tiers, and raw identifiers."""
    adapter = VertexAIAdapter()

    assert adapter.resolve_model_name(None) == "gemini-3.8-flash"
    assert adapter.resolve_model_name("workhorse") == "gemini-3.8-flash"
    assert adapter.resolve_model_name("deep_reasoning") == "gemini-3.1-pro-preview"
    assert adapter.resolve_model_name("high_volume_utility") == "gemini-3.5-flash-lite"
    assert adapter.resolve_model_name("frontier_workspace") == "gemini-4-argon"
    assert adapter.resolve_model_name("gemini-3.8-flash-001") == "gemini-3.8-flash"
    assert adapter.resolve_model_name("gemini-3.5-flash") == "gemini-3.8-flash"
    assert adapter.resolve_model_name("gemini-2.5-flash") == "gemini-2.5-flash"
    assert adapter.resolve_model_name("custom-model-id") == "custom-model-id"


def test_calculate_cost():
    """Verify cost calculation across deep reasoning, utility, and cached tokens."""
    adapter = VertexAIAdapter()

    # Flash / workhorse
    cost1 = adapter.calculate_cost("gemini-3.8-flash", 1000, 100, cached=False)
    assert cost1 > 0

    # Pro / deep reasoning
    cost_pro = adapter.calculate_cost("gemini-3.1-pro-preview", 1000, 100, cached=False)
    assert cost_pro > cost1

    # Frontier / Argon workspace
    cost_frontier = adapter.calculate_cost("gemini-4-argon", 1000, 100, cached=False)
    assert cost_frontier > cost_pro

    # Lite / high volume utility
    cost_lite = adapter.calculate_cost("gemini-3.5-flash-lite", 1000, 100, cached=False)
    assert cost_lite < cost1

    # Cached discount
    cost_cached = adapter.calculate_cost("gemini-3.8-flash", 1000, 100, cached=True)
    assert cost_cached < cost1


@pytest.mark.asyncio
async def test_generate_text_mock_mode():
    """Verify generate_text under mock mode with and without context cache."""
    adapter = VertexAIAdapter()
    adapter.mock_mode = True

    # Without corpus
    res1 = await adapter.generate_text("Test prompt", model_name="gemini-3.8-flash")
    assert res1["model_used"] == "gemini-3.8-flash"
    assert not res1["cached_hit"]

    # With corpus
    res2 = await adapter.generate_text(
        "Test prompt",
        model_tier=ModelTier.DEEP_REASONING,
        context_corpus="Company HR Policy 2026",
    )
    assert res2["model_used"] == "gemini-3.1-pro-preview"
    assert "cache_id" in res2


@pytest.mark.asyncio
async def test_generate_text_live_http_paths():
    """Verify live HTTP execution paths, successful candidate parsing, and fallback."""
    adapter = VertexAIAdapter()
    adapter.mock_mode = False

    # 1. Successful HTTP 200 with candidates
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Synthetic response from live Vertex"}]}}]
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response

    with patch("google.auth.default", return_value=(MagicMock(valid=True, token="test-token"), None)), patch("httpx.AsyncClient") as mock_client_cls:  # noqa: S106
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        res = await adapter.generate_text("Generate plan", model_name="gemini-2.5-flash")
        assert res["content"] == "Synthetic response from live Vertex"
        assert mock_client.post.call_args.kwargs["headers"]["Authorization"] == "Bearer test-token"

    # 2. HTTP 200 with empty candidates
    mock_response_empty = MagicMock()
    mock_response_empty.status_code = 200
    mock_response_empty.json.return_value = {"candidates": []}
    mock_client.post.return_value = mock_response_empty

    with patch("google.auth.default", return_value=(MagicMock(valid=True, token="test-token"), None)), patch("httpx.AsyncClient") as mock_client_cls:  # noqa: S106
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        res = await adapter.generate_text("Generate plan", model_name="gemini-2.5-flash")
        assert res["content"] == "Generated Vertex response."

    # 3. HTTP 500 error fallback
    mock_response_500 = MagicMock()
    mock_response_500.status_code = 500
    mock_client.post.return_value = mock_response_500

    with patch("google.auth.default", return_value=(MagicMock(valid=True, token="test-token"), None)), patch("httpx.AsyncClient") as mock_client_cls:  # noqa: S106
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        res = await adapter.generate_text("Generate plan", model_name="gemini-2.5-flash")
        assert "[Live Gateway Fallback" in res["content"]

    # 4. Network exception fallback
    with patch("google.auth.default", return_value=(MagicMock(valid=True, token="test-token"), None)), patch("httpx.AsyncClient", side_effect=RuntimeError("Network unreachable")):  # noqa: S106
        res_err = await adapter.generate_text("Generate plan", model_name="gemini-2.5-flash")
        assert "[Fallback mode]" in res_err["content"]


@pytest.mark.asyncio
async def test_generate_structured_pydantic():
    """Verify structured Pydantic v2 schema generation and fallback handling."""
    adapter = VertexAIAdapter()

    # Mock mode with default mock schema
    adapter.mock_mode = True
    obj = await adapter.generate_structured("Prompt", DummySchema, model_tier=ModelTier.WORKHORSE)
    assert isinstance(obj, DummySchema)
    assert "Generated schema" in obj.raw_response

    # Mock mode with explicit payload
    obj_custom = await adapter.generate_structured(
        "Prompt",
        DummySchema,
        mock_data={"raw_response": "Custom payload"},
    )
    assert obj_custom.raw_response == "Custom payload"

    # Live mode with valid JSON in content
    adapter.mock_mode = False
    with patch.object(adapter, "generate_text", return_value={"content": json.dumps({"raw_response": "Valid JSON"})}):
        obj_live = await adapter.generate_structured("Prompt", DummySchema)
        assert obj_live.raw_response == "Valid JSON"

    # Live mode with unparseable text -> fallback to mock_data
    with patch.object(adapter, "generate_text", return_value={"content": "Not JSON!"}):
        obj_fallback = await adapter.generate_structured(
            "Prompt",
            DummySchema,
            mock_data={"raw_response": "Fallback JSON"},
        )
        assert obj_fallback.raw_response == "Fallback JSON"


def test_prompt_orchestrator_roles_and_templates():
    """Verify prompt orchestrator assigns appropriate model tiers and templates."""
    orchestrator = DynamicPromptOrchestrator()

    assert orchestrator.get_tier_for_role(AgentRole.WORKGRAPH_ARCHITECT) == ModelTier.DEEP_REASONING
    assert orchestrator.get_tier_for_role(AgentRole.FUTURE_SIGNALS) == ModelTier.HIGH_VOLUME_UTILITY
    assert orchestrator.get_tier_for_role(AgentRole.AGENT_BLUEPRINT) == ModelTier.WORKHORSE

    req = SwarmRunRequest(
        scenario_prompt="Automate packaging line with Edge-TPU",
        sector="food_manufacturing",
        horizon_years=3,
        target_role_id="ROL-001",
    )
    context = AgentContext(
        tenant_id="tenant-food-mfg-01",
        request=req,
        citations=["EVD-SOP-01"],
        step_index=1,
    )

    prompt = orchestrator.build_prompt(AgentRole.FUTURE_SIGNALS, context)
    assert "food_manufacturing" in prompt
    assert "Year 3" in prompt
    assert "EVD-SOP-01" in prompt

    # Prompt with empty citations
    context_no_cite = AgentContext(
        tenant_id="tenant-food-mfg-01",
        request=req,
        citations=[],
        step_index=1,
    )
    prompt_no_cite = orchestrator.build_prompt(AgentRole.FUTURE_SIGNALS, context_no_cite)
    assert "EVD-STRAT-01" in prompt_no_cite


@pytest.mark.asyncio
async def test_prompt_orchestrator_agent_executions():
    """Verify end-to-end execution of Scout, Decomposer, and Critic structured reasoning."""
    orchestrator = DynamicPromptOrchestrator()
    req = SwarmRunRequest(
        scenario_prompt="Automate packaging line with Edge-TPU",
        sector="food_manufacturing",
        horizon_years=3,
        target_role_id="ROL-001",
    )
    context = AgentContext(
        tenant_id="tenant-food-mfg-01",
        request=req,
        citations=["EVD-SOP-01"],
        step_index=1,
    )

    scout_res = await orchestrator.execute_scout_reasoning(context)
    assert scout_res.technology_readiness_level == 8
    assert len(scout_res.relevant_regulations) > 0

    decomposer_res = await orchestrator.execute_decomposer_reasoning(context)
    assert decomposer_res.task_count == 3
    assert decomposer_res.human_work_pct > 0

    critic_res = await orchestrator.execute_critic_reasoning(context, has_redline=False)
    assert critic_res.is_grounded
    assert critic_res.groundedness_score == 0.94

    critic_redline = await orchestrator.execute_critic_reasoning(context, has_redline=True)
    assert not critic_redline.is_grounded
    assert critic_redline.adverse_action_detected


def test_calculate_cost_gemini_live():
    """Verify inference cost calculation for Gemini Live models."""
    adapter = VertexAIAdapter()

    cost_live = adapter.calculate_cost("models/gemini-3.8-live", 1000, 100)
    assert cost_live > 0

    cost_thinking = adapter.calculate_cost("models/gemini-3.8-live-extended-thinking", 1000, 100)
    assert cost_thinking > 0
    assert cost_thinking >= cost_live


@pytest.mark.asyncio
async def test_vertex_generate_live_dialogue_all_branches():
    """Verify live dialogue synthesis across personas, extended thinking, and domain queries."""
    adapter = VertexAIAdapter(mock_mode=True)

    # 1. Extended thinking with custom reasoning budget & Aoede voice
    res_thinking = await adapter.generate_live_dialogue(
        prompt="Explain the future work style and firm growth roadmap for the next 1y, 3y, 5y, and 10y!",
        model="models/gemini-3.8-live-extended-thinking",
        voice_persona="aoede",
        reasoning_budget=4096,
        language="en",
    )
    assert res_thinking["model_used"] == "models/gemini-3.8-live-extended-thinking"
    assert res_thinking["voice_persona"] == "aoede"
    assert "4096 token budget" in res_thinking["reasoning_trace"]
    assert "1Y, 3Y, 5Y & 10Y Transformation Roadmap" in res_thinking["response_text"]
    assert res_thinking["latency_ms"] >= 18.5

    # 2. Extended thinking with default reasoning budget (None)
    res_thinking_default = await adapter.generate_live_dialogue(
        prompt="Hello generic greeting",
        model="models/gemini-3.8-live-extended-thinking",
        voice_persona="kore",
        reasoning_budget=None,
    )
    assert "2048 token budget" in res_thinking_default["reasoning_trace"]
    assert "Hello, I am Futura" in res_thinking_default["response_text"]

    # 3. 5-year-old kid explanation
    res_kid = await adapter.generate_live_dialogue(
        prompt="Explain this to a 5 year old kid",
        model="models/gemini-3.8-live",
    )
    assert "WALL-E or Baymax" in res_kid["response_text"]
    assert res_kid["reasoning_trace"] is None

    # 4. Senior 60+ worker
    res_senior = await adapter.generate_live_dialogue(
        prompt="Will a 60+ elderly or senior worker lose their job?",
        model="models/gemini-3.8-live",
    )
    assert "seniors & non-tech workers" in res_senior["response_text"]

    # 5. UPI / QR payment safety
    res_upi = await adapter.generate_live_dialogue(
        prompt="How do you protect UPI and QR payment cashiers?",
        model="models/gemini-3.8-live",
    )
    assert "UPI & QR Payments" in res_upi["response_text"]

    # 6. Uber / Ola drivers
    res_uber = await adapter.generate_live_dialogue(
        prompt="What happens to an Uber driver or taxi operator?",
        model="models/gemini-3.8-live",
    )
    assert "Uber & Ola Drivers" in res_uber["response_text"]

    # 7. Cinema / movie industry
    res_cinema = await adapter.generate_live_dialogue(
        prompt="What about the cinema movie industry?",
        model="models/gemini-3.8-live",
    )
    assert "Cinema & Movie Industry" in res_cinema["response_text"]

    # 8. Agentic RAG company intelligence
    res_rag = await adapter.generate_live_dialogue(
        prompt="Use Agentic RAG to look up company headcount and moat",
        model="models/gemini-3.8-live",
    )
    assert "Agentic RAG & MCP Company Intelligence Grounding" in res_rag["response_text"]

    # 9. Freelance / gig worker
    res_freelance = await adapter.generate_live_dialogue(
        prompt="Protection for a freelance gig worker",
        model="models/gemini-3.8-live",
    )
    assert "Freelancers" in res_freelance["response_text"]

    # 10. Business owner / industrialist ROI
    res_biz = await adapter.generate_live_dialogue(
        prompt="What is the business ROI for an industrialist owner?",
        model="models/gemini-3.8-live",
    )
    assert "Business Owners & Industrialists" in res_biz["response_text"]

    # 11. Live mode with google.genai client (success and exception fallback)
    adapter_live = VertexAIAdapter(mock_mode=False)
    with patch("google.genai.Client") as mock_client_cls:
        mock_instance = MagicMock()
        mock_instance.models.generate_content.return_value = MagicMock(
            text="Dynamic live Gemini speech response."
        )

        class MockSession:
            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass

            async def send(self, *args, **kwargs):
                pass

            async def receive(self):
                mock_part = MagicMock()
                mock_part.inline_data.data = b"\x00\x00" * 200
                mock_turn = MagicMock()
                mock_turn.parts = [mock_part]
                mock_resp = MagicMock()
                mock_resp.server_content.model_turn = mock_turn
                mock_resp.server_content.turn_complete = True
                yield mock_resp

        mock_instance.aio.live.connect.return_value = MockSession()
        mock_client_cls.return_value = mock_instance
        res_live = await adapter_live.generate_live_dialogue(
            prompt="Hello from live dialogue",
            model="models/gemini-3.8-live",
            voice_persona="kore",
        )
        assert res_live["response_text"] == "Dynamic live Gemini speech response."
        assert len(res_live["audio_base64"]) > 0

    # Exception fallback branch
    with patch("google.genai.Client", side_effect=RuntimeError("Vertex API network timeout")):
        with pytest.raises(RuntimeError, match="Gemini Live audio generation failed"):
            await adapter_live.generate_live_dialogue(
                prompt="Hello with network error",
                model="models/gemini-3.8-live",
                voice_persona="aoede",
            )


def test_api_live_dialogue_endpoint():
    """Verify POST /api/v1/agents/live-dialogue executes live dialogue with Pub/Sub telemetry."""
    # Standard model
    payload_live = {
        "message": "Explain UPI QR code payment safety for retail cashiers.",
        "model": "models/gemini-3.8-live",
        "voice_persona": "kore",
        "language": "en",
    }
    resp1 = client.post(
        "/api/v1/agents/live-dialogue",
        json=payload_live,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert "UPI & QR Payments" in data1["response_text"]
    assert data1["model_used"] == "models/gemini-3.8-live"
    assert data1["voice_persona"] == "kore"
    assert data1["latency_ms"] > 0
    assert data1["input_tokens"] > 0
    assert data1["output_tokens"] > 0
    assert data1["estimated_cost_usd"] > 0

    # Extended thinking model with custom reasoning budget
    payload_thinking = {
        "message": "Explain 1y, 3y, 5y, 10y transformation roadmap.",
        "model": "models/gemini-3.8-live-extended-thinking",
        "voice_persona": "aoede",
        "reasoning_budget": 2048,
        "language": "en",
    }
    resp2 = client.post(
        "/api/v1/agents/live-dialogue",
        json=payload_thinking,
        headers={"X-Tenant-ID": "tenant-test-01"},
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["model_used"] == "models/gemini-3.8-live-extended-thinking"
    assert data2["voice_persona"] == "aoede"
    assert "2048 token budget" in data2["reasoning_trace"]
    assert "Transformation Roadmap" in data2["response_text"]

