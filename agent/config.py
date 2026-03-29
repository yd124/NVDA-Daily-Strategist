"""
NVDA Daily Signal — Configuration Module
Central configuration for scoring weights, thresholds, and constants.
"""

from pathlib import Path

# ---------------------------------------------------------------------------
# Scoring weights
# ---------------------------------------------------------------------------

SCORING_WEIGHTS: dict[str, dict[str, float]] = {
    "attention": {
        "company_catalyst": 0.35,
        "market_reaction": 0.25,
        "macro_risk": 0.20,
        "thesis_relevance": 0.20,
    },
    "thesis_risk": {
        "official_disclosure": 0.40,
        "regulatory_policy": 0.30,
        "demand_signal": 0.20,
        "competitive_threat": 0.10,
    },
}

# ---------------------------------------------------------------------------
# Validation trigger thresholds
# ---------------------------------------------------------------------------

VALIDATION_TRIGGER: dict[str, float | int] = {
    "score_threshold": 6.0,
    "premarket_move_threshold": 2.0,
    "max_iterations": 2,
}

# ---------------------------------------------------------------------------
# Scoring modifiers
# ---------------------------------------------------------------------------

HALF_DAY_MACRO_WEIGHT_REDUCTION: float = 0.05

# ---------------------------------------------------------------------------
# Token / data limits
# ---------------------------------------------------------------------------

TOKEN_BUDGET: int = 8000
MAX_NEWS_ITEMS: int = 12
NEWS_LOOKBACK_HOURS: int = 18
NEWS_EXTENDED_LOOKBACK_HOURS: int = 24

# ---------------------------------------------------------------------------
# Trusted news sources
# ---------------------------------------------------------------------------

TRUSTED_SOURCES: dict[str, list[str]] = {
    "tier_1": [
        "investor.nvidia.com",
        "sec.gov",
        "federalregister.gov",
    ],
    "tier_2": [
        "reuters.com",
        "bloomberg.com",
        "wsj.com",
        "ft.com",
        "barrons.com",
        "seekingalpha.com",
        "cnbc.com",
        "marketwatch.com",
        "apnews.com",
    ],
    "tier_3": [],  # Everything else falls into tier 3
}

# ---------------------------------------------------------------------------
# Peer tickers
# ---------------------------------------------------------------------------

PEERS: list[str] = ["AMD", "AVGO", "TSM", "QQQ", "SOXX", "SPY"]

# ---------------------------------------------------------------------------
# Claude model
# ---------------------------------------------------------------------------

MODEL: str = "claude-sonnet-4-6"

# ---------------------------------------------------------------------------
# Output paths
# ---------------------------------------------------------------------------

LOG_PATH: Path = Path("/Users/yokeroil/Documents/NVDA/data/nvda_daily_log.json")
