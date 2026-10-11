"""Domain tools for deterministic RRI (Role Resilience) and FinOps ROI computation."""

from typing import Dict


def calculate_deterministic_rri(horizon_years: int, automation_pct: float) -> float:
    """Compute Role Resilience Index (RRI) via deterministic algorithm.

    Args:
        horizon_years: Transformation horizon in years.
        automation_pct: Projected agent automation share percentage.

    Returns:
        float: RRI score between 0.0 and 100.0.
    """
    # Base resilience is inversely related to unaugmented vulnerability
    # Higher augmentation retention maintains high resilience
    retention_factor = 100.0 - automation_pct
    base_rri = (retention_factor * 0.6) + (float(horizon_years) * 8.0)
    return round(min(100.0, max(10.0, base_rri)), 1)


def calculate_finops_roi(annual_savings_usd: float, token_cost_usd: float) -> Dict[str, float]:
    """Calculate EBITDA uplift, annual net savings, and payback period.

    Args:
        annual_savings_usd: Projected annual operational labor and waste reduction.
        token_cost_usd: Annualized LLM token expenditure.

    Returns:
        Dict[str, float]: Metrics dictionary containing net savings, ROI multiple, and payback months.
    """
    net_savings = max(0.0, annual_savings_usd - token_cost_usd)
    roi_multiple = net_savings / max(1.0, token_cost_usd)
    payback_months = round(max(0.1, (token_cost_usd / max(1.0, annual_savings_usd)) * 12.0), 1)

    return {
        "annual_gross_savings_usd": annual_savings_usd,
        "annual_token_cost_usd": token_cost_usd,
        "net_ebitda_impact_usd": round(net_savings, 2),
        "roi_multiple": round(roi_multiple, 1),
        "payback_period_months": payback_months,
    }
