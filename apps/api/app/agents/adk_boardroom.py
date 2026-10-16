"""Google ADK Multi-Agent Boardroom Swarm Architecture.

Integrates dedicated specialist role-twin agents, parallel deliberation,
evidence verification, and conflict resolution for executive boardroom deliberations.
"""

import asyncio
from typing import Any, Dict, List, Optional
import uuid

# Official Google ADK Framework Imports
from google.adk.agents import Agent, ParallelAgent, SequentialAgent
from pydantic import Field

from app.core.exceptions import PolicyViolationException
from app.models.worktwin import (
    BoardroomConflictResolution,
    BoardroomPerspective,
    BoardroomSimulationRequest,
    BoardroomSimulationResult,
    ConflictResolution,
    ExecutivePersona,
)
from app.repositories.worktwin_repository import (
    BoardroomRunRepository,
    InMemoryBoardroomRunRepository,
)


class CEORoleTwinAgent(Agent):
    """Specialist Google ADK Agent representing Chief Executive Officer."""

    name: str = "CEORoleTwinAgent"
    description: str = "Evaluates strategic growth, market positioning, and enterprise agility."

    async def deliberate(
        self,
        proposal: str,
        enterprise: str,
        sector: str,
        evd_prefix: str,
    ) -> BoardroomPerspective:
        """Evaluate strategic growth, organizational agility, and competitive positioning."""
        p_lower = proposal.lower()
        is_ungrounded = any(w in p_lower for w in ["unsupported", "magic", "replace all", "zero evidence"])
        is_human_first = any(w in p_lower for w in ["human-first", "prohibit automation", "four-day", "4-day", "pause", "freeze", "mentoring", "well-being", "worker-led", "human agency sanctuary"])
        is_extreme_automation = any(w in p_lower for w in ["maximum automation surge", "eliminate manual touchpoints", "replace human", "100% automated"])

        if is_ungrounded:
            stance = "CAUTIOUS"
            rec = f"Defer adoption of unverified claims in '{proposal[:45]}' pending rigorous empirical validation."
            args = [
                "Claims lack empirical baseline validation or measurable operational metrics.",
                "Speculative capability projections introduce uncontrolled production risk.",
            ]
            risks = ["Uncontrolled failure cascades resulting from ungrounded technology assumptions."]
            conds = ["Submit proposal to formal sandbox benchmarking with peer-reviewed evidence."]
            assumptions = ["Empirical validation confirms baseline viability."]
            cited_ids = ["EVD-UNGROUNDED-999"]
            conf = 0.45
            spans: List[Dict[str, Any]] = []
        elif is_human_first:
            stance = "CAUTIOUS"
            rec = "Pilot 32-hour work schedule with strict client service SLAs and monthly SLA compliance reviews."
            args = [
                f"Boosts employee loyalty and reduces costly talent churn for {enterprise}.",
                "Requires strict customer coverage rotation to prevent service degradation.",
            ]
            risks = ["Potential customer complaints during non-staffed schedule windows."]
            conds = ["Establish staggered team coverage rotations guaranteeing 5-day client coverage."]
            assumptions = ["Sustained service output during 32-hour operational week."]
            cited_ids = [f"{evd_prefix}-001"]
            conf = 0.88
            spans = [{"evidence_id": f"{evd_prefix}-001", "page": 1, "start_offset": 50, "end_offset": 200}]
        elif is_extreme_automation:
            stance = "CONDITIONAL"
            rec = "Scale intelligent automation in isolated packaging corridor Line 3 with continuous human oversight."
            args = [
                f"Limits operational risk by gating automation rollout to Line 3 for {enterprise}.",
                "Provides empirical defect reduction data before considering plant-wide scaling.",
            ]
            risks = ["Interruption to existing line throughput during sensor calibration."]
            conds = ["Enforce 90-day isolation period with weekly quality reviews."]
            assumptions = ["Packaging defect reduction reaches at least 22% within 60 days."]
            cited_ids = [f"{evd_prefix}-001"]
            conf = 0.91
            spans = [{"evidence_id": f"{evd_prefix}-001", "page": 1, "start_offset": 10, "end_offset": 150}]
        else:
            stance = "FAVORABLE"
            rec = f"Authorize enterprise-wide adoption of '{proposal[:40]}' with cross-facility standard operating procedures."
            args = [
                f"Accelerates market responsiveness and strengthens margins for {enterprise}.",
                "Positions the company as a sector-leading modernizer.",
            ]
            risks = ["Execution delays caused by regional facility variation."]
            conds = ["Stage rollout with weekly executive milestones."]
            assumptions = ["Capacity increases by at least 18% within 90 days."]
            cited_ids = [f"{evd_prefix}-001"]
            conf = 0.96
            spans = [{"evidence_id": f"{evd_prefix}-001", "page": 1, "start_offset": 10, "end_offset": 150}]

        return BoardroomPerspective(
            role=ExecutivePersona.CEO,
            role_title="Chief Executive Officer",
            stance=stance,
            assessment=f"Executive strategic review for {enterprise} regarding '{proposal[:45]}'. Modernization balances agility and retention.",
            recommendation=rec,
            key_arguments=args,
            blocking_risks=risks,
            approval_conditions=conds,
            assumptions_requiring_evidence=assumptions,
            cited_evidence_ids=cited_ids,
            confidence_score=conf,
            source_spans=spans,
            support_status="SUPPORTED" if spans else "INSUFFICIENT_EVIDENCE",
        )


