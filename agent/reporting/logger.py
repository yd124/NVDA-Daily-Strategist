"""
NVDA Daily Signal — Report Logger
Appends pipeline output to the JSON log file atomically.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def append_to_log(entry: dict[str, Any], log_path: Path) -> bool:
    """
    Append a single report entry to the JSON log file.

    The log file is a JSON array of DailyEntry objects.
    Writes atomically: writes to a .tmp file first, then renames.

    Parameters
    ----------
    entry:
        The log entry dict to append.
    log_path:
        Full path to the target JSON log file.

    Returns
    -------
    True on success, False on any failure. Never raises.
    """
    try:
        # Ensure the parent directory exists
        log_path.parent.mkdir(parents=True, exist_ok=True)

        # Read existing entries
        existing: list[Any] = []
        if log_path.exists() and log_path.stat().st_size > 0:
            try:
                with log_path.open("r", encoding="utf-8") as fh:
                    existing = json.load(fh)
                if not isinstance(existing, list):
                    logger.warning(
                        "Log file %s contained non-array JSON — resetting to empty list.",
                        log_path,
                    )
                    existing = []
            except (json.JSONDecodeError, OSError) as exc:
                logger.warning(
                    "Could not read existing log file %s (%s) — starting fresh.",
                    log_path,
                    exc,
                )
                existing = []

        existing.append(entry)

        # Write atomically via temp file + rename
        tmp_path = log_path.with_suffix(".tmp")
        try:
            with tmp_path.open("w", encoding="utf-8") as fh:
                json.dump(existing, fh, ensure_ascii=False, indent=2, default=str)
                fh.flush()

            tmp_path.replace(log_path)
            logger.info("Log entry written to %s (total entries: %d).", log_path, len(existing))
            return True

        except Exception as write_exc:  # noqa: BLE001
            logger.error("Failed to write log entry: %s", write_exc)
            # Clean up temp file if it exists
            try:
                if tmp_path.exists():
                    tmp_path.unlink()
            except Exception:  # noqa: BLE001
                pass
            return False

    except Exception as exc:  # noqa: BLE001
        logger.error("append_to_log encountered unexpected error: %s", exc)
        return False
