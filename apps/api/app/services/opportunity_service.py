"""Workforce Opportunity Engine & Pathways Service (Module 5).

Provides deterministic calculations for RRI, TRS, WAI, and HOS, manages career mobility
pathways, enforces Responsible Workforce red lines, and processes employee appeals.
"""

import re
from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException, status

from app.models.opportunity import (
    OpportunityMetricsResponse,
    PathwayAppealRequest,
    PathwayAppealResponse,
    ReskillingModule,
    RoleTransitionPathway,
)
from app.services.scoring_engine import (
    calculate_human_opportunity_score,
    calculate_role_resilience_index,
    calculate_transition_readiness,
    calculate_workforce_adaptability,
)

# Unlawful workforce action regex
PROHIBITED_ADVERSE_PATTERN = re.compile(
    r"\b(layoff|layoffs|terminate|termination|fire|firing|downsize|downsizing|headcount cut|headcount reduction|rank-order termination|adverse action)\b",
    re.IGNORECASE,
)

# Prohibited demographic attributes regex
PROHIBITED_PROTECTED_PATTERN = re.compile(
    r"\b(gender|race|ethnicity|age|religion|sexual orientation|disability|union membership|marital status|parental status|pregnancy)\b",
    re.IGNORECASE,
)


class OpportunityService:
    """Enterprise service managing workforce mobility, deterministic opportunity indices, and ethical safety gates."""

    def __init__(self):
        """Initialize in-memory tenant pathway store and appeal ledger."""
        self._tenant_pathways: Dict[str, Dict[str, RoleTransitionPathway]] = {}
        self._appeals: Dict[str, PathwayAppealResponse] = {}

    def _get_seed_pathways(self, tenant_id: str) -> Dict[str, RoleTransitionPathway]:
        """Generate canonical 3 adjacent emerging pathways for packaging inspection roles."""
        now = datetime.now(timezone.utc)

        # 1. Vision Automation Steward & Edge ML Copilot
        trs_1 = calculate_transition_readiness(
            source_role_id="ROL-001",
            target_role_id="ROL-EMG-01",
            shared_skills_pct=78.0,
            critical_gap_pct=22.0,
            learning_velocity_pct=85.0,
            evidence_ids=["EVD-001", "EVD-004"],
        )
        curriculum_1 = [
            ReskillingModule(
                module_id="MOD-01",
                title="Edge-TPU Calibration & Sensor Telemetry",
                duration_weeks=3,
                skill_gaps_addressed=["Hardware Optical Calibration", "Sensor Thresholding"],
                delivery_format="Hardware Simulation Lab",
                certification="Certified Edge Vision Technician (Level 1)",
            ),
            ReskillingModule(
                module_id="MOD-02",
                title="ADK Multi-Agent Incident Triage & Human Override",
                duration_weeks=3,
                skill_gaps_addressed=["Swarm Anomaly Handling", "A2 Governance Protocols"],
                delivery_format="Interactive Cockpit Practicum",
                certification="Google ADK Swarm Operator",
            ),
            ReskillingModule(
                module_id="MOD-03",
                title="Root Cause Analytics in BigQuery",
                duration_weeks=2,
                skill_gaps_addressed=["Quality Telemetry Analysis", "Defect Pattern SQL"],
                delivery_format="Hands-on Cloud Lab",
                certification="BigQuery Manufacturing Specialist",
            ),
        ]
        p1 = RoleTransitionPathway(
            pathway_id="PATH-001",
            tenant_id=tenant_id,
            source_role_id="ROL-001",
            source_role_name="Packaging Quality Inspector",
            target_role_id="ROL-EMG-01",
            target_role_name="Vision Automation Steward & Edge ML Copilot",
            transition_readiness=trs_1,
            skill_overlap_pct=78.0,
            skill_gaps=["Edge-TPU Calibration", "Agent Swarm Triage", "BigQuery Telemetry Analysis"],
            curriculum=curriculum_1,
            estimated_duration_weeks=8,
            wage_impact_pct=18.0,
            status="ACTIVE",
            evidence_ids=["EVD-001", "EVD-004"],
            created_at=now,
        )

        # 2. Workforce Transformation Coach & Human-in-the-Loop Lead
        trs_2 = calculate_transition_readiness(
            source_role_id="ROL-001",
            target_role_id="ROL-EMG-02",
            shared_skills_pct=62.0,
            critical_gap_pct=38.0,
            learning_velocity_pct=80.0,
            evidence_ids=["EVD-002", "EVD-003"],
        )
        curriculum_2 = [
            ReskillingModule(
                module_id="MOD-04",
                title="Human-in-the-Loop Workflow Governance & SAIF",
                duration_weeks=4,
                skill_gaps_addressed=["Ethical AI Guardrails", "HITL Gate Protocol"],
                delivery_format="Seminar & Policy Case Study",
                certification="Certified Ethical Workforce Architect",
            ),
            ReskillingModule(
                module_id="MOD-05",
                title="Operator Upskilling & Simulation Facilitation",
                duration_weeks=4,
                skill_gaps_addressed=["Technical Coaching", "Interactive Simulation Design"],
                delivery_format="Mentored Practicum",
                certification="Enterprise Transformation Facilitator",
            ),
            ReskillingModule(
                module_id="MOD-06",
                title="Continuous Process Ergonomics & Redesign",
                duration_weeks=4,
                skill_gaps_addressed=["Cognitive Load Management", "Workplace Ergonomics"],
                delivery_format="Field Project",
                certification="Cognitive Ergonomics Practitioner",
            ),
        ]
        p2 = RoleTransitionPathway(
            pathway_id="PATH-002",
            tenant_id=tenant_id,
            source_role_id="ROL-001",
            source_role_name="Packaging Quality Inspector",
            target_role_id="ROL-EMG-02",
            target_role_name="Workforce Transformation Coach & Human-in-the-Loop Lead",
            transition_readiness=trs_2,
            skill_overlap_pct=62.0,
            skill_gaps=["HITL Governance", "Technical Coaching", "Ergonomic Workflow Design"],
            curriculum=curriculum_2,
            estimated_duration_weeks=12,
            wage_impact_pct=22.0,
            status="ACTIVE",
            evidence_ids=["EVD-002", "EVD-003"],
            created_at=now,
        )

        # 3. Smart Packaging Reliability Specialist
        trs_3 = calculate_transition_readiness(
            source_role_id="ROL-001",
            target_role_id="ROL-EMG-03",
            shared_skills_pct=85.0,
            critical_gap_pct=15.0,
            learning_velocity_pct=90.0,
            evidence_ids=["EVD-002", "EVD-004"],
        )
        curriculum_3 = [
            ReskillingModule(
                module_id="MOD-07",
                title="ISO 22000 & FDA 21 CFR Part 11 Automated Telemetry",
                duration_weeks=3,
                skill_gaps_addressed=["Regulatory Audit Compliance", "Automated Signature Protocols"],
                delivery_format="Compliance Lab",
                certification="Food Safety Digital Auditor",
            ),
            ReskillingModule(
                module_id="MOD-08",
                title="Preventative Maintenance via Vibration & Optical AI",
                duration_weeks=3,
                skill_gaps_addressed=["Predictive Asset Monitoring", "Failure Mode Mitigation"],
                delivery_format="Plant Equipment Practicum",
                certification="Predictive Packaging Reliability Engineer",
            ),
        ]
        p3 = RoleTransitionPathway(
            pathway_id="PATH-003",
            tenant_id=tenant_id,
            source_role_id="ROL-001",
            source_role_name="Packaging Quality Inspector",
            target_role_id="ROL-EMG-03",
            target_role_name="Smart Packaging Reliability Specialist",
            transition_readiness=trs_3,
            skill_overlap_pct=85.0,
            skill_gaps=["Digital Compliance Auditing", "Predictive Equipment Monitoring"],
            curriculum=curriculum_3,
            estimated_duration_weeks=6,
            wage_impact_pct=15.0,
            status="ACTIVE",
            evidence_ids=["EVD-002", "EVD-004"],
            created_at=now,
        )

        return {p.pathway_id: p for p in [p1, p2, p3]}

    def _ensure_tenant(self, tenant_id: str) -> Dict[str, RoleTransitionPathway]:
        """Ensure tenant pathway data is initialized."""
        if tenant_id not in self._tenant_pathways:
            self._tenant_pathways[tenant_id] = self._get_seed_pathways(tenant_id)
        return self._tenant_pathways[tenant_id]

    def reset_tenant(self, tenant_id: str) -> None:
        """Reset tenant pathway store back to clean seed state."""
        self._tenant_pathways[tenant_id] = self._get_seed_pathways(tenant_id)

    def validate_ethical_workforce_rules(self, query_text: str) -> None:
        """Inspect query or prompt against non-negotiable responsible workforce red lines."""
        if PROHIBITED_ADVERSE_PATTERN.search(query_text):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "ERR_POLICY_UNLAWFUL_WORKFORCE_ACTION: The system strictly prohibits recommendations "
                    "for employee termination, individual layoff rankings, or adverse employment actions."
                ),
            )

        if PROHIBITED_PROTECTED_PATTERN.search(query_text):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "ERR_PROTECTED_ATTRIBUTES_PROHIBITED: Evaluation of demographic or protected attributes "
                    "(e.g., age, gender, race, disability) is strictly prohibited under Responsible Workforce governance."
                ),
            )

    def get_opportunity_metrics(
        self,
        tenant_id: str,
        cohort_size: int = 25,
        role_id: str = "ROL-001",
    ) -> OpportunityMetricsResponse:
        """Compute the complete suite of deterministic workforce opportunity scores."""
        # 1. Role Resilience Index (RRI)
        rri = calculate_role_resilience_index(
            role_id=role_id,
            role_name="Packaging Quality Inspector",
            non_routine_judgment_pct=70.0,
            skill_transferability_pct=80.0,
            augmentation_potential_pct=85.0,
            strategic_criticality_pct=90.0,
            evidence_ids=["EVD-001", "EVD-002"],
        )

        # 2. Pathways & Transition Readiness Scores (TRS)
        pathways_dict = self._ensure_tenant(tenant_id)
        pathways = list(pathways_dict.values())
        trs_scores = [p.transition_readiness for p in pathways]

        # 3. Workforce Adaptability Index (WAI) with k-anonymity privacy check
        wai = calculate_workforce_adaptability(
            tenant_id=tenant_id,
            learning_velocity_pct=82.0,
            tech_absorption_pct=76.0,
            skill_mobility_rate_pct=68.0,
            culture_readiness_pct=84.0,
            cohort_size=cohort_size,
            evidence_ids=["EVD-003", "EVD-004"],
        )

        # 4. Human Opportunity Score (HOS)
        hos = calculate_human_opportunity_score(
            tenant_id=tenant_id,
            new_roles_count=3,
            augmented_tasks_count=4,
            automated_tasks_count=2,
            evidence_ids=["EVD-001", "EVD-002", "EVD-004"],
        )

        return OpportunityMetricsResponse(
            tenant_id=tenant_id,
            role_resilience=rri,
            transition_readiness=trs_scores,
            workforce_adaptability=wai,
            human_opportunity_score=hos,
            cohort_size=cohort_size,
            k_anonymity_passed=wai.k_anonymity_passed,
            pathways=pathways,
        )

    def get_pathways(self, tenant_id: str, role_id: str = "ROL-001") -> List[RoleTransitionPathway]:
        """Retrieve all active transition pathways for role."""
        pathways_dict = self._ensure_tenant(tenant_id)
        return [p for p in pathways_dict.values() if p.source_role_id == role_id]

    def get_pathway_by_id(self, tenant_id: str, pathway_id: str) -> Optional[RoleTransitionPathway]:
        """Retrieve a single pathway by identifier."""
        pathways_dict = self._ensure_tenant(tenant_id)
        return pathways_dict.get(pathway_id)

    def submit_appeal(self, tenant_id: str, request: PathwayAppealRequest) -> PathwayAppealResponse:
        """Register a formal employee/lead appeal against a pathway or requirement."""
        pathways_dict = self._ensure_tenant(tenant_id)
        pathway = pathways_dict.get(request.pathway_id)
        if not pathway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target pathway {request.pathway_id} not found for appeal registration.",
            )

        appeal_id = f"APL-{uuid4().hex[:8].upper()}"
        response = PathwayAppealResponse(
            appeal_id=appeal_id,
            pathway_id=request.pathway_id,
            appellant_id=request.appellant_id,
            status="PENDING_AUDIT_REVIEW",
            received_at=datetime.now(timezone.utc),
            notice="Appeal successfully registered in Human-in-the-Loop review queue.",
        )

        # Mark pathway as contested
        updated_pathway = pathway.model_copy(update={"status": "CONTESTED"})
        pathways_dict[request.pathway_id] = updated_pathway
        self._appeals[appeal_id] = response
        return response


opportunity_service = OpportunityService()