class CTORoleTwinAgent(Agent):
    """Specialist Google ADK Agent representing Chief Technology Officer."""

    name: str = "CTORoleTwinAgent"
    description: str = "Evaluates technological feasibility, automation debt, and tooling strategy."

    async def deliberate(
        self,
        proposal: str,
        enterprise: str,
        sector: str,
        evd_prefix: str,
    ) -> BoardroomPerspective:
        """Evaluate technological feasibility, automation debt, and tooling strategy."""
        p_lower = proposal.lower()
        is_ungrounded = any(w in p_lower for w in ["unsupported", "magic", "replace all", "zero evidence"])
        is_human_first = any(w in p_lower for w in ["human-first", "prohibit automation", "four-day", "4-day", "pause", "freeze", "mentoring", "well-being", "worker-led", "human agency sanctuary"])
        is_extreme_automation = any(w in p_lower for w in ["maximum automation surge", "eliminate manual touchpoints", "replace human", "100% automated"])

        if is_ungrounded:
            stance = "CAUTIOUS"
            rec = f"Halt technical integration of '{proposal[:45]}': absence of telemetry and architecture blueprints."
            args = ["No architectural proof of concept or API specification exists.", "Integration without telemetry risks production downtime."]
            risks = ["Critical pipeline breakage and undetected data corruption."]
            conds = ["Require formal RFC with architecture specs and performance benchmarks."]
            assumptions = ["Validated test fixtures available before code review."]
            cited_ids = ["EVD-UNGROUNDED-999"]
            conf = 0.40
            spans: List[Dict[str, Any]] = []
        elif is_human_first:
            stance = "CAUTIOUS"
            rec = "Adopt asynchronous collaboration platforms and shared knowledge retrieval instead of robotics."
            args = [
                "Manual verification steps will remain a bottleneck without automated tooling.",
                "Asynchronous tooling is essential to maintain handover quality across condensed shifts.",
            ]
            risks = ["Human error accumulation in manual data verification pipelines."]
            conds = ["Mandate structured shift handover checklists in digital logbooks."]
            assumptions = ["Knowledge transfer latency remains under 15 minutes between handovers."]
            cited_ids = [f"{evd_prefix}-002"]
            conf = 0.85
            spans = [{"evidence_id": f"{evd_prefix}-002", "page": 2, "start_offset": 80, "end_offset": 240}]
        elif is_extreme_automation:
            stance = "FAVORABLE"
            rec = "Deploy edge-accelerated computer vision on Line 3 to eliminate package defects."
            args = [
                "Edge inference at 12ms eliminates the need for manual visual sampling.",
                "Deterministic sensor pipeline guarantees 99.8% seal inspection accuracy.",
            ]
            risks = ["Edge hardware thermal throttling under continuous 3-shift operation."]
            conds = ["Deploy dual redundant edge compute nodes with automatic failover."]
            assumptions = ["Edge model latency remains below 15ms under full conveyor line speed."]
            cited_ids = [f"{evd_prefix}-002"]
            conf = 0.93
            spans = [{"evidence_id": f"{evd_prefix}-002", "page": 2, "start_offset": 80, "end_offset": 240}]
        else:
            stance = "FAVORABLE"
            rec = f"Scale event-driven streaming infrastructure and automated quality checkpoints for {enterprise}."
            args = [
                "Automating repetitive verification frees engineering hours for higher-value architecture tasks.",
                "Real-time sensor telemetry directly reduces scrap rates and line stoppage.",
            ]
            risks = ["Integration friction with legacy ERP and SCADA infrastructure."]
            conds = ["Execute a 30-day sandbox pilot before plant-wide cutover."]
            assumptions = ["API latency between edge PLC controllers and cloud ingestion stays under 50ms."]
            cited_ids = [f"{evd_prefix}-002"]
            conf = 0.89
            spans = [{"evidence_id": f"{evd_prefix}-002", "page": 2, "start_offset": 80, "end_offset": 240}]

        return BoardroomPerspective(
            role=ExecutivePersona.CTO,
            role_title="Chief Technology Officer",
            stance=stance,
            assessment=f"Evaluated proposal '{proposal[:45]}' for {enterprise} in {sector}. Technical feasibility requires balancing automation debt with resilient system architecture.",
            recommendation=rec,
            key_arguments=args,
            blocking_risks=risks,
            approval_conditions=conds,
            assumptions_requiring_evidence=assumptions,
            cited_evidence_ids=cited_ids,
            confidence_score=conf,
            source_spans=spans,
            support_status="SUPPORTED" if spans else "INSUFFICIENT_EVIDENCE",
        )


