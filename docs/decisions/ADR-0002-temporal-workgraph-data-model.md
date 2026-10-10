# ADR-0002: Temporal Work Transformation Graph on BigQuery & In-Memory Projections

## Status
Accepted

## Context
FuturaSculptAI requires a temporal representation of enterprise operating models: connecting outcomes, capabilities, workflows, tasks, roles, skills, systems, agents, and controls across past baselines, present state, and simulated future horizons. We must decide on the underlying storage and querying architecture.

## Decision
We select **Google BigQuery** as the persistent temporal graph and ledger store (using partitioned/clustered `wtg_nodes` and `wtg_edges` tables), paired with **in-memory NetworkX/Pydantic projections** for real-time agent traversal and interactive UI Cytoscape visualization.

## Trade-offs & Alternatives Considered
| Option | Pros | Cons | Operational Overhead |
|---|---|---|---|
| BigQuery + In-Memory Projections (Selected) | Serverless, zero idle cost, scales to massive enterprise datasets, native analytics & SQL integration, point-in-time time travel. | Graph traversals of depth > 4 require recursive SQL or in-memory loading. | Low (fully managed serverless). |
| Dedicated Graph DB (Neo4j / Spanner Graph) | Native Cypher/GQL graph traversal of arbitrary depth. | High persistent infrastructure cost (expensive idle VM/cluster instances), adds complex database operational overhead for hackathon MVP. | High. |
| Pure Document Store (Firestore) | Low latency for single-document reads. | Poor multi-hop relationship querying, expensive large-scale aggregation for scenario simulation. | Medium. |

## Consequences
- **Positive:** Scale-to-zero FinOps compliance; fast analytical aggregation across thousands of tasks and roles; reproducible time-travel snapshots.
- **Negative:** Deep graph queries (> 4 hops) must be computed within memory in the backend service.
- **Cost Impact:** Controlled via BigQuery query dry-runs and `maximum_bytes_billed` limits.
