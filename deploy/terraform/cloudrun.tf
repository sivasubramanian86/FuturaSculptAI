# Cloud Run Service: FastAPI Backend
resource "google_cloud_run_v2_service" "api_service" {
  name     = "futurasculpt-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudrun_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      image = var.api_image

      resources {
        limits = {
          cpu    = "1000m"
          memory = "1024Mi"
        }
      }

      ports {
        container_port = 8080
      }

      env {
        name  = "PORT"
        value = "8080"
      }
      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "VERTEX_AI_LOCATION"
        value = var.region
      }
      env {
        name  = "EVIDENCE_BUCKET"
        value = google_storage_bucket.evidence_vault.name
      }
      env {
        name  = "BIGQUERY_DATASET"
        value = google_bigquery_dataset.workgraph_vault.dataset_id
      }

      startup_probe {
        initial_delay_seconds = 5
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
        http_get {
          path = "/health/ready"
          port = 8080
        }
      }

      liveness_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 3
        period_seconds        = 15
        failure_threshold     = 3
        http_get {
          path = "/health/live"
          port = 8080
        }
      }
    }
  }

  depends_on = [
    google_project_service.enabled_apis,
    google_service_account.cloudrun_sa
  ]
}

# Allow unauthenticated invocations for public API
resource "google_cloud_run_v2_service_iam_member" "api_public_access" {
  location = google_cloud_run_v2_service.api_service.location
  name     = google_cloud_run_v2_service.api_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run Service: Executive Cockpit Web Frontend
resource "google_cloud_run_v2_service" "web_service" {
  name     = "futurasculpt-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudrun_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = var.web_image

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }

      ports {
        container_port = 8080
      }

      liveness_probe {
        initial_delay_seconds = 5
        timeout_seconds       = 3
        period_seconds        = 15
        failure_threshold     = 3
        http_get {
          path = "/web-health"
          port = 8080
        }
      }
    }
  }

  depends_on = [
    google_project_service.enabled_apis,
    google_service_account.cloudrun_sa
  ]
}

# Allow unauthenticated invocations for public Web cockpit
resource "google_cloud_run_v2_service_iam_member" "web_public_access" {
  location = google_cloud_run_v2_service.web_service.location
  name     = google_cloud_run_v2_service.web_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