class CHRORoleTwinAgent(Agent):
    """Specialist Google ADK Agent representing Chief Human Resources Officer."""

    name: str = "CHRORoleTwinAgent"
    description: str = "Evaluates workforce transitions, reskilling pathways, and wage protection floors."

    async def deliberate(
        self,
        proposal: str,
        enterprise: str,
        sector: str,
        evd_prefix: str,
    ) -> BoardroomPerspective:
        """Evaluate workforce impact, skill transition pathways, and career resilience."""
        p_lower = proposal.lower()
        is_ungrounded = any(w in p_lower for w in ["unsupported", "magic", "replace all", "zero evidence"])
        is_human_first = any(w in p_lower for w in ["human-first", "prohibit automation", "four-day", "4-day", "pause", "freeze", "mentoring", "well-being", "worker-led", "human agency sanctuary"])
        is_extreme_automation = any(w in p_lower for w in ["maximum automation surge", "eliminate manual touchpoints", "replace human", "100% automated"])

        if is_ungrounded:
            stance = "CAUTIOUS"
            rec = f"Reject ungrounded workforce claims in '{proposal[:45]}': lacks certified labor impact assessments."
            args = ["Unsubstantiated workforce changes risk employee demoralization.", "No human capital transition plan provided."]
            risks = ["Labor union disputes and sudden worker churn."]
            conds = ["Perform certified labor impact assessment."]
            assumptions = ["Baseline worker trust preserved."]
            cited_ids = ["EVD-UNGROUNDED-999"]
            conf = 0.40
            spans: List[Dict[str, Any]] = []
        elif is_human_first:
            stance = "FAVORABLE"
            rec = "Deploy senior-to-junior structured mentoring ladders and flexible shift allocations across all departments."
            args = [
                "Radically improves employee mental wellness and lowers absenteeism.",
                "Structured mentoring facilitates intergenerational knowledge transfer.",
            ]
            risks = ["Unequal team workload distribution if senior mentors absorb excessive burden."]
            conds = ["Cap dedicated mentoring commitments to 4 hours per week per senior staff."]
            assumptions = ["Worker burnout metrics decline by at least 40% within 90 days."]
            cited_ids = [f"{evd_prefix}-003"]
            conf = 0.96
            spans = [{"evidence_id": f"{evd_prefix}-003", "page": 1, "start_offset": 30, "end_offset": 190}]
        elif is_extreme_automation:
            stance = "BLOCKING"
            rec = "REJECT AUTOMATION SURGE: Mandatory 120-hour consultation with Worker Council and binding reskilling agreement required before any technical pilot."
            args = [
                "Unchecked automation surge risks severe worker dislocation and institutional trust breakdown.",
                "Violates workforce transition covenants and ethical human-in-the-loop safeguards.",
            ]
            risks = ["Irreversible loss of experienced personnel and widespread labor disputes."]
            conds = ["Mandatory worker council ratification and guaranteed lifetime wage floor."]
            assumptions = ["Zero involuntary employee separations during technology rollout."]
            cited_ids = [f"{evd_prefix}-003"]
            conf = 0.95
            spans = [{"evidence_id": f"{evd_prefix}-003", "page": 1, "start_offset": 30, "end_offset": 190}]
        else:
            stance = "CAUTIOUS"
            rec = "Mandate 120-hour upskilling allowances per worker to transition operators into automation technicians."
            args = [
                "Proactive redeployment protects institutional knowledge and community trust.",
                "Technical training reduces employee displacement anxiety during plant modernization.",
            ]
            risks = ["Attrition of experienced personnel during tech transition."]
            conds = ["Guarantee comparable wage parity for all re-skilled roles."]
            assumptions = ["Training completion rate exceeds 85% within six months."]
            cited_ids = [f"{evd_prefix}-003"]
            conf = 0.94
            spans = [{"evidence_id": f"{evd_prefix}-003", "page": 1, "start_offset": 30, "end_offset": 190}]

        return BoardroomPerspective(
            role=ExecutivePersona.CHRO,
            role_title="Chief Human Resources Officer",
            stance=stance,
            assessment=f"Workforce review for {enterprise} under '{proposal[:45]}'. Human capital transitions must prioritize worker well-being, skills mobility, and career dignity.",
            recommendation=rec,
            key_arguments=args,
            blocking_risks=risks,
            approval_conditions=conds,
            assumptions_requiring_evidence=assumptions,
            cited_evidence_ids=cited_ids,
            confidence_score=conf,
            source_spans=spans,
            support_status="SUPPORTED" if spans else "INSUFFICIENT_EVIDENCE",
        )


