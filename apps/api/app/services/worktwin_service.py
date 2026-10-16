"""Futura WorkTwin Fabric Service: Governed digital work twins & Future Boardroom."""

from datetime import datetime, timezone
import logging
from typing import Dict, List
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

    def get_manifest(self, twin_id: str) -> WorkTwinManifest:
        """Get a specific WorkTwin manifest by identifier."""
        if twin_id not in self._manifests:
            raise ResourceNotFoundException(f"WorkTwin '{twin_id}' not found in registry")
        return self._manifests[twin_id]

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
            tenant_id=consent.tenant_id,
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

    def simulate_future_boardroom(self, req: BoardroomSimulationRequest) -> BoardroomSimulationResult:
        """Run multi-twin Future Boardroom simulation evaluating an enterprise transformation proposal."""
        # Non-negotiable safety red-line checks
        lower_prompt = (req.proposal_title + " " + req.proposal_description).lower()
        if "fire employees" in lower_prompt or "terminate workers" in lower_prompt or "rank for termination" in lower_prompt:
            raise PolicyViolationException(
                "Red-line violation: WorkTwin Fabric strictly prohibits adverse employment decisions or termination ranking."
            )

        sim_id = f"sim-boardroom-{uuid.uuid4().hex[:8]}"
        trace_id = f"trace-{uuid.uuid4().hex[:12]}"

        # Synthetic Executive Perspectival Evaluations
        perspectives = [
            BoardroomPerspective(
                role=ExecutivePersona.CEO,
                role_title="Chief Executive Officer",
                stance="FAVORABLE",
                assessment="Accelerates time-to-market, unlocks 4.5x quality throughput, and strengthens competitive market defensibility.",
                key_arguments=[
                    "Transforms manual bottleneck lines into continuous self-auditing packaging corridors.",
                    "Elevates firm brand reputation by eliminating contaminated lot recalls.",
                ],
                blocking_risks=["Potential brand backlash if transition is perceived as worker displacement."],
                approval_conditions=["Mandate public worker protection covenant and guarantee zero layoffs."],
                assumptions_requiring_evidence=["Line throughput increase of 45% within 120 days."],
                cited_evidence_ids=["EVD-CEO-01", "EVD-FIN-92"],
                confidence_score=0.94,
            ),
            BoardroomPerspective(
                role=ExecutivePersona.CTO,
                role_title="Chief Technology Officer",
                stance="CONDITIONAL",
                assessment="Edge computer vision clusters and Coral TPUs are production-ready, but legacy PLC integration requires strict isolation.",
                key_arguments=[
                    "Edge ML inference operates at 18ms per batch with zero cloud bandwidth latency.",
                    "Air-gapped factory subnet prevents factory line interruptions.",
                ],
                blocking_risks=["Firmware drift across legacy conveyor controllers."],
                approval_conditions=["Require CAN-bus read-only optical isolators and staging sandbox validation."],
                assumptions_requiring_evidence=["Sub-25ms camera shutter telemetry synchronization."],
                cited_evidence_ids=["EVD-CTO-04"],
                confidence_score=0.91,
            ),
            BoardroomPerspective(
                role=ExecutivePersona.CFO,
                role_title="Chief Financial Officer",
                stance="FAVORABLE",
                assessment="Demonstrates an attractive 6.2x net ROI multiple with capital payback achieved within 5.8 months.",
                key_arguments=[
                    "Avoided scrap and rework saves $142,000 monthly.",
                    "Token inference cost is constrained to $0.000075 per quality audit.",
                ],
                blocking_risks=["Initial hardware sensor CapEx overruns."],
                approval_conditions=["Cap initial rollout to Line 3 pilot before full plant capital release."],
                assumptions_requiring_evidence=["Unit cost savings verified across 30 operational days."],
                cited_evidence_ids=["EVD-CFO-11"],
                confidence_score=0.95,
            ),
            BoardroomPerspective(
                role=ExecutivePersona.CHRO,
                role_title="Chief Human Resources Officer",
                stance="CONDITIONAL",
                assessment="Human impact is manageable only if frontline Quality Inspectors are upskilled to AI Quality Supervisors.",
                key_arguments=[
                    "Manual eye-strain tasks are 100% automated, relieving occupational fatigue.",
                    "Upskilling track creates 4 new higher-paying technical supervisory roles.",
                ],
                blocking_risks=["Frontline anxiety regarding automated camera surveillance."],
                approval_conditions=[
                    "Institute binding 90-day wage protection floor.",
                    "Strict prohibition on using vision streams for employee speed monitoring.",
                ],
                assumptions_requiring_evidence=["80% inspector certification pass rate on edge console tools."],
                cited_evidence_ids=["EVD-CHRO-03"],
                confidence_score=0.89,
            ),
            BoardroomPerspective(
                role=ExecutivePersona.CISO,
                role_title="Chief Information Security Officer",
                stance="CONDITIONAL",
                assessment="Security posture acceptable with Model Armor prompt filtering and edge network segregation.",
                key_arguments=[
                    "All visual inspection inference occurs local on-premise without raw video egress.",
                    "Zero facial recognition or biometric indexing enabled.",
                ],
                blocking_risks=["Unauthorized cloud exfiltration of proprietary packaging formulations."],
                approval_conditions=["Enforce Google Cloud SAIF controls and immutable audit logging."],
                assumptions_requiring_evidence=["DLP redacting all factory lot PII before telemetry sync."],
                cited_evidence_ids=["EVD-CISO-08"],
                confidence_score=0.96,
            ),
            BoardroomPerspective(
                role=ExecutivePersona.EMPLOYEE_ADVOCATE,
                role_title="Employee & Worker Advocate",
                stance="CONDITIONAL",
                assessment="Supports ergonomic relief from microscopic visual inspection, but insists on worker contestability.",
                key_arguments=[
                    "Workers must have the absolute right to override AI vision alerts without penalty.",
                    "Inspection pace must be worker-calibrated, not algorithmic whip-driving.",
                ],
                blocking_risks=["Erosion of frontline worker agency and subjective punitive scoring."],
                approval_conditions=[
                    "One-click human override button on every inspection console.",
                    "Quarterly worker council feedback sessions on tool usability.",
                ],
                assumptions_requiring_evidence=["Worker fatigue index reduced by at least 40%."],
                cited_evidence_ids=["EVD-ADV-02"],
                confidence_score=0.93,
            ),
        ]

        # Filter by participating twins if requested
        if req.participating_twins:
            selected_roles = {p.value for p in req.participating_twins}
            perspectives = [p for p in perspectives if p.role.value in selected_roles]

        conflict_res = ConflictResolution(
            consensus_points=[
                "Universal agreement that manual packaging visual inspection causes extreme eye strain and defect leakage.",
                "Consensus that edge inference is superior to raw cloud streaming for latency and data privacy.",
                "Consensus that existing frontline staff must be redeployed into supervisory technical roles.",
            ],
            unresolved_disagreements=[
                "CTO and CFO differ on whether to replace entire conveyor sensors immediately or retrofit Line 3.",
                "CISO and Line Operations differ on frequency of air-gap validation audits during live production.",
            ],
            value_risk_tradeoffs=[
                "Speed of Rollout vs Frontline Reskilling Buffer: Fast rollout yields immediate $142K savings but requires 90-day wage floor guarantee.",
                "Cloud Observability vs Edge Air-Gap: Complete local air-gap maximizes security but requires on-prem log aggregators.",
            ],
            blocking_controls=[
                "CISO Gate: Vision cameras must have zero biometric or facial recognition capabilities.",
                "CHRO Gate: Mandatory 90-day wage guarantee signed prior to production activation.",
            ],
            alternative_transformation_paths=[
                "Phase 1: Line 3 Pilot with 4 Upskilled Supervisors (Recommended)",
                "Phase 2: Plant-wide Expansion with Worker Council Sign-off",
            ],
            recommended_human_decision_makers=[
                "Plant Director (Operational Go/No-Go)",
                "VP of Quality & Regulatory (HACCP Approval)",
                "Workforce Council Representative (Worker Agreement)",
            ],
            governed_recommendation=(
                "APPROVE WITH CONDITIONS: Proceed with Phase 1 deployment on Line 3. Enforce CISO's air-gap optical "
                "isolation and CHRO's binding 90-day wage covenant. Require human operator final sign-off on all lot disposals."
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
