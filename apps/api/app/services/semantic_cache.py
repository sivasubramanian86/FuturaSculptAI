"""Enterprise Semantic Caching & CDC Freshness Invalidation Service.

Implements deterministic multi-tenant cache keys, strict eligibility rules,
and Pub/Sub CDC invalidation pipelines for Vertex AI token cost reduction.
"""

import hashlib
import time
from typing import Any, Dict, List, Optional, Tuple

from app.core.logging import logger


class CacheEligibilityPolicy:
    """Enforces strict enterprise governance regarding what may be cached."""

    # Never cache sensitive or dynamic contexts
    PROHIBITED_INTENTS = {
        "personal_worktwin",
        "consent_grant",
        "consent_revoke",
        "adverse_employment_scoring",
        "realtime_worker_monitoring",
        "tool_call_mutation",
    }

    # Allowed cacheable domains
    ALLOWED_INTENTS = {
        "sector_definition",
        "emerging_technology_explanation",
        "role_taxonomy",
        "static_policy_explanation",
        "ontology_query",
        "grounded_scenario_summary",
    }

    @classmethod
    def is_eligible(cls, intent: str, role_scope: str, has_personal_data: bool = False) -> bool:
        """Determine if a request is legally and architecturally eligible for semantic caching.

        Args:
            intent: Categorized prompt intent.
            role_scope: Role scope under evaluation.
            has_personal_data: Flag indicating whether personal data is present.

        Returns:
            bool: True if safe and approved to cache.
        """
        if has_personal_data:
            return False
        if role_scope.lower() in {"personal", "personal_worktwin"}:
            return False
        if intent.lower() in cls.PROHIBITED_INTENTS:
            return False
        return intent.lower() in cls.ALLOWED_INTENTS


class SemanticCacheService:
    """Multi-tenant Semantic Cache with Memorystore Redis pattern and CDC invalidation."""

    def __init__(self, default_ttl_seconds: int = 3600):
        """Initialize semantic cache in-memory dictionary with TTL metadata."""
        # Key: cache_key -> (data: Dict[str, Any], expiry: float, tenant_id: str, tags: List[str])
        self._cache: Dict[str, Tuple[Dict[str, Any], float, str, List[str]]] = {}
        self.default_ttl = default_ttl_seconds
        self.hits = 0
        self.misses = 0

    def compute_cache_key(
        self,
        tenant_id: str,
        normalized_intent: str,
        locale: str = "en",
        role_scope: str = "general",
        policy_version: str = "v1.0",
        evidence_version_vector: str = "evd-2026-q4",
        prompt_recipe_version: str = "recipe-0.2.0",
        model_family: str = "gemini-2.5",
    ) -> str:
        """Derive cryptographic multi-tenant cache key.

        Args:
            tenant_id: Isolated tenant scope.
            normalized_intent: Canonicalized query intent.
            locale: Language locale (e.g. en, hi, ta).
            role_scope: Role classification.
            policy_version: Governance policy version.
            evidence_version_vector: Evidence ledger state hash.
            prompt_recipe_version: Prompt template version.
            model_family: Underlying model architecture.

        Returns:
            str: SHA-256 hash representing canonical cache identity.
        """
        payload = f"{tenant_id}|{normalized_intent}|{locale}|{role_scope}|{policy_version}|{evidence_version_vector}|{prompt_recipe_version}|{model_family}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def get(
        self,
        tenant_id: str,
        intent: str,
        role_scope: str = "general",
        locale: str = "en",
    ) -> Optional[Dict[str, Any]]:
        """Retrieve cached entry if eligible, present, and non-expired."""
        if not CacheEligibilityPolicy.is_eligible(intent, role_scope):
            return None

        key = self.compute_cache_key(tenant_id, intent, locale, role_scope)
        entry = self._cache.get(key)
        if not entry:
            self.misses += 1
            return None

        data, expiry, stored_tenant, _tags = entry
        # Enforce strict cross-tenant isolation
        if stored_tenant != tenant_id:
            logger.error("CROSS_TENANT_LEAKAGE_PREVENTED: Key %s tenant mismatch", key)
            return None

        if time.time() > expiry:
            del self._cache[key]
            self.misses += 1
            return None

        self.hits += 1
        return data

    def put(
        self,
        tenant_id: str,
        intent: str,
        data: Dict[str, Any],
        role_scope: str = "general",
        locale: str = "en",
        tags: Optional[List[str]] = None,
        ttl_seconds: Optional[int] = None,
    ) -> bool:
        """Store an eligible response in cache with TTL and tenant isolation."""
        if not CacheEligibilityPolicy.is_eligible(intent, role_scope):
            logger.info("Semantic cache skipped: intent '%s' is not cache-eligible", intent)
            return False

        key = self.compute_cache_key(tenant_id, intent, locale, role_scope)
        ttl = ttl_seconds or self.default_ttl
        expiry = time.time() + ttl
        self._cache[key] = (data, expiry, tenant_id, tags or [intent])
        return True

    def invalidate_cdc_event(
        self,
        tenant_id: str,
        event_type: str,
        affected_entity_id: str,
    ) -> int:
        """Invalidate cache entries in response to Pub/Sub Change-Data-Capture (CDC) events.

        Triggered when evidence is updated, revoked, or a manifest changes.

        Args:
            tenant_id: Target tenant ID.
            event_type: CDC event name (e.g. EVIDENCE_MUTATED, MANIFEST_UPDATED).
            affected_entity_id: Identifier of the changed resource.

        Returns:
            int: Number of invalidated cache entries.
        """
        logger.info(
            "CDC Invalidation triggered: %s for entity %s (tenant %s)",
            event_type,
            affected_entity_id,
            tenant_id,
        )
        keys_to_remove = [
            k for k, (_val, _exp, tid, _tags) in self._cache.items()
            if tid == tenant_id
        ]
        for k in keys_to_remove:
            del self._cache[k]
        return len(keys_to_remove)

    def get_stats(self) -> Dict[str, Any]:
        """Export FinOps cache efficiency metrics."""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100.0) if total > 0 else 0.0
        return {
            "total_entries": len(self._cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_pct": round(hit_rate, 2),
            "estimated_token_cost_savings_usd": round(self.hits * 0.0042, 4),
        }

    def reset_for_tests(self) -> None:
        """Clear cache for test isolation."""
        self._cache.clear()
        self.hits = 0
        self.misses = 0


# Singleton Instance
semantic_cache = SemanticCacheService()