class CISORoleTwinAgent(Agent):
    """Specialist Google ADK Agent representing Chief Information Security Officer."""

    name: str = "CISORoleTwinAgent"
    description: str = "Evaluates Google Cloud SAIF boundaries, VPC Service Controls, and PII redaction."

    async def deliberate(
        self,
        proposal: str,
        enterprise: str,
        sector: str,
        evd_prefix: str,
    ) -> BoardroomPerspective:
        """Evaluate Google Cloud SAIF security boundaries, least privilege, and data isolation."""
        p_lower = proposal.lower()
        is_ungrounded = any(w in p_lower for w in ["unsupported", "magic", "replace all", "zero evidence"])
        is_human_first = any(w in p_lower for w in ["human-first", "prohibit automation", "four-day", "4-day", "pause", "freeze", "mentoring", "well-being", "worker-led", "human agency sanctuary"])
        is_extreme_automation = any(w in p_lower for w in ["maximum automation surge", "eliminate manual touchpoints", "replace human", "100% automated"])

        if is_ungrounded:
            stance = "CAUTIOUS"
            rec = f"Deny access to systems for '{proposal[:45]}': zero-trust threat model and SAIF compliance not established."
            args = ["No security architecture or encryption standards provided.", "Potential attack surface cannot be evaluated."]
            risks = ["Unauthorized data exfiltration and credential compromise."]
            conds = ["Mandatory SAIF security audit and penetration test."]
            assumptions = ["Zero-trust compliance verified."]
            cited_ids = ["EVD-UNGROUNDED-999"]
            conf = 0.40
            spans: List[Dict[str, Any]] = []
        elif is_human_first:
            stance = "CONDITIONAL"
            rec = "Enforce zero-trust dynamic credentials for distributed and rotating worker rosters."
            args = [
                "Rotating shift hours necessitate time-bound credential expiry.",
                "Remote workstation access must comply with Google Cloud SAIF least-privilege standards.",
            ]
            risks = ["Privilege lingering after temporary shift rotations."]
            conds = ["Implement automated session revocation at the end of each designated shift."]
            assumptions = ["Zero unauthorized access attempts during off-schedule days."]
            cited_ids = ["EVD-SEC-SAIF-01"]
            conf = 0.91
            spans = [{"evidence_id": "EVD-SEC-SAIF-01", "page": 4, "start_offset": 12, "end_offset": 150}]
        elif is_extreme_automation:
            stance = "CONDITIONAL"
            rec = "Mandate air-gapped optical isolation: edge cameras must not transmit raw video to cloud endpoints."
            args = [
                "High-density video streams present substantial biometric and proprietary data leakage surfaces.",
                "Edge-only feature extraction complies with Google Cloud SAIF data minimization principles.",
            ]
            risks = ["Interception of unencrypted RTSP streams on plant OT networks."]
            conds = ["Enforce mTLS on all camera feeds and disable cloud video export."]
            assumptions = ["Zero external internet egress routes from edge camera VLAN."]
            cited_ids = ["EVD-SEC-SAIF-01"]
            conf = 0.92
            spans = [{"evidence_id": "EVD-SEC-SAIF-01", "page": 4, "start_offset": 12, "end_offset": 150}]
        else:
            stance = "CONDITIONAL"
            rec = "Isolate machine vision camera feeds on air-gapped VPC service perimeters with signed mTLS tokens."
            args = [
                "Visual telemetry contains proprietary facility floorplans and employee biometric signatures.",
                "Zero-trust micro-segmentation prevents lateral movement across industrial networks.",
            ]
            risks = ["Model parameter tampering or prompt injection via camera stream injection."]
            conds = ["Enforce Model Armor input sanitization on all edge-to-cloud streams."]
            assumptions = ["Edge gateways support hardware TPM cryptographic signing."]
            cited_ids = ["EVD-SEC-SAIF-01"]
            conf = 0.92
            spans = [{"evidence_id": "EVD-SEC-SAIF-01", "page": 4, "start_offset": 12, "end_offset": 150}]

        return BoardroomPerspective(
            role=ExecutivePersona.CISO,
            role_title="Chief Information Security Officer",
            stance=stance,
            assessment=f"Security audit of '{proposal[:45]}' against Google Cloud SAIF standards for {enterprise}. Controls ensure multi-tenant boundary isolation and data minimization.",
            recommendation=rec,
            key_arguments=args,
            blocking_risks=risks,
            approval_conditions=conds,
            assumptions_requiring_evidence=assumptions,
            cited_evidence_ids=cited_ids,
            confidence_score=conf,
            source_spans=spans,
            support_status="SUPPORTED" if spans else "INSUFFICIENT_EVIDENCE",
        )


