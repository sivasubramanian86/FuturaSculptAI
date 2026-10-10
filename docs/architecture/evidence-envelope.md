# FuturaSculptAI: EvidenceEnvelope Specification

The `EvidenceEnvelope` is the universal, normalized container schema for every piece of external or internal multimodal evidence ingested into FuturaSculptAI.

## JSON Schema Specification

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "EvidenceEnvelope",
  "type": "object",
  "required": [
    "evidence_id",
    "tenant_id",
    "source_type",
    "source_uri",
    "sha256_hash",
    "ingested_at",
    "content",
    "provenance",
    "acl"
  ],
  "properties": {
    "evidence_id": {
      "type": "string",
      "format": "uuid",
      "description": "Globally unique identifier for the evidence artifact."
    },
    "tenant_id": {
      "type": "string",
      "description": "Tenant identifier enforcing multi-tenant isolation."
    },
    "source_type": {
      "type": "string",
      "enum": ["pdf", "image", "audio", "video", "csv", "api", "web", "human_expert"]
    },
    "source_uri": {
      "type": "string",
      "description": "Canonical URI or storage path (e.g. gs://futurasculpt-evidence/tenant-1/sop.pdf)."
    },
    "sha256_hash": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$",
      "description": "Cryptographic SHA-256 hash of original raw asset for tamper verification."
    },
    "ingested_at": {
      "type": "string",
      "format": "date-time"
    },
    "content": {
      "type": "object",
      "required": ["language", "normalized_text"],
      "properties": {
        "language": {
          "type": "string",
          "default": "en"
        },
        "normalized_text": {
          "type": "string",
          "description": "Extracted and sanitized text representation."
        },
        "segments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "segment_id": { "type": "string" },
              "offset_start": { "type": "integer" },
              "offset_end": { "type": "integer" },
              "page_number": { "type": "integer" },
              "timestamp_seconds": { "type": "number" },
              "text": { "type": "string" }
            }
          }
        },
        "entities": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "type": { "type": "string" },
              "confidence": { "type": "number" }
            }
          }
        }
      }
    },
    "provenance": {
      "type": "object",
      "properties": {
        "author_or_source": { "type": "string" },
        "publication_date": { "type": "string" },
        "freshness_horizon_days": { "type": "integer" },
        "extraction_method": { "type": "string" },
        "confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
      }
    },
    "acl": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Access control list roles permitted to retrieve this evidence (e.g. ['role:executive', 'role:plant_manager'])."
    },
    "sensitivity": {
      "type": "string",
      "enum": ["public", "internal", "confidential", "restricted_pii"],
      "default": "internal"
    }
  }
}
```

## Anti-Injection Ingestion Protocol
1. **Raw Content Quarantine:** All uploaded files land in an isolated Cloud Storage quarantine bucket.
2. **Format & Malware Screening:** File headers and Magic Bytes are verified. Executable binaries disguised as documents are rejected.
3. **Sensitive Data Protection (Cloud DLP):** Text streams pass through Cloud DLP inspect & de-identify templates to mask PII (credit cards, SSNs, personal phone numbers, names).
4. **Indirect Prompt Injection Cleansing:** Text is parsed and checked via **Model Armor** for jailbreak patterns, system prompt overriding tags (e.g. `<|im_start|>`, `ignore previous instructions`), and malicious payloads before indexing.
5. **Ledger Commit:** The validated, sanitized `EvidenceEnvelope` is committed to the BigQuery Evidence Ledger and vectorized for retrieval.
