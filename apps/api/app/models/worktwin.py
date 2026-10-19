from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class TwinType(str, Enum):
    """Classification of digital work twins."""

    ROLE_TWIN = "ROLE_TWIN"  # Synthetic role archetype (Default, no individual identity)
    PERSONAL_WORKTWIN = "PERSONAL_WORKTWIN"  # Opt-in, employee-visible, revocable assistant
    ORGANIZATION_TWIN = "ORGANIZATION_TWIN"  # Aggregate organizational graph simulation


class AutonomyLevel(str, Enum):
    """Governed autonomy hierarchy for WorkTwins."""

    WT0_OBSERVE = "WT0_OBSERVE"  # Read & organize approved knowledge
    WT1_ASSIST = "WT1_ASSIST"  # Generate recommendations & learning paths
    WT2_SIMULATE = "WT2_SIMULATE"  # Sandbox simulation (Boardroom, Sandbox)
    WT3_PREPARE = "WT3_PREPARE"  # Prepare tickets/workflows (human approval required)
    WT4_EXECUTE = "WT4_EXECUTE"  # Perform reversible sandbox actions after sign-off
    WT5_CONSEQUENTIAL = "WT5_CONSEQUENTIAL"  # Hiring, firing, discipline (PROHIBITED)


class TwinStatus(str, Enum):
    """Operational lifecycle state of a WorkTwin."""

    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    REVOKED = "REVOKED"
    DRAFT = "DRAFT"
    ARCHIVED = "ARCHIVED"


class ExecutivePersona(str, Enum):
    """Role archetype twins participating in Future Boardroom deliberations."""

    CEO = "CEO"  # Strategic viability & enterprise growth
    CTO = "CTO"  # Technology maturity & technical debt
    CFO = "CFO"  # Unit economics, ROI, and cost envelopes
    CHRO = "CHRO"  # Worker fairness, job redesign, & transitions
    CISO = "CISO"  # Data boundaries & SAIF security controls
    COO = "COO"  # Operational feasibility & throughput
    SUSTAINABILITY = "SUSTAINABILITY"  # Environmental & societal impact
    EMPLOYEE_ADVOCATE = "EMPLOYEE_ADVOCATE"  # Worker autonomy, workload, & contestability


class WorkTwinManifest(BaseModel):
    """Typed, versioned metadata contract defining a WorkTwin's boundary."""

    twin_id: str = Field(..., description="Unique deterministic identifier for the twin")
    tenant_id: str = Field(..., description="Multi-tenant boundary identifier")
    twin_type: TwinType = Field(default=TwinType.ROLE_TWIN, description="Twin class")
    role_archetype: str = Field(..., description="Role title or archetype represented")
    owner_id: Optional[str] = Field(default=None, description="Employee ID if PersonalWorkTwin")
    declared_purpose: str = Field(..., description="Explicit permitted business purpose")
    autonomy_level: AutonomyLevel = Field(default=AutonomyLevel.WT2_SIMULATE)
    status: TwinStatus = Field(default=TwinStatus.ACTIVE)
    skills: List[str] = Field(default_factory=list, description="Allowed skill competencies")
    allowed_tools: List[str] = Field(default_factory=list, description="MCP and tool allowlist")
    approved_evidence_collections: List[str] = Field(default_factory=list)
    memory_namespaces: List[str] = Field(default_factory=list)
    model_tier: str = Field(default="workhorse")
    cost_budget_usd: float = Field(default=0.50, description="Max session token budget")
    disclosure_text: str = Field(
        default="Synthetic Role Archetype • Represents role-based perspective, not actual human thoughts.",
        description="Mandatory transparency notice",
    )
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BoardroomPerspective(BaseModel):
    """Independent evaluation of a transformation proposal from a role twin."""

    role: ExecutivePersona
    role_title: str
    stance: str = Field(..., description="FAVORABLE | CAUTIOUS | BLOCKING | CONDITIONAL | SKEPTICAL | OPPOSED")
    assessment: str
    recommendation: Optional[str] = Field(default=None, description="Specific executive recommendation")
    key_arguments: List[str] = Field(default_factory=list)
    blocking_risks: List[str] = Field(default_factory=list)
    identified_risks: List[str] = Field(default_factory=list)
    approval_conditions: List[str] = Field(default_factory=list)
    mandatory_conditions: List[str] = Field(default_factory=list)
    assumptions_requiring_evidence: List[str] = Field(default_factory=list)
    cited_evidence_ids: List[str] = Field(default_factory=list)
    evidence_citations: List[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.92, ge=0.0, le=1.0)
    source_spans: List[Dict[str, Any]] = Field(default_factory=list)
    autonomy_limit: str = Field(default="WT2_SIMULATE")
    support_status: str = Field(
        default="SUPPORTED",
        description="SUPPORTED | INSUFFICIENT_EVIDENCE | NON_FACTUAL_RECOMMENDATION",
    )

    @model_validator(mode="before")
    @classmethod
    def sync_perspective_fields(cls, data: Any) -> Any:
        """Synchronize dual perspective risk, condition, and evidence citations."""
        if isinstance(data, dict):
            if "blocking_risks" in data and "identified_risks" not in data:
                data["identified_risks"] = data["blocking_risks"]
            elif "identified_risks" in data and "blocking_risks" not in data:
                data["blocking_risks"] = data["identified_risks"]

            if "approval_conditions" in data and "mandatory_conditions" not in data:
                data["mandatory_conditions"] = data["approval_conditions"]
            elif "mandatory_conditions" in data and "approval_conditions" not in data:
                data["approval_conditions"] = data["mandatory_conditions"]

            if "cited_evidence_ids" in data and "evidence_citations" not in data:
                data["evidence_citations"] = data["cited_evidence_ids"]
            elif "evidence_citations" in data and "cited_evidence_ids" not in data:
                data["cited_evidence_ids"] = data["evidence_citations"]
        return data


