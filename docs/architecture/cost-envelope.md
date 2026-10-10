# FuturaSculptAI: FinOps & Cost Envelope Specification

This document defines the cost optimization targets, model pricing assumptions, cache hit economics, and budget tripwires for running FuturaSculptAI on Google Cloud.

## 1. Unit Economics & Cost Budgets

| Operation | Target Cost Budget (USD) | Latency SLO (p95) | Model Selection Strategy |
|---|---|---|---|
| Single Evidence Document Ingestion & DLP | < $0.02 / document | < 3.0s | Document AI + Gemini 2.5 Flash |
| Interactive WorkGraph Query | < $0.001 / query | < 400ms | L0/L1 Cache -> In-Memory BigQuery |
| 4-Scenario Generation Run | < $0.05 / run | < 6.0s | Gemini 2.5 Flash with Vertex Context Caching |
| Opportunity Forge (End-to-End Blueprint) | < $0.15 / blueprint | < 12.0s | Dynamic Gateway: Gemini 2.5 Flash + Thinking Critic |
| Full Investor Diligence Dossier | < $0.50 / dossier | < 30.0s | Batch Parallel Specialists + Multi-tier Cache |

---

## 2. Dynamic Model Gateway Hierarchy

To minimize token costs without sacrificing reasoning quality:

1. **Tier 1 (Fast & Economical): Gemini 2.5 Flash**
   - *Use Case:* Entity extraction, classification, schema validation, routing, summarization, UI search queries.
   - *Cost Profile:* ~$0.075 per 1M input tokens / ~$0.30 per 1M output tokens.
   - *Context Caching:* ~$0.01875 per 1M cached tokens/hour.

2. **Tier 2 (Balanced Multimodal): Gemini 2.5 Pro**
   - *Use Case:* Complex process SOP parsing, architectural blueprinting, multi-scenario trade-off synthesis.
   - *Cost Profile:* ~$1.25 per 1M input tokens / ~$5.00 per 1M output tokens.

3. **Tier 3 (Deep Analytical Reasoning): Gemini 2.5 Thinking Mode**
   - *Use Case:* Adversarial critic evaluation, conflict resolution between contradictory evidence, Well-Architected red-line verification.
   - *Invoked only when:* Model Gateway complexity score > 0.85 OR Critic validation fails on Tier 1 output.

---

## 3. Context Caching Economics

Enterprise sector knowledge packs (e.g., Food Manufacturing SOPs, FDA CFR 21 guidelines, ISO standards) comprise ~150,000 stable tokens:
- **Without Caching:** 10 scenario runs = $1.875 in input tokens.
- **With Vertex AI Context Caching (L3):**
  - Cache creation: ~$0.1875 (one-time).
  - Subsequent 10 reads: ~$0.0468 total ($0.0047/read).
  - **Net Savings:** > 75% cost reduction; latency drops by ~60%.

---

## 4. Hard Budget Tripwires & Circuit Breakers

1. **Per-Tenant Monthly Cap:** Configurable in Admin Policy Studio (default: $100.00 for hackathon / $2,500.00 for enterprise trial).
2. **Per-Session Tripwire:** Any single interactive user session exceeding **$2.00 in accumulated API calls** is automatically throttled with a notification prompt to continue in cached mode.
3. **Cloud Run Scale-to-Zero:** All backend and prototype agent containers configure `minInstances: 0`, eliminating idle infrastructure charges.
4. **BigQuery Query Budget:** All analytical queries must specify `maximum_bytes_billed = 1073741824` (1GB limit) and execute query dry-runs in CI tests.