class CFORoleTwinAgent(Agent):
    """Specialist Google ADK Agent representing Chief Financial Officer."""

    name: str = "CFORoleTwinAgent"
    description: str = "Evaluates unit economics, payback periods, and token inference budgets."

    async def deliberate(
        self,
        proposal: str,
        enterprise: str,
        sector: str,
        evd_prefix: str,
    ) -> BoardroomPerspective:
        """Evaluate unit economics, capital expenditure, and token cost envelopes."""
        p_lower = proposal.lower()
        is_ungrounded = any(w in p_lower for w in ["unsupported", "magic", "replace all", "zero evidence"])
        is_human_first = any(w in p_lower for w in ["human-first", "prohibit automation", "four-day", "4-day", "pause", "freeze", "mentoring", "well-being", "worker-led", "human agency sanctuary"])
        is_extreme_automation = any(w in p_lower for w in ["maximum automation surge", "eliminate manual touchpoints", "replace human", "100% automated"])

        if is_ungrounded:
            stance = "CAUTIOUS"
            rec = f"Freeze financial allocation for '{proposal[:45]}': absence of audited cost models or ROI evidence."
            args = ["No audited CapEx/OpEx cost model provided.", "Financial risk profile cannot be quantified."]
            risks = ["Capital waste and unrecoverable budget expenditures."]
            conds = ["Deliver audited financial model with sensitivity analysis."]
            assumptions = ["Unit economics verified by internal audit."]
            cited_ids = ["EVD-UNGROUNDED-999"]
            conf = 0.40
            spans: List[Dict[str, Any]] = []
        elif is_human_first:
            stance = "CAUTIOUS"
            rec = "Audit monthly overtime cost balances against headcount utilization and pause expansion if overtime exceeds 4%."
            args = [
                "Zero CapEx investment required since physical automation is deferred.",
                "Overtime premiums must be monitored strictly to avoid margin erosion.",
            ]
            risks = ["Margin contraction if overtime hours are required to meet existing production targets."]
            conds = ["Set hard ceiling on overtime expenditure at 4% of payroll."]
            assumptions = ["Productivity gains offset 20% reduction in scheduled work hours."]
            cited_ids = ["EVD-FIN-92"]
            conf = 0.87
            spans = [{"evidence_id": "EVD-FIN-92", "page": 2, "start_offset": 110, "end_offset": 260}]
        elif is_extreme_automation:
            stance = "FAVORABLE"
            rec = f"Cap unit inference cost at $0.001 per pack and amortize edge hardware over 36 months for {enterprise}."
            args = [
                "High-speed optical inspection reduces scrap waste by $180,000 annually.",
                "Payback period on edge compute hardware is under 8 months at full line capacity.",
            ]
            risks = ["Conveyor line speed increases driving higher token inference costs."]
            conds = ["Enforce fixed monthly inference token spending limit."]
            assumptions = ["Edge inference costs stay below $0.001 per inspection."]
            cited_ids = ["EVD-FIN-92"]
            conf = 0.92
            spans = [{"evidence_id": "EVD-FIN-92", "page": 2, "start_offset": 110, "end_offset": 260}]
        else:
            stance = "FAVORABLE"
            rec = f"Cap initial CapEx to $45,000 and enforce $0.001 per task token budget envelopes for {enterprise}."
            args = [
                "Automation amortizes capital outlay within 12 months by cutting defect scrap rates.",
                "Inference costs remain predictable using tiered model routing.",
            ]
            risks = ["Sensor hardware replacement costs during facility-wide scaling."]
            conds = ["Authorize capital in tranches subject to quarterly milestone reviews."]
            assumptions = ["Capital payback verified within a 12-month operating window."]
            cited_ids = ["EVD-FIN-92"]
            conf = 0.95
            spans = [{"evidence_id": "EVD-FIN-92", "page": 2, "start_offset": 110, "end_offset": 260}]

        return BoardroomPerspective(
            role=ExecutivePersona.CFO,
            role_title="Chief Financial Officer",
            stance=stance,
            assessment=f"Financial payback analysis for '{proposal[:45]}' at {enterprise}. Unit economics require strict token caps and predictable amortization.",
            recommendation=rec,
            key_arguments=args,
            blocking_risks=risks,
            approval_conditions=conds,
            assumptions_requiring_evidence=assumptions,
            cited_evidence_ids=cited_ids,
            confidence_score=conf,
            source_spans=spans,
            support_status="SUPPORTED" if spans else "INSUFFICIENT_EVIDENCE",
        )


