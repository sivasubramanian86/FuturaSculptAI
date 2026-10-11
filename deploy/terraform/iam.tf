# Dedicated Service Account for Cloud Run Services
resource "google_service_account" "cloudrun_sa" {
  account_id   = "futurasculpt-runner"
  display_name = "FuturaSculptAI Cloud Run Least-Privilege Execution SA"
  description  = "SAIF-compliant runtime identity restricted to Vertex AI, DLP, BigQuery, and Storage"

  depends_on = [google_project_service.enabled_apis]
}

# 1. Vertex AI Gemini Invocation Role
resource "google_project_iam_member" "vertex_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# 2. Cloud Sensitive Data Protection (DLP) API Invocation Role
resource "google_project_iam_member" "dlp_user" {
  project = var.project_id
  role    = "roles/dlp.user"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# 3. Secret Manager Access for Specific Secrets
resource "google_secret_manager_secret_iam_member" "session_secret_accessor" {
  secret_id = google_secret_manager_secret.session_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "model_armor_accessor" {
  secret_id = google_secret_manager_secret.model_armor_config.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# 4. Storage Bucket Scoped Object Permissions
resource "google_storage_bucket_iam_member" "evidence_storage_admin" {
  bucket = google_storage_bucket.evidence_vault.name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# 5. BigQuery Dataset Scoped Data Permissions
resource "google_bigquery_dataset_access" "sa_data_editor" {
  dataset_id    = google_bigquery_dataset.workgraph_vault.dataset_id
  role          = "roles/bigquery.dataEditor"
  user_by_email = google_service_account.cloudrun_sa.email
}
