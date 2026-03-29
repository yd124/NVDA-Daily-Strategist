"""
NVDA Daily Signal — Score Computer
Computes attention score and thesis risk score from market data and classified news.
"""

from __future__ import annotations

import logging
from typing import Any

from agent.config import HALF_DAY_MACRO_WEIGHT_REDUCTION

logger = logging.getLogger(__name__)

# Event type point values for company catalyst scoring
_CATALYST_POINTS: dict[str, float] = {
    "earnings_guidance": 10.0,
    "export_control": 9.0,
    "hyperscaler_capex": 8.0,
    "product_launch": 7.0,
    "supply_chain": 6.0,
    "analyst_action": 4.0,
    "macro_event": 3.0,
    "media_noise": 1.0,
}


def _clamp(value: float, lo: float = 0.0, hi: float = 10.0) -> float:
    """Clamp a float between lo and hi."""
    return max(lo, min(hi, value))


def _compute_company_catalyst(classified_news: list[dict[str, Any]]) -> float:
    """
    Compute company catalyst sub-score (0–10).

    Sums points for novel news items by event type. Capped at 10.
    """
    if not classified_news:
        return 0.0

    total = 0.0
    for item in classified_news:
        if not item.get("is_novel", False):
            continue
        event_type = item.get("event_type", "media_noise")
        total += _CATALYST_POINTS.get(event_type, 1.0)

    return _clamp(total)


def _compute_market_reaction(
    market_data: dict[str, Any],
) -> float:
    """
    Compute market reaction sub-score (0–10).

    Based on absolute NVDA pre-market % change.
    Boosted if NVDA vs SOXX spread exceeds 1.5%.
    """
    pct = market_data.get("nvda_premarket_pct")
    if pct is None:
        return 0.0

    abs_pct = abs(float(pct))

    # Linear mapping: 0%→0, 1%→2, 2%→4, 3%→6, 4%→8, 5%+→10
    score = min(abs_pct * 2.0, 10.0)

    # Boost for NVDA outperforming/underperforming SOXX significantly
    nvda_vs_soxx = market_data.get("nvda_vs_soxx")
    if nvda_vs_soxx is not None and abs(float(nvda_vs_soxx)) > 1.5:
        score += 2.0

    return _clamp(score)


def _compute_macro_risk(
    macro_events: list[dict[str, Any]],
    market_data: dict[str, Any],
    is_half_day: bool,
    weights: dict[str, float],
) -> float:
    """
    Compute macro risk sub-score (0–10).

    Base: len(macro_events)*3 capped at 7.
    Boost for elevated VIX.
    Half-day adjustment reduces effective weight.
    """
    # Base score from event count
    base = min(len(macro_events) * 3.0, 7.0)

    # VIX boost
    ctx = market_data.get("context_metrics", {})
    vix = ctx.get("vix_price") if ctx else None
    if vix is not None:
        try:
            vix_f = float(vix)
            if vix_f > 25:
                base += 1.0  # VIX > 25: +1 (stacks with >20 check below)
            if vix_f > 20:
                base += 2.0
        except (TypeError, ValueError):
            pass

    score = _clamp(base)

    # Half-day: reduce effective macro weight contribution
    if is_half_day:
        score = _clamp(score - HALF_DAY_MACRO_WEIGHT_REDUCTION * 100)

    return score


def _compute_thesis_relevance(classified_news: list[dict[str, Any]]) -> float:
    """
    Compute thesis relevance sub-score (0–10).

    Average thesis_relevance_score of novel, thesis-relevant items.
    Returns 0 if no qualifying items.
    """
    qualifying = [
        item for item in classified_news
        if item.get("is_novel", False) and item.get("is_thesis_relevant", False)
    ]
    if not qualifying:
        return 0.0

    scores = [float(item.get("thesis_relevance_score", 0)) for item in qualifying]
    return round(sum(scores) / len(scores), 1)


