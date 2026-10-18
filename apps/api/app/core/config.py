"""Core application settings and environment configuration."""

from typing import List

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable overrides."""

    app_name: str = "FuturaSculptAI API"
    app_version: str = "0.2.0"
    git_sha: str = Field(default="unknown", validation_alias="GIT_SHA")
    build_timestamp: str = Field(default="unknown", validation_alias="BUILD_TIMESTAMP")
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")
    debug: bool = False
    log_level: str = "INFO"

    # Multi-tenant and default project context
    default_tenant_id: str = "tenant-food-mfg-01"
    gcp_project_id: str = "genai-apac-2026-491004"
    gcp_region: str = "asia-southeast1"
    vertex_ai_location: str = Field(default="global", validation_alias="VERTEX_AI_LOCATION")
    vertex_ai_live_location: str = Field(default="us-central1", validation_alias="VERTEX_AI_LIVE_LOCATION")
    auth_dev_mode: bool = Field(default=True, validation_alias="AUTH_DEV_MODE")  # Dev/test mode allows mock IAM; production enforces Firebase verification
    firebase_project_id: str = "genai-apac-2026-491004"

    @model_validator(mode="after")
    def validate_production_invariants(self) -> "Settings":
        """Enforce strict security invariants in production environments."""
        if self.environment == "production" and self.auth_dev_mode:
            raise RuntimeError("AUTH_DEV_MODE must be false in production")
        return self

    # CORS configuration
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://futurasculptai.web.app",
        "https://genai-apac-2026-491004.web.app",
        "https://genai-apac-2026-491004.firebaseapp.com",
        "https://futurasculpt-web-967518492968.asia-southeast1.run.app",
        "https://futurasculpt-web-eah62ip3iq-as.a.run.app",
        "https://futurasculpt-api-967518492968.asia-southeast1.run.app",
        "https://futurasculpt-api-eah62ip3iq-as.a.run.app",
    ]
    cors_origin_regex: str = r"https://.*-(uc|as)\.a\.run\.app|https://.*\.run\.app|https://.*\.web\.app|https://.*\.firebaseapp\.com"

    # Vertex AI / Model Gateway
    default_model_fast: str = "gemini-3.8-flash"
    default_model_pro: str = "gemini-3.1-pro-preview"
    model_workhorse: str = "gemini-3.8-flash"
    model_deep_reasoning: str = "gemini-3.1-pro-preview"
    model_high_volume_utility: str = "gemini-3.5-flash-lite"
    model_frontier_workspace: str = "gemini-4-argon"
    vertex_context_cache_enabled: bool = True
    mock_llm_mode: bool = False  # Default to live Vertex AI; tests set MOCK_LLM_MODE=true via conftest

    @property
    def mock_mode(self) -> bool:
        """Compatibility property for modules referencing settings.mock_mode."""
        return self.mock_llm_mode

    # Session budget & FinOps limits
    session_cost_cap_usd: float = 2.00
    bigquery_max_bytes_billed: int = 1073741824  # 1 GB

    # Google Cloud Pub/Sub Event Streaming
    pubsub_enabled: bool = True
    pubsub_topic_telemetry: str = "futurasculpt-workforce-telemetry"
    pubsub_topic_alerts: str = "futurasculpt-governance-alerts"
    pubsub_topic_actuation: str = "futurasculpt-actuation-events"

    # Storage & Persistence
    evidence_bucket: str = Field(default="futurasculpt-evidence-genai-apac-2026-491004", validation_alias="EVIDENCE_BUCKET")
    bigquery_dataset: str = Field(default="futurasculpt_vault", validation_alias="BIGQUERY_DATASET")

    # Security & Guardrails
    model_armor_enabled: bool = Field(default=True, validation_alias="MODEL_ARMOR_ENABLED")
    secret_manager_enabled: bool = Field(default=True, validation_alias="SECRET_MANAGER_ENABLED")

    # Observation & Telemetry Monitoring
    metrics_enabled: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


settings = Settings()
