output "api_service_url" {
  description = "The public HTTPS URL of the deployed FuturaSculptAI backend API service."
  value       = google_cloud_run_v2_service.api_service.uri
}

output "web_service_url" {
  description = "The public HTTPS URL of the deployed FuturaSculptAI Executive Cockpit frontend."
  value       = google_cloud_run_v2_service.web_service.uri
}

output "evidence_bucket_name" {
  description = "Name of the provisioned Cloud Storage bucket for multimodal Evidence Envelopes."
  value       = google_storage_bucket.evidence_vault.name
}

output "workgraph_dataset_id" {
  description = "ID of the BigQuery dataset holding the temporal WorkGraph and outcome ledger."
  value       = google_bigquery_dataset.workgraph_vault.dataset_id
}

output "service_account_email" {
  description = "The runtime Service Account email running Cloud Run microservices."
  value       = google_service_account.cloudrun_sa.email
}

output "artifact_registry_repo" {
  description = "Artifact Registry Docker repository URL for container images."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.name}"
}
