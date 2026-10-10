"""Pydantic schemas for organization onboarding and initial data intake."""

from datetime import datetime, timezone

from pydantic import BaseModel, Field


class OnboardingRequest(BaseModel):
    """Organization onboarding intake payload."""

    organization_name: str = Field(..., min_length=2)
    sector: str = "food_manufacturing"  # food_manufacturing | healthcare | banking
    headcount: int = Field(..., gt=0)
    primary_strategic_goal: str
    contact_email: str
    consent_purpose: str = "Operating model simulation and workforce transition analysis"
    consent_granted: bool = True


class OnboardingResponse(BaseModel):
    """Onboarding confirmation and initial tenant workspace provisioning."""

    tenant_id: str
    organization_name: str
    sector: str
    status: str  # "ACTIVE_PROVISIONED"
    workspace_initialized: bool = True
    seed_nodes_count: int
    seed_scenarios_count: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
