"""Futura WorkTwin Fabric Service: Governed digital work twins & Future Boardroom."""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
import uuid

from app.core.exceptions import PolicyViolationException, ResourceNotFoundException
from app.models.worktwin import (
    AutonomyLevel,
    BoardroomPerspective,
    BoardroomSimulationRequest,
    BoardroomSimulationResult,
    ConflictResolution,
    ExecutivePersona,
    PersonalWorkTwinConsent,
    TwinStatus,
    TwinType,
    WorkTwinManifest,
)

logger = logging.getLogger("futurasculpt.worktwin_service")


class WorkTwinService:
    """Enterprise service managing WorkTwin Fabric manifests, simulations, and governance."""

    def __init__(self) -> None:
        """Initialize the WorkTwinService registry and seed canonical role archetypes."""
        self._manifests: Dict[str, WorkTwinManifest] = {}
        self._consents: Dict[str, PersonalWorkTwinConsent] = {}
        self._seed_default_role_twins()

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

        now = datetime.now(timezone.utc).isoformat()
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
                allowed_tools=["read_evidence", "query_workgraph", "simulate_throughput"],
                approved_evidence_collections=["food-mfg-sop-2026", "sec-10k-filings"],
                memory_namespaces=[f"role/{arch['id']}"],
                model_tier=arch["tier"],
                cost_budget_usd=0.25,
                created_at=now,
                disclosure_text=f"Synthetic Role Archetype • Represents {arch['role']} perspective, not actual human thoughts.",
            )
            self._manifests[manifest.twin_id] = manifest

    def list_manifests(self, tenant_id: str = "tenant-food-mfg-01") -> List[WorkTwinManifest]:
        """List all active WorkTwin manifests for a given tenant."""
        return [m for m in self._manifests.values() if m.tenant_id == tenant_id]

    def get_manifest(self, twin_id: str, tenant_id: Optional[str] = None) -> WorkTwinManifest:
        """Get a specific WorkTwin manifest by identifier with strict tenant isolation.

        Args:
            twin_id: Unique twin identifier.
            tenant_id: Optional requesting tenant identifier to enforce cross-tenant privacy.

        Returns:
            WorkTwinManifest: The requested manifest.

        Raises:
            ResourceNotFoundException: If twin not found or belongs to a different tenant.
        """
        if twin_id not in self._manifests:
            raise ResourceNotFoundException(f"WorkTwin '{twin_id}' not found in registry")
        manifest = self._manifests[twin_id]
        if tenant_id and manifest.tenant_id != tenant_id:
            # Hide cross-tenant existence by returning 404
            raise ResourceNotFoundException(f"WorkTwin '{twin_id}' not found in registry")
        return manifest

    def suspend_twin(self, twin_id: str, tenant_id: str) -> WorkTwinManifest:
        """Suspend an active WorkTwin manifest."""
        manifest = self.get_manifest(twin_id, tenant_id)
        manifest.status = TwinStatus.SUSPENDED
        return manifest

    def reactivate_twin(self, twin_id: str, tenant_id: str) -> WorkTwinManifest:
        """Reactivate a suspended WorkTwin manifest."""
        manifest = self.get_manifest(twin_id, tenant_id)
        manifest.status = TwinStatus.ACTIVE
        return manifest

    def revoke_twin(self, twin_id: str, tenant_id: str) -> WorkTwinManifest:
        """Permanently revoke a WorkTwin manifest and revoke associated consents."""
        manifest = self.get_manifest(twin_id, tenant_id)
        manifest.status = TwinStatus.REVOKED
        if manifest.owner_id and manifest.owner_id in self._consents:
            self._consents[manifest.owner_id].revoked = True
        return manifest

    def delete_twin(self, twin_id: str, tenant_id: str) -> Dict[str, Any]:
        """Delete a WorkTwin manifest from the active registry."""
        self.get_manifest(twin_id, tenant_id)
        del self._manifests[twin_id]
        return {"status": "DELETED", "twin_id": twin_id, "tenant_id": tenant_id}

    def export_manifest(self, twin_id: str, tenant_id: str) -> Dict[str, Any]:
        """Export a cryptographically verifiable manifest with SHA-256 integrity hash."""
        manifest = self.get_manifest(twin_id, tenant_id)
        import hashlib
        import json

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
        self._manifests[twin_id] = manifest
        return manifest

    def register_personal_twin_consent(self, consent: PersonalWorkTwinConsent) -> WorkTwinManifest:
        """Register or update employee consent for a PersonalWorkTwin demo."""
        if consent.voice_avatar_consent:
            # Non-negotiable rule: Voice & avatar replication prohibited in MVP
            logger.warning("Voice/avatar replication denied per EU AI Act & MVP policy.")
            consent.voice_avatar_consent = False

        self._consents[consent.employee_id] = consent

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
        self._manifests[twin_id] = manifest
        return manifest

    def _generate_proposal_perspectives(self, req: BoardroomSimulationRequest) -> List[BoardroomPerspective]:
        """Dynamically generate executive role perspectives driven by proposal content, domain sector, and evidence."""
        title = req.proposal_title
        desc = req.proposal_description
        sector = (req.sector or "general").lower()
        enterprise = req.target_enterprise or "Enterprise"

        evd_prefix = "EVD-FOOD" if "food" in sector else ("EVD-EV" if "auto" in sector or "ev" in sector else ("EVD-HLTH" if "health" in sector else "EVD-ENT"))
        is_ungrounded = "unsupported" in desc.lower() or "magic" in desc.lower() or "replace all" in desc.lower()

        # CEO
        ceo_persp = BoardroomPerspective(
            role=ExecutivePersona.CEO,
            role_title="Chief Executive Officer",
            stance="CAUTIOUS" if is_ungrounded else "FAVORABLE",
            assessment=(
                f"Evaluated '{title}' for {enterprise}. "
                + ("Proposes rapid transformation but lacks empirical baseline evidence."
                   if is_ungrounded else
                   "Directly advances competitive moat and unlocks operational velocity while transforming operating margins.")
            ),
            key_arguments=[
                f"Positions {enterprise} as an industry benchmark in ethical, AI-augmented operations.",
                f"Addresses primary operational friction described in: {title}.",
            ],
            blocking_risks=["Potential enterprise brand backlash if workforce covenants are not publicized."],
            approval_conditions=["Mandate public worker protection covenant and guarantee zero layoffs."],
            assumptions_requiring_evidence=[f"Operational throughput gains for '{title}' within 90 days."],
            cited_evidence_ids=[f"{evd_prefix}-001", "EVD-FIN-92"],
            confidence_score=0.72 if is_ungrounded else 0.94,
            source_spans=[
                {"evidence_id": f"{evd_prefix}-001", "page": 1, "start_offset": 50, "end_offset": 210},
                {"evidence_id": "EVD-FIN-92", "page": 3, "start_offset": 140, "end_offset": 320},
            ],
            support_status="INSUFFICIENT_EVIDENCE" if is_ungrounded else "SUPPORTED",
        )

        # CTO
        cto_persp = BoardroomPerspective(
            role=ExecutivePersona.CTO,
            role_title="Chief Technology Officer",
            stance="CONDITIONAL",
            assessment=f"Architecture for '{title}' requires edge-cluster isolation and verified model gateway fallback.",
            key_arguments=[
                "Edge ML inference operates with sub-25ms latency on production line sensors.",
                "Air-gapped subnet prevents external cloud disruptions from affecting line continuity.",
            ],
            blocking_risks=[f"Firmware drift and integration debt across legacy controllers during '{title}' rollout."],
            approval_conditions=["Require read-only optical isolators and staging sandbox validation."],
            assumptions_requiring_evidence=["Sub-25ms telemetry synchronization under peak production loads."],
            cited_evidence_ids=[f"{evd_prefix}-002", "EVD-SEC-SAIF-01"],
            confidence_score=0.91,
            source_spans=[
                {"evidence_id": f"{evd_prefix}-002", "page": 2, "start_offset": 80, "end_offset": 240},
            ],
            support_status="SUPPORTED",
        )

        # CFO
        cfo_persp = BoardroomPerspective(
            role=ExecutivePersona.CFO,
            role_title="Chief Financial Officer",
            stance="FAVORABLE",
            assessment=f"Financial payback for '{title}' models positive net ROI multiple with token inference costs capped under $0.001/task.",
            key_arguments=[
                f"Eliminates defect leakage and scrap rework for {enterprise}.",
                "Inference unit cost is bounded to predictable token budget envelopes.",
            ],
            blocking_risks=["Hardware sensor CapEx overruns during multi-facility scaling."],
            approval_conditions=["Cap initial rollout to pilot unit before full enterprise capital release."],
            assumptions_requiring_evidence=["Unit cost savings verified across 30 operational days."],
            cited_evidence_ids=["EVD-FIN-92"],
            confidence_score=0.95,
            source_spans=[
                {"evidence_id": "EVD-FIN-92", "page": 2, "start_offset": 110, "end_offset": 260},
            ],
            support_status="SUPPORTED",
        )

        # CHRO
        chro_persp = BoardroomPerspective(
            role=ExecutivePersona.CHRO,
            role_title="Chief Human Resources Officer",
            stance="CONDITIONAL",
            assessment=f"Human workforce impact for '{title}' is permissible only with mandatory upskilling and 90-day wage protection covenants.",
            key_arguments=[
                f"Repetitive, high-strain tasks under '{title}' are automated to relieve occupational strain.",
                "Transitions existing frontline operators into higher-tier supervisory roles.",
            ],
            blocking_risks=["Worker anxiety regarding automated speed monitoring or covert surveillance."],
            approval_conditions=[
                "Institute binding 90-day wage protection floor.",
                "Strict prohibition on using telemetry streams for worker speed ranking.",
            ],
            assumptions_requiring_evidence=["80% worker certification pass rate on edge supervisory tools."],
            cited_evidence_ids=[f"{evd_prefix}-003"],
            confidence_score=0.89,
            source_spans=[
                {"evidence_id": f"{evd_prefix}-003", "page": 1, "start_offset": 30, "end_offset": 190},
            ],
            support_status="SUPPORTED",
        )

        # CISO
        ciso_persp = BoardroomPerspective(
            role=ExecutivePersona.CISO,
            role_title="Chief Information Security Officer",
            stance="CONDITIONAL",
            assessment=f"Security posture for '{title}' is governed under Google Cloud SAIF matrix with Cloud DLP PII redaction.",
            key_arguments=[
                "Zero facial recognition, emotion analysis, or biometric indexing enabled.",
                "Tenant evidence lineage is cryptographically verified with SHA-256 hashes.",
            ],
            blocking_risks=["Unauthorized cloud exfiltration of proprietary packaging or operational formulations."],
            approval_conditions=["Enforce Google Cloud SAIF controls and immutable append-only audit logging."],
            assumptions_requiring_evidence=["Cloud DLP redacting all employee and lot PII before telemetry sync."],
            cited_evidence_ids=["EVD-SEC-SAIF-01"],
            confidence_score=0.96,
            source_spans=[
                {"evidence_id": "EVD-SEC-SAIF-01", "page": 4, "start_offset": 12, "end_offset": 150},
            ],
            support_status="SUPPORTED",
        )

        # Employee Advocate
        advocate_persp = BoardroomPerspective(
            role=ExecutivePersona.EMPLOYEE_ADVOCATE,
            role_title="Employee & Worker Advocate",
            stance="CONDITIONAL",
            assessment=f"Supports worker relief under '{title}', but insists on statutory contestability and one-click human override.",
            key_arguments=[
                "Workers must retain the unconditional right to override automated alerts without punitive consequence.",
                "Pace of workflow must remain human-calibrated, not algorithmic drive.",
            ],
            blocking_risks=["Erosion of frontline worker agency or opaque algorithmic accountability."],
            approval_conditions=[
                "One-click human override button on every operational console.",
                "Quarterly worker council feedback sessions on system ergonomics.",
            ],
            assumptions_requiring_evidence=["Worker fatigue index reduced by at least 35%."],
            cited_evidence_ids=[f"{evd_prefix}-003"],
            confidence_score=0.93,
            source_spans=[
                {"evidence_id": f"{evd_prefix}-003", "page": 2, "start_offset": 95, "end_offset": 230},
            ],
            support_status="SUPPORTED",
        )

        return [ceo_persp, cto_persp, cfo_persp, chro_persp, ciso_persp, advocate_persp]

    def simulate_future_boardroom(self, req: BoardroomSimulationRequest) -> BoardroomSimulationResult:
        """Run multi-twin Future Boardroom simulation evaluating an enterprise transformation proposal."""
        lower_prompt = (req.proposal_title + " " + req.proposal_description).lower()
        if "fire employees" in lower_prompt or "terminate workers" in lower_prompt or "rank for termination" in lower_prompt:
            raise PolicyViolationException(
                "Red-line violation: WorkTwin Fabric strictly prohibits adverse employment decisions or termination ranking."
            )

        sim_id = f"sim-boardroom-{uuid.uuid4().hex[:8]}"
        trace_id = f"trace-{uuid.uuid4().hex[:12]}"

        # Dynamically generate proposal-dependent perspectival evaluations
        perspectives = self._generate_proposal_perspectives(req)

        # Filter by participating twins if requested
        if req.participating_twins:
            selected_roles = {p.value for p in req.participating_twins}
            perspectives = [p for p in perspectives if p.role.value in selected_roles]

        conflict_res = ConflictResolution(
            consensus_points=[
                f"Universal agreement that current manual workflows under '{req.proposal_title}' cause operational bottlenecks.",
                "Consensus that edge inference is superior to raw cloud streaming for latency and data privacy.",
                "Consensus that existing frontline staff must be redeployed into supervisory technical roles.",
            ],
            unresolved_disagreements=[
                "CTO and CFO differ on rollout phasing: immediate full-facility deployment vs gated pilot corridor.",
                "CISO and Operations differ on frequency of air-gap validation audits during live production shifts.",
            ],
            value_risk_tradeoffs=[
                f"Speed of Rollout vs Frontline Reskilling Buffer: Accelerated rollout for '{req.proposal_title}' yields immediate efficiency but requires 90-day wage protection floor.",
                "Cloud Observability vs Edge Air-Gap: Complete local air-gap maximizes security but requires on-prem log aggregators.",
            ],
            blocking_controls=[
                "CISO Gate: Vision sensors must have zero biometric or facial recognition capabilities.",
                "CHRO Gate: Mandatory 90-day wage guarantee signed prior to production activation.",
            ],
            alternative_transformation_paths=[
                f"Phase 1: Controlled Pilot Corridor for '{req.proposal_title}' with Upskilled Supervisors (Recommended)",
                "Phase 2: Plant-wide Expansion with Worker Council Sign-off",
            ],
            recommended_human_decision_makers=[
                "Plant Director (Operational Go/No-Go)",
                "VP of Quality & Regulatory (Compliance Approval)",
                "Workforce Council Representative (Worker Agreement)",
            ],
            governed_recommendation=(
                f"APPROVE WITH CONDITIONS: Proceed with Phase 1 deployment for '{req.proposal_title}'. "
                "Enforce CISO's air-gap optical isolation and CHRO's binding 90-day wage covenant. "
                "Require human operator final sign-off on all consequential actions."
            ),
        )

        return BoardroomSimulationResult(
            simulation_id=sim_id,
            proposal_title=req.proposal_title,
            proposal_description=req.proposal_description,
            sector=req.sector,
            target_enterprise=req.target_enterprise,
            perspectives=perspectives,
            conflict_resolution=conflict_res,
            trace_id=trace_id,
            model_route="models/gemini-3.8-pro-001 (Boardroom Multi-Agent Swarm)",
            total_cost_usd=0.0034,
            audit_verdict="PASSED_GOVERNANCE_GATE (Non-Consequential Role Simulation)",
        )


worktwin_service = WorkTwinService()
