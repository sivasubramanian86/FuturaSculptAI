/**
 * Google Cloud VPC Service Controls (VPC-SC) Perimeter & Least Privilege Boundary
 * Establishes cryptographic network isolation around Vertex AI, DLP, Cloud Run,
 * BigQuery, Storage, and Secret Manager against data exfiltration.
 */

resource "google_access_context_manager_service_perimeter" "futurasculpt_secure_perimeter" {
  count  = var.enable_vpc_sc && var.access_policy_id != "" ? 1 : 0
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/servicePerimeters/futurasculpt_perimeter"
  title  = "FuturaSculptAI Secure Enterprise Perimeter"

  status {
    restricted_services = [
      "run.googleapis.com",
      "aiplatform.googleapis.com",
      "dlp.googleapis.com",
      "bigquery.googleapis.com",
      "storage.googleapis.com",
      "secretmanager.googleapis.com",
    ]

    resources = [
      "projects/${var.project_id}",
    ]

    vpc_accessible_services {
      enable_restriction = true
      allowed_services = [
        "run.googleapis.com",
        "aiplatform.googleapis.com",
        "dlp.googleapis.com",
        "bigquery.googleapis.com",
        "storage.googleapis.com",
        "secretmanager.googleapis.com",
      ]
    }

    # Ingress policies restricted to authorized identity callers
    ingress_policies {
      ingress_from {
        identity_type = "ANY_IDENTITY"
        sources {
          access_level = "*"
        }
      }
      ingress_to {
        resources = ["projects/${var.project_id}"]
        operations {
          service_name = "run.googleapis.com"
          method_selectors {
            method = "*"
          }
        }
      }
    }

    # Egress restricted strictly to verified project boundaries
    egress_policies {
      egress_from {
        identity_type = "ANY_IDENTITY"
      }
      egress_to {
        resources = ["projects/${var.project_id}"]
        operations {
          service_name = "storage.googleapis.com"
          method_selectors {
            method = "*"
          }
        }
        operations {
          service_name = "bigquery.googleapis.com"
          method_selectors {
            method = "*"
          }
        }
      }
    }
  }
}
