terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.30.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# 1. Enable Required Google Cloud APIs
locals {
  services = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "aiplatform.googleapis.com",
    "dlp.googleapis.com",
    "secretmanager.googleapis.com",
    "storage.googleapis.com",
    "bigquery.googleapis.com",
    "pubsub.googleapis.com",
    "firestore.googleapis.com",
    "cloudkms.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ]
}

resource "google_project_service" "enabled_apis" {
  for_each                   = toset(local.services)
  project                    = var.project_id
  service                    = each.key
  disable_on_destroy         = false
  disable_dependent_services = false
}

# 2. Artifact Registry Repository for Container Images
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "futurasculpt-containers"
  description   = "Docker container repository for FuturaSculptAI microservices"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled_apis]
}
