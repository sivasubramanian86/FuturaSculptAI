# FuturaSculptAI Non-Functional Requirements (NFR) & Production System Design Specification

This document defines the authoritative Non-Functional Requirements (NFR), Service Level Objectives (SLOs), capacity targets, semantic cache policies, and edge security controls for **FuturaSculptAI: The Autonomous Work Transformation Operating System**.

---

## 1. Executive Summary & Scaling Roadmap

| Dimension | Hackathon Pilot (Current) | Multi-Facility Enterprise (Phase 1) | Global Hyper-Scale (Phase 2) |
|---|---|---|---|
| **Target Scale** | 25 concurrent users / 10 QPS | 5,000 employees / 250 QPS | 1,000,000+ employees / 15,000 QPS |
| **Tenancy Scope** | 3 seeded industrial tenants | Multi-tenant partitioned Firestore | Cell-based sharding per cloud region |
| **Compute Engine** | Serverless Google Cloud Run | Cloud Run + VPC egress to Memorystore | Cloud Run + GKE Autopilot clusters |
| **Model Ingress** | Vertex AI Gemini 3.8 Gateway | Multi-tier Router + Context Caching | Dynamic Cross-Region Vertex Pools |
| **State Persistence**| Durable Firestore + Pub/Sub | AlloyDB + Firestore + BigQuery | AlloyDB with read pools + Memorystore |

---

## 2. Authoritative Service Level Objectives (SLOs)

| Metric | Target (Prototype) | Production Enterprise Target | Enforcement & Measurement Mechanism |
|---|---|---|---|
| **API Availability** | **99.5%** | **99.95%** | Cloud Monitoring Synthetic Uptime Checks |
| **Read Endpoint P95** | **< 1.0s** (warm) | **< 350ms** | Cloud Trace distributed span sampling |
| **Boardroom TTFB** | **< 2.0s** | **< 800ms** | Server-Sent Events (SSE) streaming headers |
| **Boardroom Deliberation P95** | **< 20.0s** | **< 12.0s** | Multi-agent parallel evaluation + Context Caching |
| **Live Native Audio P95** | **< 150ms** | **< 100ms** | Vertex AI Gemini 3.8 Live direct streaming |
| **Tenant Isolation Leakage** | **0.0% (Zero Tolerance)**| **0.0% (Zero Tolerance)**| Cryptographic Firebase JWT claims + unit gates |
| **Factual Claim Grounding** | **100%** | **100%** | EvidenceEnvelope SHA-256 verification |
| **Disaster Recovery RTO** | **< 15 minutes** | **< 5 minutes** | Terraform IaC + Cloud Run traffic rollback |

---

## 3. Semantic & Vertex Context Caching Policy

### 3.1 Cache Eligibility Matrix

To prevent stale workforce covenants, privacy leakage, or unauthorized decisions, caching is strictly governed:

| Asset / Request Class | Eligibility | Technology / TTL | Invalidation Trigger |
|---|---|---|---|
| **Sector Definitions & Ontologies** | **CACHEABLE** | Memorystore Redis (24h) | Manual taxonomy revision |
| **Emerging Tech Explanations** | **CACHEABLE** | Memorystore Redis (72h) | Static quarterly refresh |
| **Repeated WorkGraph Topologies** | **CACHEABLE** | **Vertex Context Caching (1h)** | Task modification or redeployment |
| **Read-Only Evidence Summaries** | **CACHEABLE** | Memorystore Redis (6h) | Evidence upload / revocation event |
| **PersonalWorkTwin Responses** | **STRICTLY NEVER**| No-Cache (`Cache-Control: no-store`) | N/A (Dynamic consent context) |
| **Consequential Scoring & RRI** | **STRICTLY NEVER**| No-Cache (Deterministic compute) | N/A (Audited on-demand) |
| **Boardroom Multi-Agent Runs** | **STRICTLY NEVER**| No-Cache (Real-time synthesis) | N/A (Unique proposal parameters) |
| **Cross-Tenant Content** | **STRICTLY NEVER**| Hard Tenant Boundary Isolation | N/A |

### 3.2 Deterministic Cache Key Formula

```python
cache_key = sha256(
    f"{tenant_id}:{normalized_intent}:{role_scope}:{evidence_version_vector}:{model_family}"
).hexdigest()
```

### 3.3 Event-Driven Cache Invalidation (Change Data Capture)

When new evidence is uploaded or an existing policy is altered:
1. `EvidenceService` publishes an `EVIDENCE_INVALIDATED` event to Google Cloud Pub/Sub topic `futurasculpt-workforce-telemetry`.
2. Cloud Run background consumer invalidates all keys matching `tenant_id` and affected `evidence_id` in Google Cloud Memorystore.
3. Vertex AI Context Caching entry is pruned or refreshed with the updated WorkGraph state.

---

## 4. Multi-Layer Edge Security & API Protection

```
Client (Cockpit / Mobile / API)
              │
              ▼
   Google Cloud Armor (WAF & DDoS)
   ├── Rate Limiting: 60 req/min/IP
   ├── Managed OWASP Top 10 Rules
   └── Geo-fencing & Bot Management
              │
              ▼
   Google Cloud Run Ingress
   ├── Strict HTTPS (TLS 1.3)
   └── Cryptographic RS256 Firebase JWT Validation
              │
              ▼
   Security & Red-Line Middleware
   ├── Sensitive Data Protection (Cloud DLP Tokenization)
   ├── Model Armor Prompt Injection Sanitizer
   └── EU AI Act Anti-Termination Verification Gate
              │
              ▼
   Core Services & WorkTwin Fabric
```

### Rate Limiting Tiers
- **Anonymous Health / Readiness:** 120 req / min.
- **Citizen Worker (Authenticated):** 60 req / min.
- **Enterprise Architect:** 120 req / min.
- **Boardroom Simulation:** 2 concurrent runs per tenant.
- **Live Native Audio Dialogue:** 10 turns / min.

---

## 5. Minimum Sufficient Intelligence & Model Gateway Routing

Requests are dynamically routed to minimize latency, eliminate carbon overhead, and cap token expenditures:

1. **Tier 1: High-Volume Utility (`gemini-3.8-flash-lite`)**
   - Latency: < 50ms
   - Use Cases: Real-time prompt sanitization, red-line safety checks, intent triage, query normalization.
2. **Tier 2: Workhorse Multimodal (`gemini-3.8-flash-001`)**
   - Latency: < 120ms
   - Use Cases: Task Sculptor transformation matrix, multimodal image/audio ingestion, Gemini Live Native Audio dialogue.
3. **Tier 3: Deep Reasoning Swarm (`gemini-3.8-pro-001`)**
   - Latency: 1.2s - 4.5s
   - Use Cases: Future Boardroom multi-agent deliberations, complex trade-off synthesis, legal workforce covenant validation.
