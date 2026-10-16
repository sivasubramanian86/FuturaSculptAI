"""Unit tests for multi-tenant SemanticCacheService, Eligibility Policy, and CDC invalidation."""

from app.services.semantic_cache import (
    CacheEligibilityPolicy,
    SemanticCacheService,
)


def test_cache_eligibility_policy():
    """Verify strict rules on what can and cannot be cached."""
    # Prohibited: Personal WorkTwins, consent changes, adverse scoring
    assert CacheEligibilityPolicy.is_eligible("personal_worktwin", "personal") is False
    assert CacheEligibilityPolicy.is_eligible("consent_grant", "general") is False
    assert CacheEligibilityPolicy.is_eligible("sector_definition", "general", has_personal_data=True) is False

    # Allowed: Static taxonomies, sector definitions
    assert CacheEligibilityPolicy.is_eligible("sector_definition", "general") is True
    assert CacheEligibilityPolicy.is_eligible("role_taxonomy", "general") is True


def test_semantic_cache_put_get_and_cross_tenant_isolation():
    """Verify semantic cache stores eligible data and isolates cross-tenant access."""
    cache = SemanticCacheService(default_ttl_seconds=60)
    tenant_a = "tenant-food-01"
    tenant_b = "tenant-auto-02"

    cached_data = {"summary": "Food manufacturing automation benchmarks"}
    stored = cache.put(
        tenant_id=tenant_a,
        intent="sector_definition",
        data=cached_data,
        role_scope="general",
    )
    assert stored is True

    # Same tenant retrieves entry (Hit)
    hit = cache.get(tenant_id=tenant_a, intent="sector_definition", role_scope="general")
    assert hit == cached_data
    assert cache.hits == 1

    # Cross tenant retrieval returns None (Isolated)
    miss_b = cache.get(tenant_id=tenant_b, intent="sector_definition", role_scope="general")
    assert miss_b is None

    stats = cache.get_stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1


def test_semantic_cache_cdc_invalidation():
    """Verify Pub/Sub CDC invalidation clears tenant entries."""
    cache = SemanticCacheService(default_ttl_seconds=60)
    tenant_a = "tenant-food-01"

    cache.put(tenant_a, "sector_definition", {"data": 1})
    cache.put(tenant_a, "role_taxonomy", {"data": 2})

    # Trigger CDC Invalidation
    cleared = cache.invalidate_cdc_event(
        tenant_id=tenant_a,
        event_type="EVIDENCE_MUTATED",
        affected_entity_id="EVD-FOOD-001",
    )
    assert cleared == 2
    assert cache.get(tenant_a, "sector_definition") is None


def test_semantic_cache_ineligible_and_expiry_and_reset():
    """Verify ineligible put/get rejection, TTL expiration, and reset_for_tests."""
    cache = SemanticCacheService(default_ttl_seconds=1)

    # Ineligible put returns False
    stored = cache.put("tenant-food-01", "personal_worktwin", {"secret": 123}, role_scope="personal")
    assert stored is False

    # Ineligible get returns None
    got = cache.get("tenant-food-01", "personal_worktwin", role_scope="personal")
    assert got is None

    # TTL Expiry
    cache.put("tenant-food-01", "sector_definition", {"cached": True}, ttl_seconds=-1)
    expired = cache.get("tenant-food-01", "sector_definition")
    assert expired is None

    # Tenant mismatch guard check
    cache.put("tenant-food-01", "sector_definition", {"cached": True}, ttl_seconds=60)
    key = cache.compute_cache_key("tenant-food-01", "sector_definition", "en", "general")
    # Simulate internal storage corruption/tampering
    val, exp, _, tags = cache._cache[key]
    cache._cache[key] = (val, exp, "different-tenant", tags)
    mismatch = cache.get("tenant-food-01", "sector_definition")
    assert mismatch is None

    # Reset
    cache.reset_for_tests()
    assert len(cache._cache) == 0
    assert cache.hits == 0
    assert cache.misses == 0
