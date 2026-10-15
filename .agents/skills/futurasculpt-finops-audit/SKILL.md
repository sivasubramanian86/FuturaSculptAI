---
name: futurasculpt-finops-audit
description: Audits token consumption, model gateway routing efficiency, Vertex context cache hit rates, and BigQuery query bytes.
version: "1.0.0"
author: "FuturaSculptAI Platform Engineering"
allowed_tools:
  - audit_model_gateway_routing
  - verify_context_cache_hit_rate
  - check_bigquery_bytes_billed
---

# FuturaSculptAI FinOps Audit Skill

## Purpose
Ensures cost awareness and FinOps discipline across all system tiers, enforcing budget caps, context caching utilization, and lowest-cost model routing.

## Tool Declarations & Input Schemas

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class FinOpsAuditInput(BaseModel):
    """Input parameters for FinOps budget verification."""
    session_cost_cap_usd: float = Field(default=2.00, ge=0.10, le=100.0)
    max_bigquery_bytes: int = Field(default=1073741824, description="1GB maximum bytes billed cap.")
    idempotency_key: str = Field(..., min_length=16, description="Audit session idempotency key.")

class FinOpsAuditOutput(BaseModel):
    """Output metrics for FinOps verification."""
    total_token_spend_usd: float = Field(ge=0.0)
    context_cache_hit_rate_pct: float = Field(ge=0.0, le=100.0)
    unbounded_queries_detected: int = Field(default=0, ge=0)
    within_budget_cap: bool
    optimization_recommendations: List[str] = Field(default_factory=list)
```

## Deterministic Credential Isolation (Zero-Trust to Model)
- **Zero-Trust Model:** The FinOps auditor evaluates token counters and simulated cost models; it never accesses billing account keys or financial credentials.
- **Broker Layer Enforcement:** BigQuery and Cloud Run limits are enforced at the service client adapter layer via client configuration parameters.

## Execution Sandboxing & Idempotency
- **Idempotency Guarantee:** FinOps reviews run with deterministic cost models, producing identical accounting receipts for identical simulated token batches.
- **Compensating Action / Saga Readiness:** The auditor inspects metrics and issues alerts; no live infrastructure destruction or billing modification is executed.

## Audit Procedure
1. **Model Gateway Route Verification:**
   - Verify that simple tasks (extraction, classification, validation) route to Gemini Flash rather than Pro or Thinking models.
2. **Context Cache (L3) Utilization:**
   - Verify that repetitive sector packs and large system policies exceeding token floors (**>= 1,024 tokens for Flash**, **>= 4,096 tokens for Pro**) leverage explicit Vertex AI context caching (up to 90% discount).
3. **Batch Inference Offloading:**
   - Verify that bulk offline analytics (bulk SOP ingestion, annual retrospectives) leverage Vertex AI Batch Prediction (50% discount) via BigQuery or Cloud Storage JSONL.
4. **BigQuery Query Dry-Run & Bytes Limit:**
   - Verify all BigQuery SQL queries specify `maximum_bytes_billed` and execute dry-runs to prevent unexpected scan charges.
5. **Scale-to-Zero Verification:**
   - Verify Cloud Run service definitions have `minInstances: 0`.

## Verification Script (Python)
```python
# Check that all BigQuery client executions enforce maximum_bytes_billed
import glob

violations = []
for file in glob.glob("apps/api/app/**/*.py", recursive=True):
    content = open(file, encoding="utf-8").read()
    if "client.query(" in content and "maximum_bytes_billed" not in content:
        violations.append(file)

if violations:
    print(f"FinOps Violation: Unbounded BigQuery queries in: {violations}")
```

## Expected Output
FinOps report detailing:
- Estimated cost per transformation case.
- Context cache hit ratio.
- Compliance with session budget caps.