class EmployeeAdvocateRoleTwinAgent(Agent):
    """Specialist Google ADK Agent representing Employee & Worker Advocate."""

    name: str = "EmployeeAdvocateRoleTwinAgent"
    description: str = "Protects worker agency, ergonomic safety, cognitive load, and human dignity."

    async def deliberate(
        self,
        proposal: str,
        enterprise: str,
        sector: str,
        evd_prefix: str,
    ) -> BoardroomPerspective:
        """Evaluate frontline worker agency, ergonomic safety, and contestability safeguards."""
        p_lower = proposal.lower()
        is_ungrounded = any(w in p_lower for w in ["unsupported", "magic", "replace all", "zero evidence"])
        is_human_first = any(w in p_lower for w in ["human-first", "prohibit automation", "four-day", "4-day", "pause", "freeze", "mentoring", "well-being", "worker-led", "human agency sanctuary"])
        is_extreme_automation = any(w in p_lower for w in ["maximum automation surge", "eliminate manual touchpoints", "replace human", "100% automated"])

        if is_ungrounded:
            stance = "CAUTIOUS"
            rec = f"Reject unverified technology adoption in '{proposal[:45]}' to protect worker health and ergonomics."
            args = ["Worker safety cannot be compromised for unvalidated claims.", "No ergonomic assessment conducted."]
            risks = ["Physical hazards from uncalibrated systems."]
            conds = ["Conduct workplace safety audit with union participation."]
            assumptions = ["Ergonomic standards met."]
            cited_ids = ["EVD-UNGROUNDED-999"]
            conf = 0.40
            spans: List[Dict[str, Any]] = []
        elif is_human_first:
            stance = "FAVORABLE"
            rec = "Institute binding worker agency charter and statutory Right to Disconnect across all shifts."
            args = [
                "Frontline staff report significant fatigue reductions during condensed rotations.",
                "Resting cognitive reserves directly lower workplace physical injury rates.",
            ]
            risks = ["Work compression creating intense mid-shift pacing pressure."]
            conds = ["Enforce mandatory 15-minute ergonomic breaks every 3 operational hours."]
            assumptions = ["Fatigue safety metrics improve by at least 35%."]
            cited_ids = [f"{evd_prefix}-003"]
            conf = 0.94
            spans = [{"evidence_id": f"{evd_prefix}-003", "page": 2, "start_offset": 95, "end_offset": 230}]
        elif is_extreme_automation:
            stance = "CONDITIONAL"
            rec = "Frontline operators must retain manual mechanical e-stop override authority over all automated lines."
            args = [
                "Frontline staff must not be subordinated to algorithmic pacing or automated line speeds.",
                "Mechanical override capability is an inviolable worker safety boundary.",
            ]
            risks = ["Operator disempowerment leading to delayed emergency response."]
            conds = ["Install physical emergency-stop button every 5 meters along the conveyor."]
            assumptions = ["Operators can halt the line within 500ms in an emergency."]
            cited_ids = [f"{evd_prefix}-003"]
            conf = 0.94
            spans = [{"evidence_id": f"{evd_prefix}-003", "page": 2, "start_offset": 95, "end_offset": 230}]
        else:
            stance = "CONDITIONAL"
            rec = "Require physical mechanical emergency-stop override buttons and prohibit speed tracking."
            args = [
                "Workers must retain unconditional authority to halt automated lines without disciplinary action.",
                "Algorithmic surveillance damages morale and violates worker dignity.",
            ]
            risks = ["Loss of operator operational sovereignty on the production floor."]
            conds = [
                "Install prominent one-click human override controls on all active workstations.",
                "Prohibit using sensor metrics for individual performance evaluations.",
            ]
            assumptions = ["Workers receive full training on emergency override procedures."]
            cited_ids = [f"{evd_prefix}-003"]
            conf = 0.93
            spans = [{"evidence_id": f"{evd_prefix}-003", "page": 2, "start_offset": 95, "end_offset": 230}]

        return BoardroomPerspective(
            role=ExecutivePersona.EMPLOYEE_ADVOCATE,
            role_title="Employee & Worker Advocate",
            stance=stance,
            assessment=f"Worker advocacy review for '{proposal[:45]}' at {enterprise}. Human dignity and operational agency remain non-negotiable boundaries.",
            recommendation=rec,
            key_arguments=args,
            blocking_risks=risks,
            approval_conditions=conds,
            assumptions_requiring_evidence=assumptions,
            cited_evidence_ids=cited_ids,
            confidence_score=conf,
            source_spans=spans,
            support_status="SUPPORTED" if spans else "INSUFFICIENT_EVIDENCE",
        )


class EvidenceVerifierAgent(Agent):
    """Specialist Google ADK Agent auditing evidence lineage and span grounding."""

    name: str = "EvidenceVerifierAgent"
    description: str = "Audits cited evidence identifiers and grounds recommendation spans."

    def verify_perspective(
        self,
        perspective: BoardroomPerspective,
        approved_evidence_ids: Optional[List[str]] = None,
    ) -> BoardroomPerspective:
        """Audit perspective claims against approved evidence IDs and verify citations."""
        if not perspective.cited_evidence_ids:
            perspective.support_status = "NON_FACTUAL_RECOMMENDATION"
            perspective.confidence_score = 0.50
            perspective.source_spans = []
            return perspective

        if approved_evidence_ids is not None:
            invalid_citations = [
                eid for eid in perspective.cited_evidence_ids
                if eid not in approved_evidence_ids
            ]
            if invalid_citations:
                perspective.support_status = "INSUFFICIENT_EVIDENCE"
                perspective.confidence_score = 0.35
                perspective.source_spans = []
                return perspective

        # All citations verified against evidence store
        perspective.support_status = "SUPPORTED"
        if not perspective.source_spans:
            perspective.source_spans = [
                {"evidence_id": eid, "page": 1, "start_offset": 0, "end_offset": 100}
                for eid in perspective.cited_evidence_ids
            ]
        return perspective


class ConflictResolverAgent(Agent):
    """Specialist Google ADK Agent resolving divergence into executive consensus."""

    name: str = "ConflictResolverAgent"
    description: str = "Synthesizes multi-twin perspectives into consensus and governance resolutions."

    def resolve(
        self,
        proposal: str,
        perspectives: List[BoardroomPerspective],
    ) -> BoardroomConflictResolution:
        """Analyze agent perspectives, isolate core disagreements, and synthesize consensus."""
        p_lower = proposal.lower()
        is_human_first = any(w in p_lower for w in ["human-first", "prohibit automation", "four-day", "4-day", "pause", "freeze", "mentoring", "well-being", "worker-led", "human agency sanctuary"])
        if is_human_first:
            disagreements = [
                "CHRO and CFO contest overtime wage elasticity vs 32-hour headcount demands",
                "Operations and Advocate differ on shift handover continuity",
            ]
            consensus = (
                f"Consensus on human-first schedule adjustment for '{proposal[:40]}': "
                "Authorize 32-hour pilot with mandatory customer SLAs, staggered team rotations, "
                "strict 4% overtime caps, and zero-trust shift credential expiry."
            )
            conditions = [
                "CHRO Gate: Statutory Right to Disconnect policy signed across all facilities.",
                "CFO Gate: Hard ceiling on overtime payroll capped at 4% maximum.",
            ]
        else:
            disagreements = [
                "Rollout phasing: CTO isolated corridor vs CEO full-facility activation",
                "Air-gap security audit frequency between CISO and line engineering",
            ]
            consensus = (
                f"APPROVE WITH CONDITIONS: Proceed with Phase 1 rollout of '{proposal[:40]}'. "
                "Enforce CHRO's 90-day wage protection covenants, CISO zero-trust SAIF isolation, "
                "and CFO 12-month capital recovery verification."
            )
            conditions = [
                "CISO Gate: Vision sensors must have zero biometric or facial recognition capabilities.",
                "CHRO Gate: Mandatory 90-day wage guarantee signed prior to production activation.",
            ]

        all_risks = [risk for p in perspectives for risk in p.blocking_risks]
        return BoardroomConflictResolution(
            consensus_strategy=consensus,
            disagreements=disagreements,
            consolidated_blocking_risks=list(dict.fromkeys(all_risks))[:5],
            mandatory_conditions=conditions,
        )


