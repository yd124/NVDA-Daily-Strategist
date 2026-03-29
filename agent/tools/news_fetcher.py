"""
NVDA Daily Signal — News Fetcher
Fetches NVDA-related news from NewsAPI and Nvidia IR RSS feed.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Any

import feedparser  # type: ignore[import]
import requests

from agent.config import MAX_NEWS_ITEMS
from agent.tools.source_verifier import get_source_tier

logger = logging.getLogger(__name__)

_NEWSAPI_URL = "https://newsapi.org/v2/everything"
_NVIDIA_IR_RSS = "https://investor.nvidia.com/rss/news_releases.ashx?exchange=&category=&action=getall"


def _headlines_similar(h1: str, h2: str) -> bool:
    """Return True if the first 60 characters of two headlines match (case-insensitive)."""
    return h1.lower()[:60] == h2.lower()[:60]


def _deduplicate(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Remove duplicate stories keeping the one from the highest-tier source.
    Two items are considered duplicates if their first 60 chars match.
    """
    unique: list[dict[str, Any]] = []
    for item in items:
        found = False
        for i, existing in enumerate(unique):
            if _headlines_similar(item["headline"], existing["headline"]):
                # Keep whichever has the lower tier number (higher trust)
                if item.get("_tier", 3) < existing.get("_tier", 3):
                    unique[i] = item
                found = True
                break
        if not found:
            unique.append(item)
    return unique


def _fetch_newsapi(api_key: str, lookback_hours: int) -> list[dict[str, Any]]:
    """Fetch news from NewsAPI Everything endpoint."""
    items: list[dict[str, Any]] = []
    try:
        from_dt = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
        from_str = from_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        params = {
            "q": 'NVDA OR Nvidia OR "Nvidia Corporation"',
            "from": from_str,
            "sortBy": "publishedAt",
            "language": "en",
            "pageSize": 20,
            "apiKey": api_key,
        }

        resp = requests.get(_NEWSAPI_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        for article in data.get("articles", []):
            source_name = article.get("source", {}).get("name", "Unknown")
            source_url = article.get("url", "")
            headline = article.get("title", "").strip()
            if not headline or headline == "[Removed]":
                continue

            tier = get_source_tier(source_url)
            items.append(
                {
                    "headline": headline,
                    "source": source_name,
                    "source_url": source_url,
                    "published_at": article.get("publishedAt", ""),
                    "raw_description": (article.get("description") or "")[:500],
                    "_tier": tier,
                    "source_tier": tier,
                }
            )

        logger.info("NewsAPI returned %d articles.", len(items))
    except Exception as exc:  # noqa: BLE001
        logger.warning("NewsAPI fetch failed: %s", exc)

    return items


def _fetch_nvidia_ir_rss() -> list[dict[str, Any]]:
    """Fetch Nvidia investor-relations RSS feed and return last 10 entries."""
    items: list[dict[str, Any]] = []
    try:
        feed = feedparser.parse(_NVIDIA_IR_RSS)
        for entry in feed.entries[:10]:
            headline = entry.get("title", "").strip()
            if not headline:
                continue

            pub_parsed = entry.get("published_parsed")
            pub_iso = ""
            if pub_parsed:
                try:
                    pub_iso = datetime(*pub_parsed[:6], tzinfo=timezone.utc).isoformat()
                except Exception:  # noqa: BLE001
                    pub_iso = entry.get("published", "")

            link = entry.get("link", _NVIDIA_IR_RSS)
            tier = 1  # investor.nvidia.com is tier 1

            items.append(
                {
                    "headline": headline,
                    "source": "Nvidia Investor Relations",
                    "source_url": link,
                    "published_at": pub_iso,
                    "raw_description": entry.get("summary", "")[:500],
                    "_tier": tier,
                    "source_tier": tier,
                }
            )

        logger.info("Nvidia IR RSS returned %d entries.", len(items))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Nvidia IR RSS fetch failed: %s", exc)

    return items


async def get_nvda_news(api_key: str, lookback_hours: int = 18) -> list[dict[str, Any]]:
    """
    Fetch NVDA-related news from NewsAPI and Nvidia IR RSS.

    Parameters
    ----------
    api_key:
        NewsAPI key.
    lookback_hours:
        How many hours back to fetch news for.

    Returns
    -------
    Deduplicated list of news item dicts, capped at MAX_NEWS_ITEMS.
    Returns empty list on total failure.
    """
    loop = asyncio.get_event_loop()

    try:
        # Run both fetches concurrently in thread pool
        newsapi_items, ir_items = await asyncio.gather(
            loop.run_in_executor(None, _fetch_newsapi, api_key, lookback_hours),
            loop.run_in_executor(None, _fetch_nvidia_ir_rss),
        )

        # Combine: IR first (higher priority), then NewsAPI
        combined = list(ir_items) + list(newsapi_items)

        # Deduplicate
        deduped = _deduplicate(combined)

        # Sort by tier (ascending = better first), then by published date desc
        deduped.sort(key=lambda x: (x.get("_tier", 3), x.get("published_at", "") or ""), reverse=False)
        # Re-sort: lower tier number = better; within same tier, newer first
        deduped.sort(key=lambda x: (-x.get("_tier", 3), x.get("published_at", "") or ""))
        # Actually: sort so tier 1 comes first (ascending tier), newest first within tier
        deduped.sort(key=lambda x: (x.get("_tier", 3), -(0 if not x.get("published_at") else 1)))

        # Clean up internal fields
        result = []
        for item in deduped[:MAX_NEWS_ITEMS]:
            clean = {k: v for k, v in item.items() if not k.startswith("_")}
            result.append(clean)

        logger.info("Total news items after dedup: %d (capped at %d).", len(result), MAX_NEWS_ITEMS)
        return result

    except Exception as exc:  # noqa: BLE001
        logger.error("News fetch failed entirely: %s", exc)
        return []
