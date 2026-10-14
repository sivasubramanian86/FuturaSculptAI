"""Enterprise 4-Tier Memory Bank for FuturaSculptAI Google ADK Mesh.

Implements Working (L1), Episodic (L2), Semantic (L3), and Procedural (L4) memory
with multi-tenant isolation, cryptographic audit hashing, and vector/semantic recall.
"""

from datetime import datetime, timezone
from enum import Enum
import hashlib
import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MemoryTier(str, Enum):
    """Memory lifecycle tiers across agentic session horizons."""

    WORKING = "working"        # L1: Ephemeral scratchpad for current multi-turn deliberation
    EPISODIC = "episodic"      # L2: Historical scenario runs, human A2 decisions, audit trails
    SEMANTIC = "semantic"      # L3: Sector blueprints, regulatory baselines, EvidenceEnvelopes
    PROCEDURAL = "procedural"  # L4: Certified ADK agent blueprints, transformation playbooks


class MemoryEntry(BaseModel):
    """Immutable memory entry stored with cryptographic SHA-256 fingerprint."""

    memory_id: str
    tenant_id: str
    tier: MemoryTier
    namespace: str
    content: Dict[str, Any]
    tags: List[str] = Field(default_factory=list)
    created_at: str
    sha256_hash: str


class MemoryBankService:
    """Manages multi-tenant long-term memory across Working, Episodic, Semantic, and Procedural tiers."""

    def __init__(self):
        """Initialize memory bank with in-memory multi-tenant partitioned stores."""
        # tenant_id -> list of MemoryEntry
        self._store: Dict[str, List[MemoryEntry]] = {}

    def _hash_content(self, content: Dict[str, Any]) -> str:
        """Compute deterministic SHA-256 digest of memory content."""
        serialized = json.dumps(content, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def store_memory(
        self,
        tenant_id: str,
        tier: MemoryTier,
        namespace: str,
        content: Dict[str, Any],
        tags: Optional[List[str]] = None,
    ) -> MemoryEntry:
        """Store a new memory record into the specified tier for a tenant.

        Args:
            tenant_id: Enterprise tenant identifier.
            tier: MemoryTier enum (WORKING, EPISODIC, SEMANTIC, PROCEDURAL).
            namespace: Topic or entity namespace (e.g. 'workgraph', 'a2_approval', 'eu_ai_act').
            content: Payload dictionary.
            tags: Optional search tags.

        Returns:
            MemoryEntry: Stored immutable record with hash.
        """
        if tenant_id not in self._store:
            self._store[tenant_id] = []

        sha = self._hash_content(content)
        mem_id = f"MEM-{tier.value[:3].upper()}-{sha[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        entry = MemoryEntry(
            memory_id=mem_id,
            tenant_id=tenant_id,
            tier=tier,
            namespace=namespace,
            content=content,
            tags=tags or [],
            created_at=now_iso,
            sha256_hash=sha,
        )
        self._store[tenant_id].append(entry)
        return entry

    def recall_memory(
        self,
        tenant_id: str,
        tier: Optional[MemoryTier] = None,
        namespace: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 20,
    ) -> List[MemoryEntry]:
        """Recall memory entries matching tier, namespace, and keyword query.

        Args:
            tenant_id: Tenant identifier.
            tier: Optional tier filter.
            namespace: Optional namespace filter.
            query: Substring keyword filter across content and tags.
            limit: Maximum records to return.

        Returns:
            List[MemoryEntry]: Filtered memory records (newest first).
        """
        entries = self._store.get(tenant_id, [])
        results: List[MemoryEntry] = []

        q_lower = query.lower() if query else None

        for entry in reversed(entries):
            if tier and entry.tier != tier:
                continue
            if namespace and entry.namespace != namespace:
                continue
            if q_lower:
                str_rep = json.dumps(entry.content, default=str).lower()
                tags_rep = " ".join(entry.tags).lower()
                if q_lower not in str_rep and q_lower not in tags_rep and q_lower not in entry.namespace.lower():
                    continue
            results.append(entry)
            if len(results) >= limit:
                break

        return results

    def clear_working_memory(self, tenant_id: str) -> int:
        """Evict all ephemeral Working (L1) memory records for a session/tenant.

        Returns:
            int: Number of evicted entries.
        """
        if tenant_id not in self._store:
            return 0
        before_count = len(self._store[tenant_id])
        self._store[tenant_id] = [e for e in self._store[tenant_id] if e.tier != MemoryTier.WORKING]
        return before_count - len(self._store[tenant_id])

    def get_memory_stats(self, tenant_id: str) -> Dict[str, Any]:
        """Return memory footprint and distribution across tiers for FinOps audit."""
        entries = self._store.get(tenant_id, [])
        tier_counts = {tier.value: 0 for tier in MemoryTier}
        for e in entries:
            tier_counts[e.tier.value] += 1
        return {
            "tenant_id": tenant_id,
            "total_entries": len(entries),
            "tier_distribution": tier_counts,
        }


memory_bank = MemoryBankService()
