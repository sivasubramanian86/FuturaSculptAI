# FuturaSculptAI: Deterministic Score Contracts

This document formalizes the mathematical formulas, ranges, inputs, and Pydantic schemas for all consequential and architectural scores. All scoring logic is executed by versioned deterministic Python code.

## 1. Role Resilience Index (RRI)

Measures a job role's ability to remain valuable and thrive through technological transformation.

### Formula
$$\text{RRI} = (0.35 \times C_{\text{non\_routine}}) + (0.30 \times S_{\text{transferability}}) + (0.20 \times A_{\text{augmentation\_potential}}) + (0.15 \times E_{\text{strategic\_criticality}})$$

- $C_{\text{non\_routine}} \in [0, 100]$: Percentage of role tasks requiring non-routine cognitive, creative, or physical judgment.
- $S_{\text{transferability}} \in [0, 100]$: Overlap coefficient of role core skills with high-growth emerging enterprise roles.
- $A_{\text{augmentation\_potential}} \in [0, 100]$: Capacity of tasks to be augmented by AI/agents rather than entirely automated.
- $E_{\text{strategic\_criticality}} \in [0, 100]$: Alignment of the role with strategic business outcomes in the WorkGraph.

**Score Range:** $0.0 - 100.0$  
**Interpretation:** 
- $\ge 75$: High Resilience (Thriving role; focus on agent copilot adoption).
- $50 - 74$: Moderate Resilience (Requires targeted upskilling).
- $< 50$: Vulnerable (Requires proactive pathway transition to adjacent emerging roles).

---

## 2. Transition Readiness Score (TRS)

Measures the feasibility and speed of transitioning a workforce cohort or individual from Role A to Role B.

### Formula
$$\text{TRS} = (0.50 \times S_{\text{shared\_skills}}) + (0.30 \times (100 - G_{\text{critical\_gap}})) + (0.20 \times L_{\text{velocity}})$$

- $S_{\text{shared\_skills}} \in [0, 100]$: Jaccard similarity of required skills between source and target roles weighted by proficiency.
- $G_{\text{critical\_gap}} \in [0, 100]$: Skill acquisition deficit for mandatory target qualifications.
- $L_{\text{velocity}} \in [0, 100]$: Historical or estimated learning completion rate for the cohort.

**Score Range:** $0.0 - 100.0$

---

## 3. Human Opportunity Score (HOS)

Measures whether a proposed operating model redesign creates net positive human potential vs. mere labor displacement.

### Formula
$$\text{HOS} = \frac{N_{\text{new\_roles}} \times 1.5 + T_{\text{augmented\_tasks}} \times 1.0}{D_{\text{automated\_tasks}} \times 0.8 + 1} \times 20$$

Normalized to a $0.0 - 100.0$ index.  
- High HOS ($> 70$) indicates an empowering, human-centered transformation.

---

## 4. Well-Architected & SAIF TrustScore

Calculates enterprise readiness across 6 Google Well-Architected pillars + SAIF compliance:

$$\text{TrustScore} = \sum_{p \in \text{Pillars}} w_p \times \text{PillarScore}_p$$

Where weights $w_p$:
1. **Security & Privacy (SAIF):** 25% ($w_1 = 0.25$) — Hard red-line gate (Score < 80 blocks release).
2. **Operational Excellence:** 15% ($w_2 = 0.15$)
3. **Reliability:** 15% ($w_3 = 0.15$)
4. **Performance Efficiency:** 15% ($w_4 = 0.15$)
5. **Cost Optimization (FinOps):** 15% ($w_5 = 0.15$)
6. **Sustainability:** 15% ($w_6 = 0.15$)

---

## 5. Pydantic Score Contract (Python)

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class ScoreComponent(BaseModel):
    name: str
    weight: float
    raw_value: float
    weighted_value: float
    evidence_ids: List[str]

class ConsequentialScoreResult(BaseModel):
    score_name: str
    final_score: float = Field(..., ge=0.0, le=100.0)
    version: str
    calculated_at: datetime
    status: str  # "VALID" | "INSUFFICIENT_EVIDENCE" | "BLOCKED"
    components: List[ScoreComponent]
    assumptions: List[str]
    invalidation_triggers: List[str]
    audit_hash: str
```
