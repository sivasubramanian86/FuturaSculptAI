"""Unit tests for Enterprise 4-Tier Memory Bank."""

from app.services.memory_bank import MemoryBankService, MemoryTier


def test_memory_bank_store_and_recall_lifecycle():
    """Verify storing across working, episodic, semantic, and procedural tiers and recalling."""
    mb = MemoryBankService()
    tenant = "tenant-test-bank-01"

    # 1. Store working memory
    e_working = mb.store_memory(
        tenant_id=tenant,
        tier=MemoryTier.WORKING,
        namespace="deliberation_scratchpad",
        content={"turn": 1, "thought": "Analyzing healthcare triage bottlenecks"},
        tags=["triage", "healthcare"],
    )
    assert e_working.memory_id.startswith("MEM-WOR-")
    assert e_working.tier == MemoryTier.WORKING

    # 2. Store episodic memory
    e_episodic = mb.store_memory(
        tenant_id=tenant,
        tier=MemoryTier.EPISODIC,
        namespace="a2_sign_off_history",
        content={"run_id": "RUN-001", "decision": "APPROVED", "approver": "Dr. Sarah"},
        tags=["a2_gate", "approved"],
    )
    assert e_episodic.memory_id.startswith("MEM-EPI-")

    # 3. Store semantic memory
    e_semantic = mb.store_memory(
        tenant_id=tenant,
        tier=MemoryTier.SEMANTIC,
        namespace="eu_ai_act_standards",
        content={"article": "Article 14", "rule": "Mandatory human oversight buffer"},
        tags=["compliance", "eu_ai_act"],
    )
    assert e_semantic.tier == MemoryTier.SEMANTIC

    # 4. Store procedural memory
    e_procedural = mb.store_memory(
        tenant_id=tenant,
        tier=MemoryTier.PROCEDURAL,
        namespace="task_redesign_playbook",
        content={"recipe": "Convert clerical sorting to accelerated human-in-loop verification"},
        tags=["playbook", "accelerated"],
    )
    assert e_procedural.tier == MemoryTier.PROCEDURAL

    # 5. Recall by tier
    episodic_records = mb.recall_memory(tenant, tier=MemoryTier.EPISODIC)
    assert len(episodic_records) == 1
    assert episodic_records[0].content["approver"] == "Dr. Sarah"

    # 6. Recall by query keyword, namespace, and limit
    compliance_records = mb.recall_memory(tenant, query="Article 14", namespace="eu_ai_act_standards", limit=1)
    assert len(compliance_records) == 1
    assert compliance_records[0].namespace == "eu_ai_act_standards"

    # Query matching tags and namespace
    tag_records = mb.recall_memory(tenant, query="healthcare")
    assert len(tag_records) >= 1
    ns_query_records = mb.recall_memory(tenant, query="standards")
    assert len(ns_query_records) >= 1

    # Unmatched query returns empty
    unmatched_records = mb.recall_memory(tenant, query="nonexistent_xyz_query")
    assert len(unmatched_records) == 0

    # Mismatched namespace filter returns empty
    mismatch_ns = mb.recall_memory(tenant, namespace="nonexistent_ns")
    assert len(mismatch_ns) == 0

    # Test limit cutoff
    limited_all = mb.recall_memory(tenant, limit=2)
    assert len(limited_all) == 2

    # 7. Check stats
    stats = mb.get_memory_stats(tenant)
    assert stats["total_entries"] == 4
    assert stats["tier_distribution"]["working"] == 1
    assert stats["tier_distribution"]["episodic"] == 1

    # 8. Clear working memory
    evicted = mb.clear_working_memory(tenant)
    assert evicted == 1
    remaining_working = mb.recall_memory(tenant, tier=MemoryTier.WORKING)
    assert len(remaining_working) == 0
    assert mb.clear_working_memory("nonexistent-tenant") == 0


def test_memory_bank_empty_tenant():
    """Verify empty queries on uninitialized tenants return empty lists."""
    mb = MemoryBankService()
    assert mb.recall_memory("unknown-tenant") == []
    stats = mb.get_memory_stats("unknown-tenant")
    assert stats["total_entries"] == 0
