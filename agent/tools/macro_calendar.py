"""
NVDA Daily Signal — Macro Calendar Fetcher
Fetches today's macro economic events from public RSS feeds.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import ssl
import feedparser  # type: ignore[import]

# macOS local SSL fix — acceptable for a personal local tool
try:
    _SSL_CTX = ssl.create_default_context()
except Exception:  # noqa: BLE001
    _SSL_CTX = None

logger = logging.getLogger(__name__)

_FXSTREET_RSS = "https://www.fxstreet.com/economic-calendar/rss"
_DOWJONES_RSS = "https://feeds.content.dowjones.io/public/rss/mktw_realtimecalendar"

_IMPACT_KEYWORDS: dict[str, list[str]] = {
    "high": [
        "fed", "fomc", "interest rate", "cpi", "pce", "gdp", "nfp",
        "nonfarm", "payroll", "unemployment", "inflation",
    ],
    "medium": [
        "pmi", "ism", "retail", "housing", "durable", "trade balance",
        "consumer confidence", "earnings",
    ],
}


def _classify_impact(title: str, summary: str) -> str:
    """Classify macro event impact as high / medium / low based on keywords."""
    text = (title + " " + summary).lower()
    for kw in _IMPACT_KEYWORDS["high"]:
        if kw in text:
            return "high"
    for kw in _IMPACT_KEYWORDS["medium"]:
        if kw in text:
            return "medium"
    return "low"


def _parse_feed(url: str) -> list[dict[str, Any]]:
    """Parse a macro calendar RSS feed and return today's events."""
    events: list[dict[str, Any]] = []
    today = datetime.now(timezone.utc).date()

    try:
        feed = feedparser.parse(url, handlers=[])
        # If SSL error, retry without verification (local tool only)
        if feed.bozo and "CERTIFICATE" in str(feed.bozo_exception).upper():
            import urllib.request
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            req = urllib.request.urlopen(url, context=ctx, timeout=10)
            feed = feedparser.parse(req.read().decode("utf-8"))

        if feed.bozo and not feed.entries:
            logger.warning("Feed parse warning for %s: %s", url, feed.bozo_exception)
            return events

        for entry in feed.entries:
            title = entry.get("title", "").strip()
            summary = entry.get("summary", entry.get("description", "")).strip()

            # Parse published/scheduled time
            pub_parsed = entry.get("published_parsed") or entry.get("updated_parsed")
            scheduled_at = ""
            entry_date = None

            if pub_parsed:
                try:
                    dt = datetime(*pub_parsed[:6], tzinfo=timezone.utc)
                    entry_date = dt.date()
                    scheduled_at = dt.isoformat()
                except Exception:  # noqa: BLE001
                    pass

            # Only include today's events
            if entry_date is not None and entry_date != today:
                continue

            if not title:
                continue

            impact = _classify_impact(title, summary)
            events.append(
                {
                    "event": title,
                    "description": summary[:300],
                    "scheduled_at": scheduled_at,
                    "impact": impact,
                }
            )

        logger.info("Parsed %d today-events from %s", len(events), url)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to parse macro feed %s: %s", url, exc)

    return events


async def get_macro_events() -> list[dict[str, Any]]:
    """
    Fetch today's macro economic events from RSS feeds.

    Tries FXStreet RSS first, then Dow Jones / MarketWatch.
    Returns an empty list on any failure — macro events unavailable is acceptable.
    """
    loop = asyncio.get_event_loop()

    events: list[dict[str, Any]] = []

    try:
        fxstreet_events, dowjones_events = await asyncio.gather(
            loop.run_in_executor(None, _parse_feed, _FXSTREET_RSS),
            loop.run_in_executor(None, _parse_feed, _DOWJONES_RSS),
        )

        # Combine and deduplicate by event title
        seen_titles: set[str] = set()
        for event in fxstreet_events + dowjones_events:
            t = event["event"].lower()[:60]
            if t not in seen_titles:
                seen_titles.add(t)
                events.append(event)

        # Sort by impact priority (high first)
        impact_order = {"high": 0, "medium": 1, "low": 2}
        events.sort(key=lambda e: impact_order.get(e.get("impact", "low"), 2))

        logger.info("Total macro events for today: %d", len(events))

    except Exception as exc:  # noqa: BLE001
        print(f"[macro_calendar] Failed to fetch macro events: {exc}")
        return []

    return events
