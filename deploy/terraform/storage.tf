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
