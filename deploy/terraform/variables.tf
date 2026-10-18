variable "project_id" {
  description = "The Google Cloud Project ID to deploy FuturaSculptAI resources into."
  type        = string
  default     = "genai-apac-2026-491004"
}

variable "region" {
  description = "The target Google Cloud region for compute, storage, and Vertex AI services."
  type        = string
  default     = "asia-southeast1"
}

variable "environment" {
  description = "Deployment lifecycle stage (development, staging, production)."
  type        = string
  default     = "production"
}

variable "api_image" {
  description = "Container image URI for the FastAPI backend service."
  type        = string
  default     = "asia-southeast1-docker.pkg.dev/genai-apac-2026-491004/futurasculpt-containers/api:latest"
}

variable "web_image" {
  description = "Container image URI for the React executive cockpit frontend."
  type        = string
  default     = "asia-southeast1-docker.pkg.dev/genai-apac-2026-491004/futurasculpt-containers/web:latest"
}

variable "enable_vpc_sc" {
  description = "Whether to provision Google Cloud VPC Service Controls perimeter (requires Organization admin permissions)."
  type        = bool
  default     = false
}

variable "access_policy_id" {
  description = "Access Context Manager Policy ID for VPC Service Controls perimeter attachment."
  type        = string
  default     = ""
}

variable "enable_cloud_armor" {
  description = "Whether to provision Cloud Armor security policy and HTTPS Load Balancer (requires explicit operator approval due to billable LB/NEG resources)."
  type        = bool
  default     = false
}