class ConflictResolution(BaseModel):
    """Synthesized consensus, trade-offs, and governance resolution from multi-twin debate."""

    consensus_points: List[str] = Field(default_factory=list)
    unresolved_disagreements: List[str] = Field(default_factory=list)
    disagreements: List[str] = Field(default_factory=list)
    value_risk_tradeoffs: List[str] = Field(default_factory=list)
    trade_offs: List[str] = Field(default_factory=list)
    blocking_controls: List[str] = Field(default_factory=list)
    alternative_transformation_paths: List[str] = Field(default_factory=list)
    recommended_human_decision_makers: List[str] = Field(default_factory=list)
    required_human_approvers: List[str] = Field(default_factory=list)
    governed_recommendation: str = Field(default="GOVERNED_APPROVAL_WITH_CONDITIONS")

    @model_validator(mode="before")
    @classmethod
    def sync_resolution_fields(cls, data: Any) -> Any:
        """Synchronize dual conflict resolution decision makers, approvers, and trade-offs."""
        if isinstance(data, dict):
            if "recommended_human_decision_makers" in data and "required_human_approvers" not in data:
                data["required_human_approvers"] = data["recommended_human_decision_makers"]
            elif "required_human_approvers" in data and "recommended_human_decision_makers" not in data:
                data["recommended_human_decision_makers"] = data["required_human_approvers"]

            if "value_risk_tradeoffs" in data and "trade_offs" not in data:
                data["trade_offs"] = data["value_risk_tradeoffs"]
            elif "trade_offs" in data and "value_risk_tradeoffs" not in data:
                data["value_risk_tradeoffs"] = data["trade_offs"]
        return data


class BoardroomConflictResolution(BaseModel):
    """Reconciled consensus, disagreements, and conditions from ADK specialist role twins."""

    consensus_strategy: str
    disagreements: List[str]
    consolidated_blocking_risks: List[str] = Field(default_factory=list)
    mandatory_conditions: List[str] = Field(default_factory=list)


class BoardroomSimulationRequest(BaseModel):
    """Payload to trigger a Future Boardroom multi-twin evaluation."""

    proposal_title: str = Field(..., description="Name of the transformation proposal")
    proposal_description: str = Field(..., description="Details of proposed operating model")
    sector: str = Field(default="food_manufacturing")
    target_enterprise: str = Field(default="Artisan Food Processing Group")
    participating_twins: Optional[List[ExecutivePersona]] = None
    tenant_id: Optional[str] = None


class BoardroomSimulationResult(BaseModel):
    """Complete result of a Future Boardroom multi-agent simulation."""

    simulation_id: str
    proposal_title: str
    proposal_description: str
    sector: str
    target_enterprise: str
    perspectives: List[BoardroomPerspective]
    conflict_resolution: ConflictResolution
    trace_id: str
    model_route: str
    total_cost_usd: float
    audit_verdict: str
    adk_session_id: Optional[str] = None
    adk_runner_status: Optional[str] = "COMPLETED"


# Alias for response schema compatibility
BoardroomSimulationResponse = BoardroomSimulationResult


class PersonalWorkTwinConsent(BaseModel):
    """Employee consent and boundary contract for PersonalWorkTwin (Opt-in Demo)."""

    employee_id: str
    tenant_id: Optional[str] = None
    knowledge_consent: bool = True
    writing_style_consent: bool = True
    delegated_task_consent: bool = True
    voice_avatar_consent: bool = False  # Prohibited / strictly opt-in
    revoked: bool = False
    consent_timestamp: str
