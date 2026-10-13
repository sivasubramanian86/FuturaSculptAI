"""Unit and integration tests for Vertex AI Adapter and Dynamic Prompt Orchestrator."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
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
from app.models.agent_swarm import AgentRole, SwarmRunRequest


class DummySchema(BaseModel):
    """Test schema for structured validation."""

    raw_response: str


def test_model_registry_and_tiers():
    """Verify all model tiers are registered with expected attributes."""
    for tier in [ModelTier.WORKHORSE, ModelTier.DEEP_REASONING, ModelTier.HIGH_VOLUME_UTILITY]:
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
    assert res1["token_savings_pct"] == 0.0
    assert cache.total_misses == 1

    # Second call -> cache hit
    res2 = cache.get_or_create_cache("eu_ai_act", corpus)
    assert res2["hit"]
    assert res2["token_savings_pct"] == 88.0
    assert cache.total_hits == 1


def test_resolve_model_name():
    """Verify model resolution for aliases, tiers, and raw identifiers."""
    adapter = VertexAIAdapter()

    assert adapter.resolve_model_name(None) == "gemini-2.5-flash"
    assert adapter.resolve_model_name("workhorse") == "gemini-2.5-flash"
    assert adapter.resolve_model_name("deep_reasoning") == "gemini-2.5-pro"
    assert adapter.resolve_model_name("high_volume_utility") == "gemini-2.5-flash-lite"
    assert adapter.resolve_model_name("gemini-3-flash") == "gemini-2.5-flash"
    assert adapter.resolve_model_name("custom-model-id") == "custom-model-id"


def test_calculate_cost():
    """Verify cost calculation across deep reasoning, utility, and cached tokens."""
    adapter = VertexAIAdapter()

    # Flash / workhorse
    cost1 = adapter.calculate_cost("gemini-2.5-flash", 1000, 100, cached=False)
    assert cost1 > 0

    # Pro / deep reasoning
    cost_pro = adapter.calculate_cost("gemini-2.5-pro", 1000, 100, cached=False)
    assert cost_pro > cost1

    # Lite / high volume utility
    cost_lite = adapter.calculate_cost("gemini-2.5-flash-lite", 1000, 100, cached=False)
    assert cost_lite < cost1

    # Cached discount
    cost_cached = adapter.calculate_cost("gemini-2.5-flash", 1000, 100, cached=True)
    assert cost_cached < cost1


@pytest.mark.asyncio
async def test_generate_text_mock_mode():
    """Verify generate_text under mock mode with and without context cache."""
    adapter = VertexAIAdapter()
    adapter.mock_mode = True

    # Without corpus
    res1 = await adapter.generate_text("Test prompt", model_name="gemini-2.5-flash")
    assert res1["model_used"] == "gemini-2.5-flash"
    assert not res1["cached_hit"]

    # With corpus
    res2 = await adapter.generate_text(
        "Test prompt",
        model_tier=ModelTier.DEEP_REASONING,
        context_corpus="Company HR Policy 2026",
    )
    assert res2["model_used"] == "gemini-2.5-pro"
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

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        res = await adapter.generate_text("Generate plan", model_name="gemini-2.5-flash")
        assert res["content"] == "Synthetic response from live Vertex"

    # 2. HTTP 200 with empty candidates
    mock_response_empty = MagicMock()
    mock_response_empty.status_code = 200
    mock_response_empty.json.return_value = {"candidates": []}
    mock_client.post.return_value = mock_response_empty

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        res = await adapter.generate_text("Generate plan", model_name="gemini-2.5-flash")
        assert res["content"] == "Generated Vertex response."

    # 3. HTTP 500 error fallback
    mock_response_500 = MagicMock()
    mock_response_500.status_code = 500
    mock_client.post.return_value = mock_response_500

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        res = await adapter.generate_text("Generate plan", model_name="gemini-2.5-flash")
        assert "[Live Gateway Fallback" in res["content"]

    # 4. Network exception fallback
    with patch("httpx.AsyncClient", side_effect=RuntimeError("Network unreachable")):
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
