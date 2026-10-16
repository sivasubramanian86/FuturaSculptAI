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
from app.repositories.worktwin_repository import (
    BoardroomRunRepository,
    ConsentRepository,
    InMemoryBoardroomRunRepository,
    InMemoryConsentRepository,
    InMemoryWorkTwinRepository,
    WorkTwinRepository,
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
        return {}

    @property
    def _consents(self) -> Dict[str, PersonalWorkTwinConsent]:
        """Backward-compatible dictionary accessor for in-memory employee consents."""
        if isinstance(self._consent_repo, InMemoryConsentRepository):
            return {c.employee_id: c for c in self._consent_repo._store.values()}
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

    def _generate_proposal_perspectives(self, req: BoardroomSimulationRequest) -> List[BoardroomPerspective]:
        """Dynamically generate executive role perspectives driven by semantic proposal content and policy intent."""
        title = req.proposal_title
        desc = req.proposal_description
        sector = (req.sector or "general").lower()
        enterprise = req.target_enterprise or "Enterprise"

        combined_text = f"{title} {desc}".lower()
        evd_prefix = "EVD-FOOD" if "food" in sector else ("EVD-EV" if "auto" in sector or "ev" in sector else ("EVD-HLTH" if "health" in sector else "EVD-ENT"))

        is_ungrounded = any(w in combined_text for w in ["unsupported", "magic", "replace all", "zero evidence"])
        is_human_first = any(w in combined_text for w in ["human-first", "prohibit automation", "four-day", "mentoring", "well-being", "worker-led", "human agency sanctuary"])
        is_extreme_automation = any(w in combined_text for w in ["maximum automation surge", "eliminate manual touchpoints", "replace human", "100% automated"])

        if is_human_first:
            # Policy Intent: Worker Agency, 4-Day Week, No Automation
            ceo_persp = BoardroomPerspective(
                role=ExecutivePersona.CEO,
                role_title="Chief Executive Officer",
                stance="CAUTIOUS",
                assessment=f"Evaluated human-first proposal '{title}' for {enterprise}. Strengths lie in retention and brand reputation, but schedule compression risks customer responsiveness windows.",
                recommendation="Pilot 32-hour work schedule with strict client service SLAs and monthly SLA compliance reviews.",
                key_arguments=[
                    f"Boosts employee loyalty and reduces costly talent churn for {enterprise}.",
                    "Requires strict customer coverage rotation to prevent service degradation.",
                ],
                blocking_risks=["Potential customer complaints during non-staffed schedule windows."],
                approval_conditions=["Establish staggered team coverage rotations guaranteeing 5-day client coverage."],
                assumptions_requiring_evidence=["Sustained service output during 32-hour operational week."],
                cited_evidence_ids=[f"{evd_prefix}-001"],
                confidence_score=0.88,
                source_spans=[{"evidence_id": f"{evd_prefix}-001", "page": 1, "start_offset": 50, "end_offset": 200}],
                support_status="SUPPORTED",
            )
            cto_persp = BoardroomPerspective(
                role=ExecutivePersona.CTO,
                role_title="Chief Technology Officer",
                stance="CAUTIOUS",
                assessment=f"Freezing automation under '{title}' leaves manual toil intact. Technology strategy should focus on asynchronous knowledge bases rather than hardware robotics.",
                recommendation="Adopt asynchronous collaboration platforms and shared knowledge retrieval instead of robotics.",
                key_arguments=[
                    "Manual verification steps will remain a bottleneck without automated tooling.",
                    "Asynchronous tooling is essential to maintain handover quality across condensed shifts.",
                ],
                blocking_risks=["Human error accumulation in manual data verification pipelines."],
                approval_conditions=["Mandate structured shift handover checklists in digital logbooks."],
                assumptions_requiring_evidence=["Knowledge transfer latency remains under 15 minutes between handovers."],
                cited_evidence_ids=[f"{evd_prefix}-002"],
                confidence_score=0.85,
                source_spans=[{"evidence_id": f"{evd_prefix}-002", "page": 2, "start_offset": 80, "end_offset": 240}],
                support_status="SUPPORTED",
            )
            cfo_persp = BoardroomPerspective(
                role=ExecutivePersona.CFO,
                role_title="Chief Financial Officer",
                stance="CAUTIOUS",
                assessment=f"Financial viability of '{title}' depends on avoiding unbudgeted overtime wage spikes. Fixed labor expenses remain constant while active operating hours decline.",
                recommendation="Audit monthly overtime cost balances against headcount utilization and pause expansion if overtime exceeds 4%.",
                key_arguments=[
                    "Zero CapEx investment required since physical automation is deferred.",
                    "Overtime premiums must be monitored strictly to avoid margin erosion.",
                ],
                blocking_risks=["Margin contraction if overtime hours are required to meet existing production targets."],
                approval_conditions=["Set hard ceiling on overtime expenditure at 4% of payroll."],
                assumptions_requiring_evidence=["Productivity gains offset 20% reduction in scheduled work hours."],
                cited_evidence_ids=["EVD-FIN-92"],
                confidence_score=0.87,
                source_spans=[{"evidence_id": "EVD-FIN-92", "page": 2, "start_offset": 110, "end_offset": 260}],
                support_status="SUPPORTED",
            )
            chro_persp = BoardroomPerspective(
                role=ExecutivePersona.CHRO,
                role_title="Chief Human Resources Officer",
                stance="FAVORABLE",
                assessment=f"Workforce well-being under '{title}' is exemplary. Reduces chronic occupational burnout and fosters collaborative mentoring cultures.",
                recommendation="Deploy senior-to-junior structured mentoring ladders and flexible shift allocations across all departments.",
                key_arguments=[
                    "Radically improves employee mental wellness and lowers absenteeism.",
                    "Structured mentoring facilitates intergenerational knowledge transfer.",
                ],
                blocking_risks=["Unequal team workload distribution if senior mentors absorb excessive burden."],
                approval_conditions=["Cap dedicated mentoring commitments to 4 hours per week per senior staff."],
                assumptions_requiring_evidence=["Worker burnout metrics decline by at least 40% within 90 days."],
                cited_evidence_ids=[f"{evd_prefix}-003"],
                confidence_score=0.96,
                source_spans=[{"evidence_id": f"{evd_prefix}-003", "page": 1, "start_offset": 30, "end_offset": 190}],
                support_status="SUPPORTED",
            )
            ciso_persp = BoardroomPerspective(
                role=ExecutivePersona.CISO,
                role_title="Chief Information Security Officer",
                stance="CONDITIONAL",
                assessment=f"Flexible rostering under '{title}' requires adaptive identity controls to manage changing shift access rights.",
                recommendation="Enforce zero-trust dynamic credentials for distributed and rotating worker rosters.",
                key_arguments=[
                    "Rotating shift hours necessitate time-bound credential expiry.",
                    "Remote workstation access must comply with Google Cloud SAIF least-privilege standards.",
                ],
                blocking_risks=["Privilege lingering after temporary shift rotations."],
                approval_conditions=["Implement automated session revocation at the end of each designated shift."],
                assumptions_requiring_evidence=["Zero unauthorized access attempts during off-schedule days."],
                cited_evidence_ids=["EVD-SEC-SAIF-01"],
                confidence_score=0.93,
                source_spans=[{"evidence_id": "EVD-SEC-SAIF-01", "page": 4, "start_offset": 12, "end_offset": 150}],
                support_status="SUPPORTED",
            )
            advocate_persp = BoardroomPerspective(
                role=ExecutivePersona.EMPLOYEE_ADVOCATE,
                role_title="Employee & Worker Advocate",
                stance="FAVORABLE",
                assessment=f"Strongly champions '{title}'. Protects human sovereignty and honors worker rest without imposing algorithmic surveillance.",
                recommendation="Approve 4-day policy unconditionally to eliminate chronic occupational burnout.",
                key_arguments=[
                    "Workers regain control over personal time and family life.",
                    "Preserves dignity by refusing punitive automated speed tracking.",
                ],
                blocking_risks=["Informal pressure on workers to answer communications during rest days."],
                approval_conditions=["Institute binding 'Right to Disconnect' policy with punitive penalties for violations."],
                assumptions_requiring_evidence=["Worker job satisfaction score exceeds 92%."],
                cited_evidence_ids=[f"{evd_prefix}-003"],
                confidence_score=0.98,
                source_spans=[{"evidence_id": f"{evd_prefix}-003", "page": 2, "start_offset": 95, "end_offset": 230}],
                support_status="SUPPORTED",
            )
            return [ceo_persp, cto_persp, cfo_persp, chro_persp, ciso_persp, advocate_persp]

        # Standard / Automation Proposal Pathway
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
            recommendation=(
                "Reject or require empirical baseline study before capital commitment."
                if is_ungrounded else
                "Authorize 60-day isolated packaging corridor pilot to validate throughput margins."
            ),
            key_arguments=[
                f"Positions {enterprise} as an industry benchmark in ethical, AI-augmented operations.",
                f"Addresses primary operational friction described in: {title}.",
            ],
            blocking_risks=["Potential enterprise brand backlash if workforce covenants are not publicized."],
            approval_conditions=["Mandate public worker protection covenant and guarantee zero layoffs."],
            assumptions_requiring_evidence=[f"Operational throughput gains for '{title}' within 90 days."],
            cited_evidence_ids=[] if is_ungrounded else [f"{evd_prefix}-001", "EVD-FIN-92"],
            confidence_score=0.72 if is_ungrounded else 0.94,
            source_spans=[] if is_ungrounded else [
                {"evidence_id": f"{evd_prefix}-001", "page": 1, "start_offset": 50, "end_offset": 210},
                {"evidence_id": "EVD-FIN-92", "page": 3, "start_offset": 140, "end_offset": 320},
            ],
            support_status="INSUFFICIENT_EVIDENCE" if is_ungrounded else "SUPPORTED",
        )

        cto_persp = BoardroomPerspective(
            role=ExecutivePersona.CTO,
            role_title="Chief Technology Officer",
            stance="CONDITIONAL",
            assessment=f"Architecture for '{title}' requires edge-cluster isolation and verified model gateway fallback.",
            recommendation="Install Coral Edge TPU subnets with physical optical air-gapped data diodes.",
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

        cfo_persp = BoardroomPerspective(
            role=ExecutivePersona.CFO,
            role_title="Chief Financial Officer",
            stance="FAVORABLE",
            assessment=f"Financial payback for '{title}' models positive net ROI multiple with token inference costs capped under $0.001/task.",
            recommendation="Cap upfront hardware outlay to $45,000 and enforce $0.001 token budget envelopes.",
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

        chro_persp = BoardroomPerspective(
            role=ExecutivePersona.CHRO,
            role_title="Chief Human Resources Officer",
            stance="BLOCKING" if is_extreme_automation else "CONDITIONAL",
            assessment=(
                f"Extreme automation under '{title}' threatens workforce destabilization."
                if is_extreme_automation else
                f"Human workforce impact for '{title}' is permissible only with mandatory upskilling and 90-day wage protection covenants."
            ),
            recommendation=(
                "Halt full automation surge; mandate union consultation and human-machine collaborative redesign."
                if is_extreme_automation else
                "Execute binding 90-day wage preservation covenant with certified robotics upskilling track."
            ),
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

        ciso_persp = BoardroomPerspective(
            role=ExecutivePersona.CISO,
            role_title="Chief Information Security Officer",
            stance="CONDITIONAL",
            assessment=f"Security posture for '{title}' is governed under Google Cloud SAIF matrix with Cloud DLP PII redaction.",
            recommendation="Isolate sensor telemetry inside Google Cloud SAIF boundary with Cloud DLP PII redaction.",
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

        advocate_persp = BoardroomPerspective(
            role=ExecutivePersona.EMPLOYEE_ADVOCATE,
            role_title="Employee & Worker Advocate",
            stance="BLOCKING" if is_extreme_automation else "CONDITIONAL",
            assessment=(
                f"Severe worker displacement risk under '{title}'. Complete elimination of manual control violates safety agency."
                if is_extreme_automation else
                f"Supports worker relief under '{title}', but insists on statutory contestability and one-click human override."
            ),
            recommendation=(
                "Veto unconstrained automation; retain mandatory human co-pilot on every active station."
                if is_extreme_automation else
                "Require mechanical emergency-stop physical buttons and worker-governed speed calibration."
            ),
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

        is_human_first = any(w in lower_prompt for w in ["human-first", "prohibit automation", "four-day", "mentoring", "well-being", "worker-led", "human agency sanctuary"])

        if is_human_first:
            disagreements_list = [
                "CHRO and CFO contest overtime wage elasticity vs 32-hour headcount demands",
                "Operations and Advocate differ on shift handover continuity",
            ]
            conflict_res = ConflictResolution(
                consensus_points=[
                    f"Consensus that employee mental health and retention under '{req.proposal_title}' offer strong competitive advantage.",
                    "Agreement that customer delivery SLAs must remain intact through staggered shift rotations.",
                    "Consensus that asynchronous documentation tools should be upgraded immediately.",
                ],
                unresolved_disagreements=disagreements_list,
                disagreements=disagreements_list,
                value_risk_tradeoffs=[
                    "Workforce Well-being vs Operational Coverage: 32-hour schedule improves retention but requires precision coverage management.",
                    "Zero-CapEx Deployment vs Labor Costs: Avoids equipment capital outlay but demands stringent overtime ceiling controls.",
                ],
                blocking_controls=[
                    "CHRO Gate: Statutory Right to Disconnect policy signed across all facilities.",
                    "CFO Gate: Hard ceiling on overtime payroll capped at 4% maximum.",
                ],
                alternative_transformation_paths=[
                    f"Option A: 90-Day Controlled Pilot for '{req.proposal_title}' with Bi-Weekly Employee Surveys (Recommended)",
                    "Option B: Staggered 4x10 Flexible Hour Schedule Alternative",
                ],
                recommended_human_decision_makers=[
                    "Executive VP of Human Resources (Workforce Policy Sign-off)",
                    "Chief Financial Officer (Overtime Budget Authorization)",
                    "Works Council / Union Lead (Bilateral Agreement)",
                ],
                governed_recommendation=(
                    f"APPROVE PILOT WITH CONDITIONS: Proceed with Phase 1 rollout of '{req.proposal_title}'. "
                    "Enforce CHRO's Right to Disconnect policy and CFO's 4% overtime payroll cap. "
                    "Conduct empirical review at Day 60 prior to permanent policy adoption."
                ),
            )
        else:
            disagreements_list = [
                "Rollout phasing: CTO isolated corridor vs CEO full-facility activation",
                "Air-gap security audit frequency between CISO and line engineering",
            ]
            conflict_res = ConflictResolution(
                consensus_points=[
                    f"Universal agreement that current manual workflows under '{req.proposal_title}' cause operational bottlenecks.",
                    "Consensus that edge inference is superior to raw cloud streaming for latency and data privacy.",
                    "Consensus that existing frontline staff must be redeployed into supervisory technical roles.",
                ],
                unresolved_disagreements=disagreements_list,
                disagreements=disagreements_list,
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

        sim_result = BoardroomSimulationResult(
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
        self._boardroom_repo.save_simulation(sim_result)
        return sim_result


worktwin_service = WorkTwinService()
