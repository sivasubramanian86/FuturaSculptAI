"""Core application settings and environment configuration."""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable overrides."""

    app_name: str = "FuturaSculptAI API"
    app_version: str = "0.2.0"
    git_sha: str = "e619fd5"
    build_timestamp: str = "2026-10-16T13:00:00Z"
    environment: str = "development"
    debug: bool = False
    log_level: str = "INFO"

    # Multi-tenant and default project context
    default_tenant_id: str = "tenant-food-mfg-01"
    gcp_project_id: str = "genai-apac-2026-491004"
    gcp_region: str = "asia-southeast1"
    auth_dev_mode: bool = True  # Development/test mode allows mock IAM; production enforces Firebase cryptographic verification
    firebase_project_id: str = "genai-apac-2026-491004"

    # CORS configuration
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://futurasculptai.web.app",
        "https://genai-apac-2026-491004.web.app",
    ]

    # Vertex AI / Model Gateway (Targeting 3.8 Generation with 4-Argon preview and Jan 2027 EOL auto-migration)
    default_model_fast: str = "gemini-3.8-flash-001"
    default_model_pro: str = "gemini-3.8-pro-001"
    model_workhorse: str = "gemini-3.8-flash-001"
    model_deep_reasoning: str = "gemini-3.8-pro-001"
    model_high_volume_utility: str = "gemini-3.8-flash-lite"
    model_frontier_workspace: str = "gemini-4-argon-preview"
    vertex_context_cache_enabled: bool = True
    mock_llm_mode: bool = False  # Default to live Vertex AI; tests set MOCK_LLM_MODE=true via conftest

    # Session budget & FinOps limits
    session_cost_cap_usd: float = 2.00
    bigquery_max_bytes_billed: int = 1073741824  # 1 GB

    # Google Cloud Pub/Sub Event Streaming
    pubsub_enabled: bool = True
    pubsub_topic_telemetry: str = "futurasculpt-workforce-telemetry"
    pubsub_topic_alerts: str = "futurasculpt-governance-alerts"
    pubsub_topic_actuation: str = "futurasculpt-actuation-events"

    # Observation & Telemetry Monitoring
    metrics_enabled: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
