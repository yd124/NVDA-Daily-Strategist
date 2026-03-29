"""
NVDA Daily Signal — Market Data Fetcher
Fetches pre-market prices, SMAs, peer data, and context metrics via yfinance.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import pandas as pd
import yfinance as yf  # type: ignore[import]

logger = logging.getLogger(__name__)

# Tickers to fetch
_TICKERS = ["NVDA", "QQQ", "SOXX", "AMD", "AVGO", "TSM", "SPY", "^VIX", "^TNX"]
_PEER_TICKERS = ["AMD", "AVGO", "TSM", "QQQ", "SOXX", "SPY"]


def _safe_pct_change(new: float | None, old: float | None) -> float | None:
    """
    Compute percentage change between two prices.

    Returns None if either value is missing or old is zero.
    """
    if new is None or old is None:
        return None
    try:
        new_f = float(new)
        old_f = float(old)
        if old_f == 0.0:
            return None
        return round((new_f - old_f) / old_f * 100.0, 2)
    except (TypeError, ValueError):
        return None


def _get_premarket(ticker_sym: str) -> tuple[float | None, float | None, float | None]:
    """
    Fetch (pre_market_price, pct_change, prev_close) for a ticker.

    Tries fast_info first, then falls back to recent history.
    Returns (None, None, None) on failure.
    """
    try:
        tkr = yf.Ticker(ticker_sym)

        # Attempt fast_info path
        try:
            fi = tkr.fast_info
            pre_price: float | None = getattr(fi, "pre_market_price", None)
            last_price: float | None = getattr(fi, "last_price", None) or getattr(fi, "previous_close", None)

            if pre_price and last_price:
                pct = _safe_pct_change(pre_price, last_price)
                return float(pre_price), pct, float(last_price)
        except Exception:  # noqa: BLE001
            pass

        # Fallback: use 2-day history with pre/post market
        hist = tkr.history(period="2d", prepost=True)
        if hist.empty:
            return None, None, None

        # Split into regular vs extended session
        # Pre-market for today = extended hours rows before normal open on today's date
        import pytz
        et_tz = pytz.timezone("America/New_York")
        now_et = pd.Timestamp.now(tz=et_tz)
        today_str = now_et.date().isoformat()

        if hist.index.tzinfo is None:
            hist.index = hist.index.tz_localize("UTC").tz_convert(et_tz)
        else:
            hist.index = hist.index.tz_convert(et_tz)

        # Previous regular session close
        regular = hist.between_time("09:30", "16:00")
        prev_close_rows = regular[regular.index.date < now_et.date()]
        prev_close = float(prev_close_rows["Close"].iloc[-1]) if not prev_close_rows.empty else None

        # Today's pre-market: before 09:30 ET today
        today_premarket = hist[
            (hist.index.date == now_et.date()) & (hist.index.time < pd.Timestamp("09:30").time())
        ]
        pre_price_fb = float(today_premarket["Close"].iloc[-1]) if not today_premarket.empty else None

        if pre_price_fb is None and not hist.empty:
            pre_price_fb = float(hist["Close"].iloc[-1])

        pct = _safe_pct_change(pre_price_fb, prev_close)
        return pre_price_fb, pct, prev_close

    except Exception as exc:  # noqa: BLE001
        logger.warning("Pre-market fetch failed for %s: %s", ticker_sym, exc)
        return None, None, None


def _get_nvda_sma_data() -> dict[str, float | None]:
    """Fetch 1-year NVDA history and compute 20d, 50d, 200d SMAs."""
    result: dict[str, float | None] = {
        "sma_20d": None,
        "sma_50d": None,
        "sma_200d": None,
        "sma_20d_pct": None,
        "sma_50d_pct": None,
        "sma_200d_pct": None,
    }
    try:
        hist = yf.Ticker("NVDA").history(period="1y")
        if hist.empty or len(hist) < 20:
            return result

        closes = hist["Close"]
        current = float(closes.iloc[-1])

        sma20 = float(closes.tail(20).mean()) if len(closes) >= 20 else None
        sma50 = float(closes.tail(50).mean()) if len(closes) >= 50 else None
        sma200 = float(closes.tail(200).mean()) if len(closes) >= 200 else None

        result["sma_20d"] = round(sma20, 2) if sma20 else None
        result["sma_50d"] = round(sma50, 2) if sma50 else None
        result["sma_200d"] = round(sma200, 2) if sma200 else None
        result["sma_20d_pct"] = _safe_pct_change(current, sma20)
        result["sma_50d_pct"] = _safe_pct_change(current, sma50)
        result["sma_200d_pct"] = _safe_pct_change(current, sma200)

    except Exception as exc:  # noqa: BLE001
        logger.warning("SMA computation failed: %s", exc)

    return result


def _get_context_metrics() -> dict[str, Any]:
    """Fetch context metrics: volume vs 30d avg, 52W high/low, 3M relative strength."""
    ctx: dict[str, Any] = {
        "volume_vs_30d_avg_pct": None,
        "implied_volatility": None,  # placeholder
        "relative_strength_3m_pct": None,
        "week_52_high": None,
        "week_52_low": None,
        "week_52_position_pct": None,
    }
    try:
        hist = yf.Ticker("NVDA").history(period="1y")
        if hist.empty:
            return ctx

        closes = hist["Close"]
        volumes = hist["Volume"]

        # 52W metrics
        w52_high = float(closes.max())
        w52_low = float(closes.min())
        current = float(closes.iloc[-1])

        ctx["week_52_high"] = round(w52_high, 2)
        ctx["week_52_low"] = round(w52_low, 2)

        rng = w52_high - w52_low
        if rng > 0:
            ctx["week_52_position_pct"] = round((current - w52_low) / rng * 100.0, 1)

        # Volume vs 30d avg
        if len(volumes) >= 30:
            avg_30d = float(volumes.tail(30).mean())
            today_vol = float(volumes.iloc[-1])
            if avg_30d > 0:
                ctx["volume_vs_30d_avg_pct"] = round((today_vol / avg_30d - 1.0) * 100.0, 1)

        # 3-month relative strength (price return last 63 trading days)
        if len(closes) >= 63:
            price_3m_ago = float(closes.iloc[-63])
            if price_3m_ago > 0:
                ctx["relative_strength_3m_pct"] = round(
                    (current - price_3m_ago) / price_3m_ago * 100.0, 1
                )

    except Exception as exc:  # noqa: BLE001
        logger.warning("Context metrics computation failed: %s", exc)

    return ctx


async def get_market_data() -> dict[str, Any]:
    """
    Fetch all pre-market market data for NVDA and peers.

    Returns a typed dict with premarket prices, SMAs, peer data, and context metrics.
    All missing values are represented as None.
    """
    loop = asyncio.get_event_loop()

    # Run blocking yfinance calls in thread pool
    def _fetch_all() -> dict[str, Any]:
        # NVDA premarket
        nvda_pre, nvda_pct, nvda_prev_close = _get_premarket("NVDA")

        # Peers
        peers: dict[str, dict[str, Any]] = {}
        for sym in _PEER_TICKERS:
            pre, pct, _ = _get_premarket(sym)
            peers[sym] = {"price": pre, "pct": pct}

        # VIX and 10Y
        vix_pre, vix_pct, vix_prev = _get_premarket("^VIX")
        tnx_pre, tnx_pct, tnx_prev = _get_premarket("^TNX")

        # SMAs
        sma_data = _get_nvda_sma_data()

        # NVDA vs SOXX spread
        nvda_vs_soxx: float | None = None
        try:
            soxx_pct = peers.get("SOXX", {}).get("pct")
            if nvda_pct is not None and soxx_pct is not None:
                nvda_vs_soxx = round(float(nvda_pct) - float(soxx_pct), 2)
        except Exception:  # noqa: BLE001
            pass

        # Context metrics
        ctx = _get_context_metrics()

        # Add VIX to context (useful for scoring)
        ctx["vix_price"] = vix_pre
        ctx["tnx_price"] = tnx_pre

        return {
            "nvda_premarket_price": nvda_pre,
            "nvda_premarket_pct": nvda_pct,
            "nvda_premarket_prev_close": nvda_prev_close,
            "sma_20d": sma_data["sma_20d"],
            "sma_50d": sma_data["sma_50d"],
            "sma_200d": sma_data["sma_200d"],
            "sma_20d_pct": sma_data["sma_20d_pct"],
            "sma_50d_pct": sma_data["sma_50d_pct"],
            "sma_200d_pct": sma_data["sma_200d_pct"],
            "peers": peers,
            "nvda_vs_soxx": nvda_vs_soxx,
            "context_metrics": ctx,
        }

    try:
        result = await loop.run_in_executor(None, _fetch_all)
        logger.info(
            "Market data fetched — NVDA premarket: %s (%s%%)",
            result.get("nvda_premarket_price"),
            result.get("nvda_premarket_pct"),
        )
        return result
    except Exception as exc:  # noqa: BLE001
        logger.error("Market data fetch failed entirely: %s", exc)
        return {
            "nvda_premarket_price": None,
            "nvda_premarket_pct": None,
            "nvda_premarket_prev_close": None,
            "sma_20d": None,
            "sma_50d": None,
            "sma_200d": None,
            "sma_20d_pct": None,
            "sma_50d_pct": None,
            "sma_200d_pct": None,
            "peers": {},
            "nvda_vs_soxx": None,
            "context_metrics": {
                "volume_vs_30d_avg_pct": None,
                "implied_volatility": None,
                "relative_strength_3m_pct": None,
                "week_52_high": None,
                "week_52_low": None,
                "week_52_position_pct": None,
            },
        }