def _compute_thesis_risk(classified_news: list[dict[str, Any]], weights: dict[str, float]) -> float:
    """
    Compute the thesis risk score (0–10).

    Components:
    - official_disclosure: earnings/guidance novel → 10, analyst downgrade/cut → 5
    - regulatory_policy: export_control novel → 10, regulatory mention → 7
    - demand_signal: hyperscaler_capex negative keywords → 8, positive → 5
    - competitive_threat: product_launch with competitor in headline → 5
    """
    official_disclosure = 0.0
    regulatory_policy = 0.0
    demand_signal = 0.0
    competitive_threat = 0.0

    _COMPETITOR_NAMES = ["amd", "intel", "qualcomm", "samsung", "google", "amazon", "microsoft", "meta", "apple", "huawei", "ascend"]
    _NEGATIVE_DEMAND = ["cut", "reduce", "pause", "delay", "cancel", "lower", "decrease", "slash", "trim"]
    _POSITIVE_DEMAND = ["increase", "raise", "boost", "expand", "grow", "accelerate", "double", "triple"]
    _REGULATORY_WORDS = ["regulation", "compliance", "ban", "sanction", "rule", "policy", "restriction", "limit"]

    for item in classified_news:
        event_type = item.get("event_type", "media_noise")
        headline = item.get("headline", "").lower()
        is_novel = item.get("is_novel", False)

        # Official disclosure
        if event_type == "earnings_guidance" and is_novel:
            official_disclosure = max(official_disclosure, 10.0)
        elif event_type == "analyst_action" and any(w in headline for w in ["downgrade", "cut", "reduce", "lower"]):
            official_disclosure = max(official_disclosure, 5.0)

        # Regulatory policy
        if event_type == "export_control" and is_novel:
            regulatory_policy = max(regulatory_policy, 10.0)
        elif any(w in headline for w in _REGULATORY_WORDS):
            regulatory_policy = max(regulatory_policy, 7.0)

        # Demand signal
        if event_type == "hyperscaler_capex":
            is_negative = any(w in headline for w in _NEGATIVE_DEMAND)
            is_positive = any(w in headline for w in _POSITIVE_DEMAND)
            if is_negative:
                demand_signal = max(demand_signal, 8.0)
            elif is_positive:
                demand_signal = max(demand_signal, 5.0)

        # Competitive threat
        if event_type == "product_launch":
            if any(comp in headline for comp in _COMPETITOR_NAMES):
                competitive_threat = max(competitive_threat, 5.0)

    # Apply weights
    thesis_risk = (
        official_disclosure * weights.get("official_disclosure", 0.40)
        + regulatory_policy * weights.get("regulatory_policy", 0.30)
        + demand_signal * weights.get("demand_signal", 0.20)
        + competitive_threat * weights.get("competitive_threat", 0.10)
    )

    return round(_clamp(thesis_risk), 1)


