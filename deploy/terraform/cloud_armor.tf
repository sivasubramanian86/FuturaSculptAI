# ------------------------------------------------------------------------------
# Google Cloud Armor Enterprise WAF & DDoS Protection Policy
# ------------------------------------------------------------------------------
# Gated behind var.enable_cloud_armor (defaults to false) to prevent unapproved
# billable HTTPS Load Balancer and Serverless NEG infrastructure provisioning.
# ------------------------------------------------------------------------------

resource "google_compute_security_policy" "futurasculpt_waf" {
  count       = var.enable_cloud_armor ? 1 : 0
  name        = "futurasculpt-cloud-armor-waf"
  description = "Enterprise WAF security policy protecting FuturaSculptAI Cloud Run services from OWASP Top 10, SQLi, and DDoS"
  project     = var.project_id

  # 1. SQL Injection Protection (OWASP CRS)
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block OWASP SQL injection attacks against API endpoints"
  }

  # 2. Cross-Site Scripting (XSS) Protection (OWASP CRS)
  rule {
    action   = "deny(403)"
    priority = "1010"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block Cross-Site Scripting (XSS) payloads"
  }

  # 3. Local File Inclusion (LFI) & Remote Code Execution (RCE)
  rule {
    action   = "deny(403)"
    priority = "1020"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-v33-stable') || evaluatePreconfiguredExpr('rce-v33-stable')"
      }
    }
    description = "Block LFI and Remote Code Execution patterns"
  }

  # 4. Adaptive Rate Limiting: 300 requests per minute per IP
  rule {
    action   = "rate_based_ban"
    priority = "2000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 300
        interval_sec = 60
      }
      ban_duration_sec = 300
    }
    description = "Throttle abusive volumetric traffic (>300 req/min)"
  }

  # 5. Default rule: Allow legitimate traffic
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule for inspected enterprise traffic"
  }

  depends_on = [google_project_service.enabled_apis]
}
