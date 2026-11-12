#!/usr/bin/env python3
"""Weekly price checker for src/data/pseo-tools.json.

For every tool it fetches `official_pricing_url`, extracts the price using the
tool's `price_selector` (CSS) and/or `price_regex`, and updates `current_price`.

If ANYTHING goes wrong for a tool (network error, anti-bot block, missing
selector, unparseable or suspicious price) the script:
  1. sets   "status": "needs_manual_review"   (the old price is kept),
  2. logs the failing URL (stdout + logs/failed_urls.log),
  3. fires an instant Discord and/or Telegram alert.

Usage:
    python3 scripts/update_prices.py [--only slug ...] [--dry-run]
                                     [--max-change 0.5] [--strict]
"""
from __future__ import annotations

import argparse
import logging
import os
import random
import re
import sys
import time
from datetime import datetime, timezone
from typing import Any

import requests
from bs4 import BeautifulSoup

from common import LOG_DIR, ROOT, load_env, load_tools, save_tools

log = logging.getLogger("update_prices")

USER_AGENTS = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]
BLOCK_STATUS = {401, 403, 429, 451, 503}
BLOCK_MARKERS = (
    "captcha",
    "cf-challenge",
    "just a moment...",
    "attention required",
    "access denied",
    "verify you are human",
    "unusual traffic",
)
PRICE_NUMBER = re.compile(r"(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?")
FREE_WORDS = re.compile(r"\bfree\b", re.I)


class PriceCheckError(Exception):
    """Any recoverable per-tool failure."""


class BlockedError(PriceCheckError):
    """Looks like an anti-bot wall."""


class ParseError(PriceCheckError):
    """Selector/regex problems or an unparseable price."""


# --------------------------------------------------------------------------- #
# Alerts
# --------------------------------------------------------------------------- #
def send_alert(message: str) -> bool:
    """Send `message` to every configured channel. Never raises.

    Channels (env vars):
      Discord  : DISCORD_WEBHOOK_URL
      Telegram : TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
    Returns True if at least one channel accepted the message.
    """
    delivered = False
    configured = False

    discord = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if discord:
        configured = True
        try:
            r = requests.post(discord, json={"content": message[:1900]}, timeout=10)
            r.raise_for_status()
            delivered = True
        except requests.RequestException as exc:
            # Exception text can embed the webhook URL (a secret); log the type only.
            log.error("Discord alert failed (%s)", type(exc).__name__)

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if token and chat_id:
        configured = True
        try:
            r = requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message[:4000],
                    "disable_web_page_preview": True,
                },
                timeout=10,
            )
            r.raise_for_status()
            delivered = True
        except requests.RequestException as exc:
            # The request URL contains the bot token; log the type only.
            log.error("Telegram alert failed (%s)", type(exc).__name__)

    if not configured:
        log.warning("No alert channel configured (set DISCORD_WEBHOOK_URL or TELEGRAM_*).")
    return delivered


def log_failed_url(tool: dict[str, Any], reason: str) -> None:
    LOG_DIR.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    line = f"{stamp}\t{tool['slug']}\t{tool.get('official_pricing_url', '')}\t{reason}\n"
    with (LOG_DIR / "failed_urls.log").open("a", encoding="utf-8") as fh:
        fh.write(line)


# --------------------------------------------------------------------------- #
# Scraping
# --------------------------------------------------------------------------- #
def fetch_html(url: str, retries: int = 2, timeout: int = 20) -> str:
    session = requests.Session()
    last: Exception | None = None
    for attempt in range(retries + 1):
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        try:
            resp = session.get(url, headers=headers, timeout=timeout)
        except requests.RequestException as exc:
            last = PriceCheckError(f"network error: {type(exc).__name__}: {exc}")
        else:
            if resp.status_code in BLOCK_STATUS:
                # Retrying an anti-bot wall just makes it worse.
                raise BlockedError(f"HTTP {resp.status_code} (likely anti-bot block)")
            if resp.status_code >= 500:
                last = PriceCheckError(f"HTTP {resp.status_code}")
            elif resp.status_code >= 400:
                raise PriceCheckError(f"HTTP {resp.status_code}")
            else:
                head = resp.text[:6000].lower()
                if any(m in head for m in BLOCK_MARKERS):
                    raise BlockedError("anti-bot / captcha page detected")
                return resp.text
        if attempt < retries:
            time.sleep(2 * (attempt + 1))
    assert last is not None
    raise last