def compute_scores(
    market_data: dict[str, Any],
    classified_news: list[dict[str, Any]],
    macro_events: list[dict[str, Any]],
    weights: dict[str, dict[str, float]],
    is_half_day: bool = False,
) -> dict[str, Any]:
    """
    Compute attention score and thesis risk score.

    Parameters
    ----------
    market_data:
        Output from get_market_data().
    classified_news:
        Output from classify_news().
    macro_events:
        Output from get_macro_events().
    weights:
        SCORING_WEIGHTS dict from config.
    is_half_day:
        Whether today is a half trading day.

    Returns
    -------
    Dict with attention, thesis_risk, watch_level, thesis_verdict, dimension_scores.
    """
    attention_weights = weights.get("attention", {})
    thesis_weights = weights.get("thesis_risk", {})

    # Compute attention sub-scores
    company_catalyst = _compute_company_catalyst(classified_news)
    market_reaction = _compute_market_reaction(market_data)
    macro_risk = _compute_macro_risk(macro_events, market_data, is_half_day, attention_weights)
    thesis_relevance = _compute_thesis_relevance(classified_news)

    # Weighted attention score
    attention = (
        company_catalyst * attention_weights.get("company_catalyst", 0.35)
        + market_reaction * attention_weights.get("market_reaction", 0.25)
        + macro_risk * attention_weights.get("macro_risk", 0.20)
        + thesis_relevance * attention_weights.get("thesis_relevance", 0.20)
    )
    attention = round(_clamp(attention), 1)

    # Thesis risk score
    thesis_risk = _compute_thesis_risk(classified_news, thesis_weights)

    # Derive watch level
    if attention >= 7.0:
        watch_level = "high"
    elif attention >= 5.0:
        watch_level = "moderate"
    else:
        watch_level = "low"

    # Derive thesis verdict
    if thesis_risk >= 6.0:
        thesis_verdict = "at_risk"
    elif thesis_risk >= 4.0:
        thesis_verdict = "monitor"
    else:
        thesis_verdict = "intact"

    dimension_scores = {
        "company_catalyst": round(company_catalyst, 1),
        "market_reaction": round(market_reaction, 1),
        "macro_risk": round(macro_risk, 1),
        "thesis_relevance": round(thesis_relevance, 1),
        "official_disclosure": 0.0,  # will be filled from thesis computation
        "regulatory_policy": 0.0,
        "demand_signal": 0.0,
        "competitive_threat": 0.0,
    }

    # Recompute thesis components for dimension_scores transparency
    _fill_thesis_dimensions(classified_news, dimension_scores)

    logger.info(
        "Scores — Attention: %.1f (%s), Thesis Risk: %.1f (%s)",
        attention, watch_level, thesis_risk, thesis_verdict,
    )

    return {
        "attention": attention,
        "thesis_risk": thesis_risk,
        "validation_loops": 0,
        "confidence": "high",
        "watch_level": watch_level,
        "thesis_verdict": thesis_verdict,
        "dimension_scores": dimension_scores,
    }


def _fill_thesis_dimensions(
    classified_news: list[dict[str, Any]],
    dimension_scores: dict[str, float],
) -> None:
    """Populate thesis dimension sub-scores in the dimension_scores dict."""
    _COMPETITOR_NAMES = ["amd", "intel", "qualcomm", "samsung", "google", "amazon", "microsoft", "meta", "apple", "huawei", "ascend"]
    _NEGATIVE_DEMAND = ["cut", "reduce", "pause", "delay", "cancel", "lower", "decrease", "slash", "trim"]
    _POSITIVE_DEMAND = ["increase", "raise", "boost", "expand", "grow", "accelerate", "double", "triple"]
    _REGULATORY_WORDS = ["regulation", "compliance", "ban", "sanction", "rule", "policy", "restriction", "limit"]

    official = 0.0
    regulatory = 0.0
    demand = 0.0
    competitive = 0.0

    for item in classified_news:
        event_type = item.get("event_type", "media_noise")
        headline = item.get("headline", "").lower()
        is_novel = item.get("is_novel", False)

        if event_type == "earnings_guidance" and is_novel:
            official = max(official, 10.0)
        elif event_type == "analyst_action" and any(w in headline for w in ["downgrade", "cut", "reduce", "lower"]):
            official = max(official, 5.0)

        if event_type == "export_control" and is_novel:
            regulatory = max(regulatory, 10.0)
        elif any(w in headline for w in _REGULATORY_WORDS):
            regulatory = max(regulatory, 7.0)

        if event_type == "hyperscaler_capex":
            if any(w in headline for w in _NEGATIVE_DEMAND):
                demand = max(demand, 8.0)
            elif any(w in headline for w in _POSITIVE_DEMAND):
                demand = max(demand, 5.0)

        if event_type == "product_launch":
            if any(comp in headline for comp in _COMPETITOR_NAMES):
                competitive = max(competitive, 5.0)

    dimension_scores["official_disclosure"] = round(official, 1)
    dimension_scores["regulatory_policy"] = round(regulatory, 1)
    dimension_scores["demand_signal"] = round(demand, 1)
    dimension_scores["competitive_threat"] = round(competitive, 1)
