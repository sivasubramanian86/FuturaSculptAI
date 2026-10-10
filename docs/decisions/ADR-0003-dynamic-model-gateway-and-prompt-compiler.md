# ADR-0003: Dynamic Model Gateway and Versioned Prompt Compiler

## Status
Accepted

## Context
Hardcoding a single LLM model (e.g. GPT-4 or Gemini Pro) across all agent tasks produces suboptimal cost, latency, and reliability. Trivial extraction tasks waste high-reasoning tokens, while complex scenario simulations fail on lightweight models. Furthermore, static, monolithic prompts lead to prompt drift and lack auditability.

## Decision
1. Implement a **Dynamic Model Gateway** that classifies task complexity, risk tier, modality, and latency SLO, routing requests dynamically across Vertex AI Gemini models (Gemini 2.5 Flash, Gemini 2.5 Pro, and Gemini 2.5 Thinking mode).
2. Implement a **Versioned Prompt Compiler** that dynamically constructs task prompts from an immutable policy envelope, tenant rules, task recipes, retrieved evidence, and structured output schemas.

## Trade-offs & Alternatives Considered
| Option | Pros | Cons | Operational Overhead |
|---|---|---|---|
| Dynamic Gateway + Prompt Compiler (Selected) | Lowest cost for passing quality; zero vendor lock-in at model level; full prompt manifest auditability. | Requires maintenance of prompt recipes and routing logic. | Low. |
| Hardcoded Gemini 2.5 Pro everywhere | Simple single configuration. | High token cost; slower latency on simple classification tasks. | Low. |
| Unconstrained self-modifying prompts in production | High theoretical flexibility. | Dangerous hallucinations; non-reproducible outcomes; breaks security compliance. | Unacceptable. |

## Consequences
- **Positive:** Reduces token expenses by > 60%; enables prompt caching (Vertex Context Caching) on shared policy/evidence blocks; full audit trail of exact prompt manifests used.
- **Cost Impact:** Highly positive FinOps impact.
