# Cloud Storage: Multimodal Evidence Envelopes & Raw Artifacts Vault
resource "google_storage_bucket" "evidence_vault" {
  name                        = "futurasculpt-evidence-${var.project_id}"
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.enabled_apis]
}

# BigQuery: Temporal WorkGraph & Outcome Ledger Dataset
resource "google_bigquery_dataset" "workgraph_vault" {
  dataset_id                  = "futurasculpt_vault"
  friendly_name               = "FuturaSculptAI WorkGraph Vault"
  description                 = "Temporal Work Transformation Graph nodes, edges, blast radii, and outcome ledgers"
  location                    = var.region
  default_table_expiration_ms = null

  labels = {
    env        = var.environment
    system     = "futurasculpt-ai"
    governance = "saif-compliant"
  }

  depends_on = [google_project_service.enabled_apis]
}

# Secret Manager: Enterprise Runtime Secrets
resource "google_secret_manager_secret" "session_secret" {
  secret_id = "futurasculpt-session-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.enabled_apis]
}

resource "google_secret_manager_secret" "model_armor_config" {
  secret_id = "futurasculpt-model-armor-config"

  replication {
    auto {}
  }

  depends_on = [google_project_service.enabled_apis]
}

# ------------------------------------------------------------------------------
# Google Cloud Firestore (Durable Multi-Tenant WorkTwin & Consent Store)
# ------------------------------------------------------------------------------
resource "google_firestore_database" "database" {
  project                     = var.project_id
  name                        = "(default)"
  location_id                 = var.region
  type                        = "FIRESTORE_NATIVE"
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"

  depends_on = [google_project_service.enabled_apis]
}

# ------------------------------------------------------------------------------
# Google Cloud Pub/Sub Streaming Event Mesh (Telemetry, Alerts, Actuation)
# ------------------------------------------------------------------------------
resource "google_pubsub_topic" "workforce_telemetry" {
  name       = "futurasculpt-workforce-telemetry"
  depends_on = [google_project_service.enabled_apis]
}

resource "google_pubsub_topic" "governance_alerts" {
  name       = "futurasculpt-governance-alerts"
  depends_on = [google_project_service.enabled_apis]
}

resource "google_pubsub_topic" "actuation_events" {
  name       = "futurasculpt-actuation-events"
  depends_on = [google_project_service.enabled_apis]
}

# ------------------------------------------------------------------------------
# Customer-Managed Encryption Keys (CMEK) Cloud KMS Security Architecture
# ------------------------------------------------------------------------------
resource "google_kms_key_ring" "keyring" {
  name       = "futurasculpt-keyring"
  location   = var.region
  depends_on = [google_project_service.enabled_apis]
}

resource "google_kms_crypto_key" "cmek_key" {
  name            = "futurasculpt-cmek-key"
  key_ring        = google_kms_key_ring.keyring.id
  rotation_period = "7776000s" # 90-day automatic key rotation

  lifecycle {
    prevent_destroy = false
  }
}

# ------------------------------------------------------------------------------
# Cloud Sensitive Data Protection (DLP) Standard Inspection Template
# ------------------------------------------------------------------------------
resource "google_data_loss_prevention_inspect_template" "saif_dlp_template" {
  parent       = "projects/${var.project_id}/locations/${var.region}"
  description  = "SAIF-compliant PII inspection template for workforce evidence"
  display_name = "FuturaSculptAI SAIF DLP Template"

  inspect_config {
    info_types {
      name = "EMAIL_ADDRESS"
    }
    info_types {
      name = "PHONE_NUMBER"
    }
    info_types {
      name = "US_SOCIAL_SECURITY_NUMBER"
    }
    min_likelihood = "LIKELY"
  }

  depends_on = [google_project_service.enabled_apis]
}
