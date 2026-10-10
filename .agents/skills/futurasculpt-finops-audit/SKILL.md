---
name: futurasculpt-finops-audit
description: Audits token consumption, model gateway routing efficiency, Vertex context cache hit rates, and BigQuery query bytes.
---

# FuturaSculptAI FinOps Audit Skill

## Purpose
Ensures cost awareness and FinOps discipline across all system tiers, enforcing budget caps, context caching utilization, and lowest-cost model routing.

## Triggers
- When new agent workflows, scenario simulations, or model calls are implemented.
- End-of-phase performance and cost reviews.

## Audit Procedure
1. **Model Gateway Route Verification:**
   - Verify that simple tasks (extraction, classification, validation) route to Gemini 2.5 Flash rather than Pro or Thinking models.
2. **Context Cache (L3) Utilization:**
   - Verify that repetitive sector packs and large system policies (> 32,000 tokens) leverage explicit Vertex AI context caching.
3. **BigQuery Query Dry-Run & Bytes Limit:**
   - Verify all BigQuery SQL queries specify `maximum_bytes_billed` and execute dry-runs to prevent unexpected scan charges.
4. **Scale-to-Zero Verification:**
   - Verify Cloud Run service definitions have `minInstances: 0`.

## Verification Script (Python)
```python
# Check that all BigQuery client executions enforce maximum_bytes_billed
import re, glob

violations = []
for file in glob.glob("apps/api/**/*.py", recursive=True):
    content = open(file).read()
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
