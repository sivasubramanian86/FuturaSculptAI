"""Futura WorkTwin Fabric Service: Governed digital work twins & Future Boardroom."""

from datetime import datetime, timezone
import hashlib
import json
import logging
from typing import Any, Dict, List, Optional
import uuid

from app.core.exceptions import PolicyViolationException, ResourceNotFoundException
from app.models.worktwin import (
    AutonomyLevel,
    BoardroomSimulationRequest,
    BoardroomSimulationResult,
    PersonalWorkTwinConsent,
    TwinStatus,
    TwinType,
    WorkTwinManifest,
)
from app.repositories.worktwin_repository import (
    BoardroomRunRepository,
    ConsentRepository,
    InMemoryBoardroomRunRepository,
    InMemoryConsentRepository,
    InMemoryWorkTwinRepository,
    WorkTwinRepository,
    get_boardroom_run_repository,
    get_consent_repository,
    get_worktwin_repository,
)

logger = logging.getLogger("futurasculpt.worktwin_service")


class WorkTwinService:
    """Enterprise service managing WorkTwin Fabric manifests, simulations, and governance."""

    def __init__(
        self,
        twin_repo: Optional[WorkTwinRepository] = None,
        consent_repo: Optional[ConsentRepository] = None,
        boardroom_repo: Optional[BoardroomRunRepository] = None,
    ) -> None:
        """Initialize the WorkTwinService with persistent repositories and seed canonical archetypes."""
        self._twin_repo: WorkTwinRepository = twin_repo or InMemoryWorkTwinRepository()
        self._consent_repo: ConsentRepository = consent_repo or InMemoryConsentRepository()
        self._boardroom_repo: BoardroomRunRepository = boardroom_repo or InMemoryBoardroomRunRepository()
        self._seed_default_role_twins()

    @property
    def _manifests(self) -> Dict[str, WorkTwinManifest]:
        """Backward-compatible dictionary accessor for in-memory manifests."""
        if isinstance(self._twin_repo, InMemoryWorkTwinRepository):
            return self._twin_repo._store
        if hasattr(self._twin_repo, "_fallback") and isinstance(self._twin_repo._fallback, InMemoryWorkTwinRepository):
            return self._twin_repo._fallback._store
        return {}

    @property
    def _consents(self) -> Dict[str, PersonalWorkTwinConsent]:
        """Backward-compatible dictionary accessor for in-memory employee consents."""
        if isinstance(self._consent_repo, InMemoryConsentRepository):
            return {c.employee_id: c for c in self._consent_repo._store.values()}
        if hasattr(self._consent_repo, "_fallback") and isinstance(self._consent_repo._fallback, InMemoryConsentRepository):
            return {c.employee_id: c for c in self._consent_repo._fallback._store.values()}
        return {}

    def _seed_default_role_twins(self) -> None:
        """Seed 8 canonical synthetic role archetypes for enterprise manufacturing & operations."""
        canonical_archetypes = [
            {
                "id": "twin-role-quality-inspector",
                "role": "Quality Inspector Role Twin",
                "purpose": "Frontline visual inspection, sensory quality checks, and defect logging.",
                "autonomy": AutonomyLevel.WT1_ASSIST,
                "skills": ["Defect Identification", "HACCP Compliance", "Sensory Evaluation"],
                "tier": "workhorse",
            },
            {
                "id": "twin-role-plant-manager",
                "role": "Plant Manager Role Twin",
                "purpose": "Facility line scheduling, shift allocation, and operational safety.",
                "autonomy": AutonomyLevel.WT2_SIMULATE,
                "skills": ["Line Throughput", "OSHA Safety", "Capacity Planning"],
                "tier": "workhorse",
            },
            {
                "id": "twin-role-ai-quality-supervisor",
                "role": "AI Quality Supervisor Future-Role Twin",
                "purpose": "Supervises computer vision models, validates edge alerts, and audits synthetic logs.",
                "autonomy": AutonomyLevel.WT3_PREPARE,
                "skills": ["Computer Vision Triage", "Edge Telemetry Audit", "Continuous Model Validation"],
                "tier": "deep_reasoning",
            },
            {
                "id": "twin-role-cto",
                "role": "CTO Role Twin",
                "purpose": "Evaluates technology maturity, edge device integration, and architectural technical debt.",
                "autonomy": AutonomyLevel.WT2_SIMULATE,
                "skills": ["Edge TPU Cluster Architecture", "Latency Sizing", "Legacy ERP Integration"],
                "tier": "deep_reasoning",
            },
            {
                "id": "twin-role-cfo",
                "role": "CFO Role Twin",
                "purpose": "Unit economics analysis, token budget caps, and capital payback periods.",
                "autonomy": AutonomyLevel.WT2_SIMULATE,
                "skills": ["CapEx / OpEx Modeling", "Token Cost FinOps", "ROI Multiple Verification"],
                "tier": "workhorse",
            },
            {
                "id": "twin-role-chro",
                "role": "CHRO Role Twin",
                "purpose": "Workforce transition covenants, reskilling pathways, and wage protection floors.",
                "autonomy": AutonomyLevel.WT2_SIMULATE,
                "skills": ["Job Redesign", "Reskilling Curricula", "90-Day Wage Protection Covenants"],
                "tier": "workhorse",
            },
            {
                "id": "twin-role-ciso",
                "role": "CISO Role Twin",
                "purpose": "Threat modeling, SAIF boundary verification, and camera telemetry isolation.",
                "autonomy": AutonomyLevel.WT2_SIMULATE,
                "skills": ["VPC Service Controls", "Model Armor Inspection", "CFR Part 11 Audit Integrity"],
                "tier": "deep_reasoning",
            },
            {
                "id": "twin-role-employee-advocate",
                "role": "Employee Advocate Twin",
                "purpose": "Protects worker agency, ergonomic safety, cognitive load, and human dignity.",
                "autonomy": AutonomyLevel.WT2_SIMULATE,
                "skills": ["Ergonomic Assessment", "Autonomy Preservation", "Contestability Safeguards"],
                "tier": "workhorse",
            },
        ]

        now_iso = datetime.now(timezone.utc).isoformat()
        for arch in canonical_archetypes:
            manifest = WorkTwinManifest(
                twin_id=arch["id"],
                tenant_id="tenant-food-mfg-01",
                twin_type=TwinType.ROLE_TWIN,
                role_archetype=arch["role"],
                declared_purpose=arch["purpose"],
                autonomy_level=arch["autonomy"],
                status=TwinStatus.ACTIVE,
                skills=arch["skills"],
                allowed_tools=["read_evidence", "simulate_throughput", "verify_saif_boundary"],
                approved_evidence_collections=["tenant-evidence", "workforce-covenants"],
                memory_namespaces=[f"role/{arch['id']}"],
                model_tier=arch["tier"],
                cost_budget_usd=0.25,
                created_at=now_iso,
                disclosure_text=f"Synthetic Role Archetype • Represents {arch['role']} perspective, not actual human thoughts.",
            )
            self._twin_repo.save(manifest)

    def list_manifests(self, tenant_id: str = "tenant-food-mfg-01") -> List[WorkTwinManifest]:
        """List all active WorkTwin manifests for a given tenant."""
        return self._twin_repo.list(tenant_id)

    def get_manifest(self, twin_id: str, tenant_id: Optional[str] = None) -> WorkTwinManifest:
        """Get a specific WorkTwin manifest by identifier with strict tenant isolation."""
        # When tenant_id is provided, search tenant scope
        tid = tenant_id or "tenant-food-mfg-01"
        manifest = self._twin_repo.get(twin_id, tid)
        if not manifest:
            raise ResourceNotFoundException(f"WorkTwin '{twin_id}' not found in registry")
        return manifest

    def suspend_twin(self, twin_id: str, tenant_id: str) -> WorkTwinManifest:
        """Suspend an active WorkTwin manifest."""
        manifest = self.get_manifest(twin_id, tenant_id)
        manifest.status = TwinStatus.SUSPENDED
        self._twin_repo.save(manifest)
        return manifest

    def reactivate_twin(self, twin_id: str, tenant_id: str) -> WorkTwinManifest:
        """Reactivate a suspended WorkTwin manifest."""
        manifest = self.get_manifest(twin_id, tenant_id)
        manifest.status = TwinStatus.ACTIVE
        self._twin_repo.save(manifest)
        return manifest

    def revoke_twin(self, twin_id: str, tenant_id: str) -> WorkTwinManifest:
        """Permanently revoke a WorkTwin manifest and revoke associated consents."""
        manifest = self.get_manifest(twin_id, tenant_id)
        manifest.status = TwinStatus.REVOKED
        self._twin_repo.save(manifest)
        if manifest.owner_id:
            consent = self._consent_repo.get(manifest.owner_id, tenant_id)
            if consent:
                consent.revoked = True
                self._consent_repo.save(consent)
        return manifest

    def delete_twin(self, twin_id: str, tenant_id: str) -> Dict[str, Any]:
        """Delete a WorkTwin manifest from the active registry."""
        self.get_manifest(twin_id, tenant_id)
        self._twin_repo.delete(twin_id, tenant_id)
        return {"status": "DELETED", "twin_id": twin_id, "tenant_id": tenant_id}

    def export_manifest(self, twin_id: str, tenant_id: str) -> Dict[str, Any]:
        """Export a cryptographically verifiable manifest with SHA-256 integrity hash."""
        manifest = self.get_manifest(twin_id, tenant_id)
        content_bytes = json.dumps(manifest.model_dump(), sort_keys=True).encode("utf-8")
        sha256_hash = hashlib.sha256(content_bytes).hexdigest()
        return {
            "manifest": manifest.model_dump(),
            "sha256_hash": sha256_hash,
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "governance_status": "VERIFIED_TAMPER_EVIDENT_EXPORT",
        }

    def create_role_twin(
        self,
        tenant_id: str,
        role_archetype: str,
        declared_purpose: str,
        skills: List[str],
        autonomy_level: AutonomyLevel = AutonomyLevel.WT2_SIMULATE,
    ) -> WorkTwinManifest:
        """Create and register a new versioned synthetic RoleTwin archetype."""
        if autonomy_level == AutonomyLevel.WT5_CONSEQUENTIAL:
            raise PolicyViolationException("AutonomyLevel WT5_CONSEQUENTIAL is strictly prohibited for automated twins.")

        twin_id = f"twin-role-{uuid.uuid4().hex[:8]}"
        manifest = WorkTwinManifest(
            twin_id=twin_id,
            tenant_id=tenant_id,
            twin_type=TwinType.ROLE_TWIN,
            role_archetype=role_archetype,
            declared_purpose=declared_purpose,
            autonomy_level=autonomy_level,
            status=TwinStatus.ACTIVE,
            skills=skills,
            allowed_tools=["read_evidence", "simulate_throughput"],
            approved_evidence_collections=["tenant-evidence"],
            memory_namespaces=[f"role/{twin_id}"],
            created_at=datetime.now(timezone.utc).isoformat(),
            disclosure_text=f"Synthetic Role Archetype • Evaluates from {role_archetype} perspective.",
        )
        self._twin_repo.save(manifest)
        return manifest

    def register_personal_twin_consent(self, consent: PersonalWorkTwinConsent) -> WorkTwinManifest:
        """Register or update employee consent for a PersonalWorkTwin demo."""
        if consent.voice_avatar_consent:
            logger.warning("Voice/avatar replication denied per EU AI Act & MVP policy.")
            consent.voice_avatar_consent = False
        if not consent.tenant_id:
            consent.tenant_id = "tenant-food-mfg-01"

        self._consent_repo.save(consent)

        twin_id = f"twin-personal-{consent.employee_id}"
        manifest = WorkTwinManifest(
            twin_id=twin_id,
            tenant_id=consent.tenant_id or "tenant-food-mfg-01",
            twin_type=TwinType.PERSONAL_WORKTWIN,
            role_archetype=f"Personal WorkTwin ({consent.employee_id})",
            owner_id=consent.employee_id,
            declared_purpose="Employee-controlled assistant for task continuity, delegation, and learning.",
            autonomy_level=AutonomyLevel.WT1_ASSIST,
            status=TwinStatus.ACTIVE if not consent.revoked else TwinStatus.REVOKED,
            skills=["Meeting Brief Drafting", "Repetitive Task Delegation", "Skill Transition Coach"],
            allowed_tools=["read_personal_notes", "draft_brief"],
            approved_evidence_collections=["employee-approved-docs"],
            memory_namespaces=[f"employee/{consent.employee_id}"],
            created_at=datetime.now(timezone.utc).isoformat(),
            disclosure_text="Personal WorkTwin • Assistant controlled exclusively by consenting employee.",
        )
        self._twin_repo.save(manifest)
        return manifest

    def simulate_future_boardroom(self, req: BoardroomSimulationRequest) -> BoardroomSimulationResult:
        """Run multi-twin Future Boardroom simulation evaluating an enterprise transformation proposal via Google ADK."""
        from app.agents.adk_boardroom import get_adk_boardroom_agent

        result = get_adk_boardroom_agent().simulate_boardroom_sync(req)
        self._boardroom_repo.save_simulation(result)
        return result


worktwin_service = WorkTwinService(
    twin_repo=get_worktwin_repository(),
    consent_repo=get_consent_repository(),
    boardroom_repo=get_boardroom_run_repository(),
)
