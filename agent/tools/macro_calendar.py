"""
NVDA Daily Signal — Macro Calendar Fetcher
Fetches US economic events from ForexFactory's public XML calendar.
"""

from __future__ import annotations

import asyncio
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, date as _date
from typing import Any

import requests

logger = logging.getLogger(__name__)

# ForexFactory publishes a free XML feed of the current week's events.
_FOREXFACTORY_XML = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml"

_IMPACT_MAP = {
    "High":   "high",
    "Medium": "medium",
    "Low":    "low",
    "Holiday": "low",
    "Non-Economic": "low",
}

_HIGH_IMPACT_KEYWORDS = [
    "fed", "fomc", "interest rate", "cpi", "pce", "gdp",
    "nfp", "nonfarm", "payroll", "unemployment", "inflation",
]

_MEDIUM_IMPACT_KEYWORDS = [
    "pmi", "ism", "retail", "housing", "durable", "trade balance",
    "consumer confidence", "earnings",
]


def _classify_impact_from_title(title: str, ff_impact: str) -> str:
    """Use ForexFactory impact level, then keyword fallback."""
    mapped = _IMPACT_MAP.get(ff_impact)
    if mapped in ("high", "medium"):
        return mapped
    # keyword fallback
    lower = title.lower()
    for kw in _HIGH_IMPACT_KEYWORDS:
        if kw in lower:
            return "high"
    for kw in _MEDIUM_IMPACT_KEYWORDS:
        if kw in lower:
            return "medium"
    return mapped or "low"


def _parse_forexfactory(reference_date: _date | None = None) -> list[dict[str, Any]]:
    """
    Fetch and parse the ForexFactory weekly XML calendar.
    Returns USD events for the target date only.
    """
    target_date = reference_date or datetime.now(timezone.utc).date()
    events: list[dict[str, Any]] = []

    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; NVDA-signal-bot/1.0)"}
        resp = requests.get(_FOREXFACTORY_XML, timeout=15, headers=headers)
        resp.raise_for_status()

        root = ET.fromstring(resp.content)

        for event in root.findall("event"):
            # Only USD events matter for NVDA
            country = (event.findtext("country") or "").strip()
            if country != "USD":
                continue

            title = (event.findtext("title") or "").strip()
            if not title:
                continue

            # ForexFactory date format: MM-DD-YYYY
            date_raw = (event.findtext("date") or "").strip()
            event_date: _date | None = None
            if date_raw:
                try:
                    event_date = datetime.strptime(date_raw, "%m-%d-%Y").date()
                except ValueError:
                    pass

            if event_date is None or event_date != target_date:
                continue

            time_raw = (event.findtext("time") or "").strip()
            ff_impact = (event.findtext("impact") or "Low").strip()
            forecast = (event.findtext("forecast") or "").strip()
            previous = (event.findtext("previous") or "").strip()

            impact = _classify_impact_from_title(title, ff_impact)

            # Build a scheduled_at ISO string if we can parse the time
            scheduled_at = ""
            if time_raw and time_raw.lower() not in ("all day", "tentative", ""):
                try:
                    import pytz
                    et_tz = pytz.timezone("America/New_York")
                    t = datetime.strptime(time_raw, "%I:%M%p")
                    dt_et = et_tz.localize(
                        datetime(event_date.year, event_date.month, event_date.day,
                                 t.hour, t.minute)
                    )
                    scheduled_at = dt_et.astimezone(timezone.utc).isoformat()
                except Exception:  # noqa: BLE001
                    scheduled_at = ""

            description = ""
            if forecast:
                description += f"Forecast: {forecast}"
            if previous:
                description += f"  Previous: {previous}"

            events.append({
                "event": title,
                "description": description.strip(),
                "scheduled_at": scheduled_at,
                "impact": impact,
            })

        # Sort by impact priority (high first)
        impact_order = {"high": 0, "medium": 1, "low": 2}
        events.sort(key=lambda e: impact_order.get(e.get("impact", "low"), 2))

        logger.info("ForexFactory: %d USD events for %s.", len(events), target_date)

    except Exception as exc:  # noqa: BLE001
        logger.warning("ForexFactory macro calendar failed: %s", exc)

    return events


async def get_macro_events(reference_date: _date | None = None) -> list[dict[str, Any]]:
    """
    Fetch US macro economic events for the target date from ForexFactory.

    Parameters
    ----------
    reference_date:
        Date to fetch events for. Defaults to today UTC.

    Returns an empty list on failure — macro data unavailable is acceptable.
    """
    loop = asyncio.get_event_loop()
    try:
        events = await loop.run_in_executor(None, _parse_forexfactory, reference_date)
        logger.info("Total macro events: %d", len(events))
        return events
    except Exception as exc:  # noqa: BLE001
        logger.warning("get_macro_events failed: %s", exc)
        return []
