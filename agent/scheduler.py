"""
NVDA Daily Signal — Trading Day Scheduler
Determines whether today is a full trading day, half day, or non-trading day.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time

import pytz

logger = logging.getLogger(__name__)

ET_TZ = pytz.timezone("America/New_York")


def get_session_type(check_date: date | None = None) -> str | None:
    """
    Determine the NYSE session type for a given date.

    Parameters
    ----------
    check_date:
        The date to check. Defaults to today in Eastern Time.

    Returns
    -------
    "full"  — full trading day
    "half"  — early-close / half day (market closes before 4 PM ET)
    None    — non-trading day (weekend or market holiday)
    """
    if check_date is None:
        check_date = datetime.now(ET_TZ).date()

    try:
        import pandas_market_calendars as mcal  # type: ignore[import]
        import pandas as pd

        nyse = mcal.get_calendar("NYSE")

        # Fetch schedule for the single target date
        schedule = nyse.schedule(
            start_date=check_date.isoformat(),
            end_date=check_date.isoformat(),
        )

        if schedule.empty:
            logger.info("No NYSE session scheduled for %s — non-trading day.", check_date)
            return None

        # market_close is returned as a timezone-aware Timestamp in UTC
        market_close_utc = schedule.iloc[0]["market_close"]
        market_close_et: datetime = market_close_utc.astimezone(ET_TZ)

        # A "half day" closes before 4:00 PM ET
        normal_close = time(16, 0, 0)
        if market_close_et.time() < normal_close:
            logger.info(
                "NYSE half-day detected for %s — market closes at %s ET.",
                check_date,
                market_close_et.strftime("%H:%M"),
            )
            return "half"

        logger.info("NYSE full trading day for %s.", check_date)
        return "full"

    except Exception as exc:  # noqa: BLE001
        # Calendar check failed — assume full day to avoid missed signals
        logger.warning(
            "Calendar check failed for %s (%s). Assuming full trading day.",
            check_date,
            exc,
        )
        return "full"
