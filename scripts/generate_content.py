#!/usr/bin/env python3
"""Populate src/data/pseo-tools.json with SEO content via OpenRouter (Claude 3.5 Sonnet).

* Review content  -> tool["content"]
* Comparison data -> tools[a]["comparisons"][b_slug]   (a/b alphabetical by slug)

Only missing entries are generated unless --force is given. pseo-tools.json is
saved after every successful call, so an interrupted run loses nothing.

The model is told to use ONLY the specs in pseo-tools.json and never invent prices,
which keeps pricing data owned by update_prices.py.

Usage:
    python3 scripts/generate_content.py [--only slug ...] [--reviews-only |
        --comparisons-only] [--force] [--max-calls N] [--dry-run]
"""
from __future__ import annotations

import argparse
import itertools
import json
import logging
import os
import re
import sys
import time
from typing import Any

import requests

from common import load_env, load_tools, save_tools

log = logging.getLogger("generate_content")

API_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "anthropic/claude-3.5-sonnet"

SYSTEM_PROMPT = (
    "You are a meticulous SaaS analyst writing for a pricing-comparison website. "
    "Use ONLY the product data supplied by the user for prices and plan features; "
    "never invent or alter prices, plan names, or numbers. For anything beyond the "
    "supplied data, make only widely-known, conservative statements and avoid "
    "specifics you are unsure about. Be concise, neutral and useful. "
    "Respond with a single valid JSON object and nothing else (no markdown fences)."
)

REVIEW_SCHEMA = """{
  "tagline": "string, <= 90 chars",
  "summary": "string, 2-3 sentences, <= 320 chars",
  "pros": ["3-5 short strings"],
  "cons": ["3-5 short strings"],
  "best_for": "string, one sentence",
  "verdict": "string, 2-3 sentences",
  "rating": number between 1 and 5 (one decimal),
  "faqs": [{"question": "string", "answer": "string"}]   // exactly 3
}"""

COMPARE_SCHEMA = """{
  "intro": "string, 1-2 sentences, <= 240 chars",
  "winner": "<slug of A>" | "<slug of B>" | "tie",
  "verdict": "string, 2-3 sentences explaining who should pick which",
  "rows": [{"category": "string", "a": "string", "b": "string", "winner": "a" | "b" | "tie"}],  // 5-7 rows: pricing, ease of use, features, integrations, collaboration, best for...
  "faqs": [{"question": "string", "answer": "string"}]   // exactly 3
}"""


