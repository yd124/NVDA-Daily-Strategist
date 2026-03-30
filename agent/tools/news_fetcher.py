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
# SEC EDGAR NVDA 8-K filings feed (CIK 1045810) — official material event disclosures
_SEC_EDGAR_URL = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=8-K&dateb=&owner=include&count=10&search_text=&output=atom"
_SEC_HEADERS = {"User-Agent": "NVDA-signal/1.0 contact@nvdasignal.local"}


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


def _fetch_newsapi(
    api_key: str,
    lookback_hours: int,
    reference_date: "date | None" = None,
) -> list[dict[str, Any]]:
    """Fetch news from NewsAPI Everything endpoint."""
    from datetime import date as _date  # local import to avoid circular

    items: list[dict[str, Any]] = []
    try:
        if reference_date is not None:
            # Fetch news relative to the reference date: from (reference_date - lookback) to end of reference_date
            ref_end = datetime(
                reference_date.year, reference_date.month, reference_date.day,
                23, 59, 59, tzinfo=timezone.utc,
            )
            from_dt = ref_end - timedelta(hours=lookback_hours)
            to_str = ref_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            from_dt = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
            to_str = None

        from_str = from_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        params = {
            "q": 'NVDA OR "Nvidia stock" OR "Nvidia earnings" OR "Nvidia revenue" OR "Jensen Huang" OR "Nvidia shares" OR "Nvidia Corporation"',
            "searchIn": "title,description",
            "from": from_str,
            "sortBy": "publishedAt",
            "language": "en",
            "pageSize": 20,
            "apiKey": api_key,
        }
        if to_str:
            params["to"] = to_str

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


_SEC_ITEM_LABELS = {
    "1.01": "Material Agreement",
    "1.02": "Agreement Termination",
    "2.02": "Earnings / Results of Operations",
    "2.03": "Obligation / Off-Balance Sheet",
    "5.02": "Executive / Director Change",
    "7.01": "Regulation FD Disclosure",
    "8.01": "Material Event / Press Release",
    "9.01": None,  # Always "Exhibits" — skip
}


def _fetch_sec_edgar_8k() -> list[dict[str, Any]]:
    """Fetch NVDA 8-K filings from SEC EDGAR as official disclosure items."""
    items: list[dict[str, Any]] = []
    try:
        resp = requests.get(_SEC_EDGAR_URL, headers=_SEC_HEADERS, timeout=15)
        resp.raise_for_status()
        feed = feedparser.parse(resp.text)

        for entry in feed.entries[:10]:
            items_desc = entry.get("items-desc", "").strip()
            filing_date = entry.get("filing-date", "").strip()
            link = entry.get("link", "")
            form_name = entry.get("form-name", "8-K").strip()

            # Build a meaningful headline from items-desc.
            # Format is compact: "items 2.02 and 9.01" or "item 5.02"
            import re as _re
            item_numbers = _re.findall(r"\d+\.\d+", items_desc.lower())
            meaningful = [
                _SEC_ITEM_LABELS[n]
                for n in item_numbers
                if n in _SEC_ITEM_LABELS and _SEC_ITEM_LABELS[n] is not None
            ]
            if meaningful:
                headline = f"NVDA 8-K: {' / '.join(meaningful)}"
            else:
                headline = f"NVDA SEC {form_name} Filing"

            # Parse filing date
            pub_iso = ""
            if filing_date:
                try:
                    pub_iso = datetime.strptime(filing_date, "%Y-%m-%d").replace(
                        tzinfo=timezone.utc
                    ).isoformat()
                except ValueError:
                    pub_iso = ""

            items.append(
                {
                    "headline": headline,
                    "source": "SEC EDGAR",
                    "source_url": link,
                    "published_at": pub_iso,
                    "raw_description": items_desc[:500],
                    "_tier": 1,  # SEC is tier 1 — official government source
                    "source_tier": 1,
                }
            )

        logger.info("SEC EDGAR returned %d NVDA 8-K entries.", len(items))
    except Exception as exc:  # noqa: BLE001
        logger.warning("SEC EDGAR fetch failed: %s", exc)

    return items


async def get_nvda_news(
    api_key: str,
    lookback_hours: int = 18,
    reference_date: "date | None" = None,
) -> list[dict[str, Any]]:
    """
    Fetch NVDA-related news from NewsAPI and Nvidia IR RSS.

    Parameters
    ----------
    api_key:
        NewsAPI key.
    lookback_hours:
        How many hours back to fetch news for.
    reference_date:
        If provided, fetches news relative to this date instead of now.
        Used when running with --date override.

    Returns
    -------
    Deduplicated list of news item dicts, capped at MAX_NEWS_ITEMS.
    Returns empty list on total failure.
    """
    loop = asyncio.get_event_loop()

    try:
        # Run both fetches concurrently in thread pool
        newsapi_items, sec_items = await asyncio.gather(
            loop.run_in_executor(None, _fetch_newsapi, api_key, lookback_hours, reference_date),
            loop.run_in_executor(None, _fetch_sec_edgar_8k),
        )

        # Combine: SEC filings first (tier 1, highest priority), then NewsAPI
        combined = list(sec_items) + list(newsapi_items)

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