def parse_price_text(text: str) -> float:
    """'$1,299.50 / mo' -> 1299.5 ; 'Free' -> 0.0."""
    m = PRICE_NUMBER.search(text)
    if not m:
        if FREE_WORDS.search(text):
            return 0.0
        raise ParseError(f"no number found in text {text[:60]!r}")
    whole = m.group(1).replace(",", "")
    return float(f"{whole}.{m.group(2)}") if m.group(2) else float(whole)


def extract_price(html: str, tool: dict[str, Any]) -> float:
    selector = tool.get("price_selector")
    pattern = tool.get("price_regex")
    if not selector and not pattern:
        raise ParseError("neither price_selector nor price_regex configured")

    soup = BeautifulSoup(html, "html.parser")
    if selector:
        try:
            node = soup.select_one(selector)
        except Exception as exc:  # invalid CSS selector
            raise ParseError(f"invalid selector {selector!r}: {exc}") from exc
        if node is None:
            raise ParseError(f"selector {selector!r} matched nothing (page layout changed or JS-rendered)")
        return parse_price_text(node.get_text(" ", strip=True))

    try:
        m = re.search(pattern, soup.get_text(" ", strip=True))
    except re.error as exc:
        raise ParseError(f"invalid regex {pattern!r}: {exc}") from exc
    if not m:
        raise ParseError(f"regex {pattern!r} matched nothing")
    return parse_price_text(m.group(1) if m.groups() else m.group(0))



# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #
def check_tool(tool: dict[str, Any], max_change: float) -> float:
    html = fetch_html(tool["official_pricing_url"])
    price = extract_price(html, tool)
    old = tool.get("current_price")
    if old and max_change > 0 and abs(price - old) / old > max_change:
        raise ParseError(
            f"suspicious price jump {old} -> {price} (> {max_change:.0%}); "
            "verify the selector or the real price manually"
        )
    return price


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", nargs="*", help="only check these slugs")
    parser.add_argument("--dry-run", action="store_true", help="don't write pseo-tools.json or send alerts")
    parser.add_argument("--max-change", type=float, default=0.5,
                        help="flag price changes larger than this fraction (0 disables; default 0.5)")
    parser.add_argument("--delay", type=float, default=2.0, help="seconds between requests")
    parser.add_argument("--strict", action="store_true", help="exit 1 if any tool failed")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    load_env()

    tools = load_tools()
    if args.only:
        unknown = set(args.only) - {t["slug"] for t in tools}
        if unknown:
            log.error("Unknown slug(s): %s", ", ".join(sorted(unknown)))
            return 2
    selected = [t for t in tools if not args.only or t["slug"] in args.only]

    ok = failed = 0
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    for i, tool in enumerate(selected):
        url = tool.get("official_pricing_url", "")
        try:
            if not url:
                raise ParseError("official_pricing_url is empty")
            price = check_tool(tool, args.max_change)
        except Exception as exc:  # noqa: BLE001 - one bad tool must never stop the run
            failed += 1
            reason = f"{type(exc).__name__}: {exc}"
            tool["status"] = "needs_manual_review"
            tool["last_checked"] = now
            log.error("FAILED %s -> %s | %s", tool["slug"], url, reason)
            if not args.dry_run:
                log_failed_url(tool, reason)
                send_alert(
                    f"⚠️ Usaasly price check FAILED\n"
                    f"Tool: {tool['name']} ({tool['slug']})\n"
                    f"URL: {url}\n"
                    f"Reason: {reason}\n"
                    f"Status set to needs_manual_review."
                )
        else:
            ok += 1
            changed = tool.get("current_price") != price
            log.info("OK %s: %s%s", tool["slug"], price, " (changed)" if changed else "")
            tool["current_price"] = price
            tool["status"] = "active"
            tool["last_checked"] = now
        if i < len(selected) - 1:
            time.sleep(args.delay)

    log.info("Done: %d ok, %d failed", ok, failed)
    if args.dry_run:
        log.info("Dry run: pseo-tools.json not modified.")
    else:
        save_tools(tools)
        log.info("Saved %s", ROOT / "src/data/pseo-tools.json")

    return 1 if (args.strict and failed) else 0


if __name__ == "__main__":
    sys.exit(main())