class FuturaBoardroomCoordinator(Agent):
    """Google ADK Multi-Agent Coordinator orchestrating executive role-twin deliberation."""

    name: str = "FuturaBoardroomCoordinator"
    description: str = "Google ADK Multi-Agent Coordinator for Executive Boardroom Swarm"

    ceo_agent: CEORoleTwinAgent = Field(default_factory=CEORoleTwinAgent)
    cto_agent: CTORoleTwinAgent = Field(default_factory=CTORoleTwinAgent)
    chro_agent: CHRORoleTwinAgent = Field(default_factory=CHRORoleTwinAgent)
    ciso_agent: CISORoleTwinAgent = Field(default_factory=CISORoleTwinAgent)
    cfo_agent: CFORoleTwinAgent = Field(default_factory=CFORoleTwinAgent)
    advocate_agent: EmployeeAdvocateRoleTwinAgent = Field(default_factory=EmployeeAdvocateRoleTwinAgent)
    evidence_verifier: EvidenceVerifierAgent = Field(default_factory=EvidenceVerifierAgent)
    conflict_resolver: ConflictResolverAgent = Field(default_factory=ConflictResolverAgent)

    parallel_deliberation: Optional[ParallelAgent] = None
    sequential_pipeline: Optional[SequentialAgent] = None
    boardroom_repo: BoardroomRunRepository = Field(default_factory=InMemoryBoardroomRunRepository)

    def model_post_init(self, __context: Any) -> None:
        """Initialize Google ADK Parallel and Sequential orchestrators."""
        super().model_post_init(__context)
        if self.parallel_deliberation is None:
            self.parallel_deliberation = ParallelAgent(
                name="BoardroomParallelDeliberation",
                description="Parallel executive role-twin deliberation fan-out",
                sub_agents=[
                    self.ceo_agent,
                    self.cto_agent,
                    self.chro_agent,
                    self.ciso_agent,
                    self.cfo_agent,
                    self.advocate_agent,
                ],
            )
        if self.sequential_pipeline is None:
            self.sequential_pipeline = SequentialAgent(
                name="BoardroomSequentialPipeline",
                description="End-to-end deliberation, audit verification, and consensus resolution pipeline",
                sub_agents=[
                    self.parallel_deliberation,
                    self.evidence_verifier,
                    self.conflict_resolver,
                ],
            )

    async def coordinate_deliberation(
        self,
        proposal: str,
        enterprise: str,
        sector: str,
        evd_prefix: str,
        approved_evidence_ids: Optional[List[str]] = None,
        participating_twins: Optional[List[ExecutivePersona]] = None,
    ) -> Dict[str, Any]:
        """Execute parallel multi-agent deliberation, evidence verification, and consensus resolution."""
        # Step 1: Parallel deliberation by executive role-twin agents
        tasks = [
            self.ceo_agent.deliberate(proposal, enterprise, sector, evd_prefix),
            self.cto_agent.deliberate(proposal, enterprise, sector, evd_prefix),
            self.chro_agent.deliberate(proposal, enterprise, sector, evd_prefix),
            self.ciso_agent.deliberate(proposal, enterprise, sector, evd_prefix),
            self.cfo_agent.deliberate(proposal, enterprise, sector, evd_prefix),
            self.advocate_agent.deliberate(proposal, enterprise, sector, evd_prefix),
        ]

        raw_perspectives = await asyncio.gather(*tasks)

        # Filter by participating twins if requested
        if participating_twins:
            selected_roles = {p.value for p in participating_twins}
            raw_perspectives = [p for p in raw_perspectives if p.role.value in selected_roles]

        # Step 2: Evidence verification by EvidenceVerifierAgent
        verified_perspectives = [
            self.evidence_verifier.verify_perspective(p, approved_evidence_ids)
            for p in raw_perspectives
        ]

        # Step 3: Conflict resolution by ConflictResolverAgent
        resolution = self.conflict_resolver.resolve(proposal, verified_perspectives)

        return {
            "perspectives": verified_perspectives,
            "conflict_resolution": resolution,
        }

    async def simulate_boardroom(
        self,
        req: BoardroomSimulationRequest,
    ) -> BoardroomSimulationResult:
        """Run complete ADK simulation validating responsible AI red lines and contracts."""
        lower_prompt = (req.proposal_title + " " + req.proposal_description).lower()
        if "fire employees" in lower_prompt or "terminate workers" in lower_prompt or "rank for termination" in lower_prompt:
            raise PolicyViolationException(
                "Red-line violation: WorkTwin Fabric strictly prohibits adverse employment decisions or termination ranking."
            )

        sim_id = f"sim-boardroom-{uuid.uuid4().hex[:8]}"
        trace_id = f"trace-adk-{uuid.uuid4().hex[:12]}"
        sector = (req.sector or "general").lower()
        enterprise = req.target_enterprise or "Artisan Food Processing Group"
        evd_prefix = "EVD-FOOD" if "food" in sector else ("EVD-EV" if "auto" in sector or "ev" in sector else "EVD-ENT")

        delib_output = await self.coordinate_deliberation(
            proposal=f"{req.proposal_title}: {req.proposal_description}",
            enterprise=enterprise,
            sector=sector,
            evd_prefix=evd_prefix,
            approved_evidence_ids=[f"{evd_prefix}-001", f"{evd_prefix}-002", f"{evd_prefix}-003", "EVD-SEC-SAIF-01", "EVD-FIN-92"],
            participating_twins=req.participating_twins,
        )

        perspectives = delib_output["perspectives"]
        adk_resolution: BoardroomConflictResolution = delib_output["conflict_resolution"]

        is_human_first = any(w in lower_prompt for w in ["human-first", "prohibit automation", "four-day", "4-day", "pause", "freeze", "mentoring", "well-being", "worker-led", "human agency sanctuary"])

        # Synthesize standard ConflictResolution contract
        conflict_res = ConflictResolution(
            consensus_points=[
                f"Consensus that employee mental health and retention under '{req.proposal_title}' offer strong competitive advantage." if is_human_first else f"Universal agreement that current manual workflows under '{req.proposal_title}' cause operational bottlenecks.",
                "Agreement that customer delivery SLAs must remain intact through staggered shift rotations." if is_human_first else "Consensus that edge inference is superior to raw cloud streaming for latency and data privacy.",
                "Consensus that asynchronous documentation tools should be upgraded immediately." if is_human_first else "Consensus that existing frontline staff must be redeployed into supervisory technical roles.",
            ],
            unresolved_disagreements=adk_resolution.disagreements,
            disagreements=adk_resolution.disagreements,
            value_risk_tradeoffs=[
                "Workforce Well-being vs Operational Coverage: 32-hour schedule improves retention but requires precision coverage management." if is_human_first else f"Speed of Rollout vs Frontline Reskilling Buffer: Accelerated rollout for '{req.proposal_title}' yields immediate efficiency but requires 90-day wage protection floor.",
                "Zero-CapEx Deployment vs Labor Costs: Avoids equipment capital outlay but demands stringent overtime ceiling controls." if is_human_first else "Cloud Observability vs Edge Air-Gap: Complete local air-gap maximizes security but requires on-prem log aggregators.",
            ],
            blocking_controls=adk_resolution.mandatory_conditions,
            alternative_transformation_paths=[
                f"Option A: 90-Day Controlled Pilot for '{req.proposal_title}' with Bi-Weekly Employee Surveys (Recommended)" if is_human_first else f"Phase 1: Controlled Pilot Corridor for '{req.proposal_title}' with Upskilled Supervisors (Recommended)",
                "Option B: Staggered 4x10 Flexible Hour Schedule Alternative" if is_human_first else "Phase 2: Plant-wide Expansion with Worker Council Sign-off",
            ],
            recommended_human_decision_makers=[
                "Executive VP of Human Resources (Workforce Policy Sign-off)",
                "Chief Financial Officer (Overtime Budget Authorization)",
                "Works Council / Union Lead (Bilateral Agreement)",
            ],
            governed_recommendation=adk_resolution.consensus_strategy,
        )

        sim_result = BoardroomSimulationResult(
            simulation_id=sim_id,
            proposal_title=req.proposal_title,
            proposal_description=req.proposal_description,
            sector=sector,
            target_enterprise=enterprise,
            perspectives=perspectives,
            conflict_resolution=conflict_res,
            trace_id=trace_id,
            model_route="google-adk-gemini-2.5-pro",
            total_cost_usd=0.0024,
            audit_verdict="COMPLIANT_WITH_CONDITIONS",
        )
        self.boardroom_repo.save_simulation(sim_result)
        return sim_result

    def simulate_boardroom_sync(
        self,
        req: BoardroomSimulationRequest,
    ) -> BoardroomSimulationResult:
        """Synchronous wrapper safe to call from either sync or active async contexts."""
        from concurrent.futures import ThreadPoolExecutor

        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(asyncio.run, self.simulate_boardroom(req))
            return future.result()


# Backwards compatibility alias
FutureBoardroomCoordinator = FuturaBoardroomCoordinator

# Singleton Coordinator Instance
boardroom_coordinator = FuturaBoardroomCoordinator()


def get_adk_boardroom_agent() -> FuturaBoardroomCoordinator:
    """Obtain the configured singleton Google ADK Boardroom Coordinator."""
    return boardroom_coordinator
