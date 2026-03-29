"""
NVDA Daily Signal — Source Verifier
Classifies news sources into trust tiers and filters news accordingly.
"""

from __future__ import annotations

from urllib.parse import urlparse

from agent.config import TRUSTED_SOURCES


def get_domain(url: str) -> str:
    """
    Extract the base domain from a URL.

    Examples
    --------
    >>> get_domain("https://www.reuters.com/article/xyz")
    'reuters.com'
    >>> get_domain("https://investor.nvidia.com/releases/release-123")
    'investor.nvidia.com'
    """
    if not url:
        return ""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        # Strip 'www.' prefix
        if hostname.startswith("www."):
            hostname = hostname[4:]
        return hostname.lower()
    except Exception:  # noqa: BLE001
        return ""


def get_source_tier(url: str) -> int:
    """
    Return the trust tier (1, 2, or 3) for a given source URL.

    Tier 1 = Official / regulatory (highest trust)
    Tier 2 = Major financial media
    Tier 3 = Everything else (default)
    """
    domain = get_domain(url)
    if not domain:
        return 3

    if domain in TRUSTED_SOURCES.get("tier_1", []):
        return 1

    # Check for domain or subdomain match for tier 2
    for t2_domain in TRUSTED_SOURCES.get("tier_2", []):
        if domain == t2_domain or domain.endswith("." + t2_domain):
            return 2

    return 3


def filter_by_tier(news_items: list[dict], max_tier: int = 3) -> list[dict]:
    """
    Filter news items keeping only those from sources at or above max_tier.

    Parameters
    ----------
    news_items:
        List of news item dicts containing a 'source_url' key.
    max_tier:
        Maximum tier number to include. Default 3 = include all tiers.

    Returns
    -------
    Filtered list preserving original order.
    """
    return [
        item for item in news_items
        if get_source_tier(item.get("source_url", "")) <= max_tier
    ]