# --------------------------------------------------------------------------- #
# OpenRouter
# --------------------------------------------------------------------------- #
def parse_json(text: str) -> dict[str, Any]:
    """Tolerate ```json fences or stray prose around the object."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.I)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("no JSON object in model output")
        data = json.loads(text[start : end + 1])
    if not isinstance(data, dict):
        raise ValueError("model output is not a JSON object")
    return data


def call_openrouter(prompt: str, api_key: str, model: str, retries: int = 3) -> dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://usassly.com",
        "X-Title": "Usassly pSEO",
    }
    body = {
        "model": model,
        "temperature": 0.4,
        "max_tokens": 2000,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    }
    last: Exception | None = None
    for attempt in range(retries):
        try:
            resp = requests.post(API_URL, headers=headers, json=body, timeout=90)
            if resp.status_code in (429, 500, 502, 503, 504):
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
            if resp.status_code >= 400:
                # 400/401/402/404 will not fix themselves; fail fast.
                raise SystemExit(f"OpenRouter error HTTP {resp.status_code}: {resp.text[:300]}")
            text = resp.json()["choices"][0]["message"]["content"]
            return parse_json(text)
        except SystemExit:
            raise
        except (requests.RequestException, RuntimeError, KeyError, IndexError, ValueError) as exc:
            last = exc
            if attempt == retries - 1:
                break
            wait = 3 * 2**attempt
            log.warning("attempt %d/%d failed (%s); retrying in %ds", attempt + 1, retries, exc, wait)
            time.sleep(wait)
    raise RuntimeError(f"OpenRouter call failed after {retries} attempts: {last}")


# --------------------------------------------------------------------------- #
# Validation / normalisation
# --------------------------------------------------------------------------- #
def _str(v: Any, field: str) -> str:
    if not isinstance(v, str) or not v.strip():
        raise ValueError(f"{field} must be a non-empty string")
    return v.strip()


def _str_list(v: Any, field: str, lo: int, hi: int) -> list[str]:
    if not isinstance(v, list) or not all(isinstance(x, str) and x.strip() for x in v):
        raise ValueError(f"{field} must be a list of non-empty strings")
    if len(v) < lo:
        raise ValueError(f"{field} needs at least {lo} items")
    return [x.strip() for x in v[:hi]]


def _faqs(v: Any) -> list[dict[str, str]]:
    if not isinstance(v, list) or not v:
        raise ValueError("faqs must be a non-empty list")
    out = []
    for item in v[:5]:
        if not isinstance(item, dict):
            raise ValueError("faq item must be an object")
        out.append({"question": _str(item.get("question"), "faq.question"),
                    "answer": _str(item.get("answer"), "faq.answer")})
    return out


def validate_review(d: dict[str, Any]) -> dict[str, Any]:
    try:
        rating = round(min(5.0, max(1.0, float(d.get("rating")))), 1)
    except (TypeError, ValueError):
        raise ValueError("rating must be a number")
    return {
        "tagline": _str(d.get("tagline"), "tagline"),
        "summary": _str(d.get("summary"), "summary"),
        "pros": _str_list(d.get("pros"), "pros", 2, 6),
        "cons": _str_list(d.get("cons"), "cons", 2, 6),
        "best_for": _str(d.get("best_for"), "best_for"),
        "verdict": _str(d.get("verdict"), "verdict"),
        "rating": rating,
        "faqs": _faqs(d.get("faqs")),
    }


def validate_comparison(d: dict[str, Any], slug_a: str, slug_b: str) -> dict[str, Any]:
    winner = _str(d.get("winner"), "winner")
    if winner not in (slug_a, slug_b, "tie"):
        raise ValueError(f"winner must be {slug_a!r}, {slug_b!r} or 'tie', got {winner!r}")
    rows_raw = d.get("rows")
    if not isinstance(rows_raw, list) or len(rows_raw) < 3:
        raise ValueError("rows must contain at least 3 entries")
    rows = []
    for r in rows_raw[:8]:
        if not isinstance(r, dict):
            raise ValueError("row must be an object")
        w = r.get("winner")
        rows.append({
            "category": _str(r.get("category"), "row.category"),
            "a": _str(r.get("a"), "row.a"),
            "b": _str(r.get("b"), "row.b"),
            "winner": w if w in ("a", "b", "tie") else "tie",
        })
    return {
        "intro": _str(d.get("intro"), "intro"),
        "winner": winner,
        "verdict": _str(d.get("verdict"), "verdict"),
        "rows": rows,
        "faqs": _faqs(d.get("faqs")),
    }



# --------------------------------------------------------------------------- #
# Prompts
# --------------------------------------------------------------------------- #
def spec(tool: dict[str, Any]) -> dict[str, Any]:
    keys = ("name", "slug", "category", "current_price", "currency", "price_unit", "plan_features")
    return {k: tool.get(k) for k in keys}


def review_prompt(tool: dict[str, Any]) -> str:
    return (f"Write a review for this SaaS product.\n\nProduct data:\n{json.dumps(spec(tool), indent=2)}\n\n"
            f"Return JSON matching this shape:\n{REVIEW_SCHEMA}")


def compare_prompt(a: dict[str, Any], b: dict[str, Any]) -> str:
    return (f"Compare these two SaaS products. In the output, \"a\" is {a['name']} and \"b\" is {b['name']}.\n\n"
            f"Product A:\n{json.dumps(spec(a), indent=2)}\n\nProduct B:\n{json.dumps(spec(b), indent=2)}\n\n"
            f"Slug of A is \"{a['slug']}\", slug of B is \"{b['slug']}\".\n"
            f"Return JSON matching this shape:\n{COMPARE_SCHEMA}")


# --------------------------------------------------------------------------- #
def build_jobs(tools: list[dict[str, Any]], args: argparse.Namespace) -> list[tuple[str, Any]]:
    def wanted(*slugs: str) -> bool:
        return not args.only or any(s in args.only for s in slugs)

    jobs: list[tuple[str, Any]] = []
    if not args.comparisons_only:
        for t in tools:
            if wanted(t["slug"]) and (args.force or not t.get("content")):
                jobs.append(("review", t))
    if not args.reviews_only:
        for a, b in itertools.combinations(sorted(tools, key=lambda t: t["slug"]), 2):
            have = a.get("comparisons") or {}
            if wanted(a["slug"], b["slug"]) and (args.force or b["slug"] not in have):
                jobs.append(("compare", (a, b)))
    return jobs


def job_label(kind: str, item: Any) -> str:
    return item["slug"] if kind == "review" else f"{item[0]['slug']}-vs-{item[1]['slug']}"


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--only", nargs="*", help="only tools/pairs involving these slugs")
    g = p.add_mutually_exclusive_group()
    g.add_argument("--reviews-only", action="store_true")
    g.add_argument("--comparisons-only", action="store_true")
    p.add_argument("--force", action="store_true", help="regenerate existing content")
    p.add_argument("--max-calls", type=int, default=50, help="cap API calls per run (cost guard)")
    p.add_argument("--dry-run", action="store_true", help="list what would be generated; no API calls")
    args = p.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    load_env()
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    model = os.environ.get("OPENROUTER_MODEL", "").strip() or DEFAULT_MODEL
    if not api_key and not args.dry_run:
        log.error("OPENROUTER_API_KEY is not set (see .env.example).")
        return 2

    tools = load_tools()
    if args.only:
        unknown = set(args.only) - {t["slug"] for t in tools}
        if unknown:
            log.error("Unknown slug(s): %s", ", ".join(sorted(unknown)))
            return 2

    jobs = build_jobs(tools, args)
    log.info("%d job(s) pending (model: %s)", len(jobs), model)
    if args.dry_run:
        for kind, item in jobs:
            log.info("would generate %s: %s", kind, job_label(kind, item))
        return 0

    done = failed = 0
    for kind, item in jobs[: args.max_calls]:
        label = job_label(kind, item)
        try:
            log.info("%s: %s", kind, label)
            if kind == "review":
                item["content"] = validate_review(call_openrouter(review_prompt(item), api_key, model))
            else:
                a, b = item
                data = call_openrouter(compare_prompt(a, b), api_key, model)
                a.setdefault("comparisons", {})[b["slug"]] = validate_comparison(data, a["slug"], b["slug"])
            save_tools(tools)
            done += 1
        except (ValueError, RuntimeError) as exc:
            failed += 1
            log.error("skipped %s: %s", label, exc)

    deferred = max(0, len(jobs) - args.max_calls)
    log.info("Done: %d generated, %d failed, %d deferred (max-calls=%d)", done, failed, deferred, args.max_calls)
    return 1 if failed and not done else 0


if __name__ == "__main__":
    sys.exit(main())

