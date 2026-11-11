# Usassly — zero-cost programmatic SEO

Astro (static) + Tailwind v4 + local JSON "database" + Python automation.

## Layout

```
usaasly/
├── .github/workflows/cron.yml      weekly price check → commit → Cloudflare rebuild
├── public/                         robots.txt, favicon
├── scripts/
│   ├── common.py                   shared JSON/env helpers (atomic writes)
│   ├── update_prices.py            scraper + needs_manual_review + Discord/Telegram alerts
│   └── generate_content.py         OpenRouter (Claude 3.5 Sonnet) content generator
├── src/
│   ├── data/tools.json             the database
│   ├── lib/{tools,seo}.ts          typed loader, pair generation, JSON-LD helpers
│   ├── layouts/BaseLayout.astro    meta tags, canonical, OG, JSON-LD @graph
│   ├── components/StatusNotice.astro
│   └── pages/{index,review/[slug],compare/[slug]}.astro
├── astro.config.mjs  tsconfig.json  package.json  requirements.txt  .env.example
```

## Setup

```bash
npm install
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill in keys
npm run dev              # http://localhost:4321
```

## Workflow

1. Add a tool to `src/data/tools.json` (set `price_selector` or `price_regex` so the scraper can read the price).
2. `python3 scripts/generate_content.py --dry-run` then run it without `--dry-run`.
3. `python3 scripts/update_prices.py --dry-run` to test selectors.
4. `npm run build` → `dist/`.

Pages without generated content are emitted with `noindex` and excluded from the sitemap, so thin pages never get indexed.
Comparison URLs are `/compare/<a>-vs-<b>/` with slugs in alphabetical order (one canonical URL per pair); the content lives on `tools[a].comparisons[b]`.

## `tools.json` fields

`name, slug, category, website, current_price, currency, price_unit, plan_features, official_pricing_url, status`
(`active` | `needs_manual_review`) plus `price_selector`, `price_regex`, `last_checked`, `content`, `comparisons`.

New tools start as `needs_manual_review`; they become `active` after the first successful scrape.

## Deploy (Cloudflare Pages, free)

- Connect the GitHub repo. Build command: `npm run build`; output dir: `dist`; env `NODE_VERSION=22`.
- The weekly commit from the Action triggers a rebuild through the Git integration. Optionally add a Deploy Hook URL as the `CLOUDFLARE_DEPLOY_HOOK_URL` secret.

## GitHub secrets

`DISCORD_WEBHOOK_URL` and/or `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, optionally `CLOUDFLARE_DEPLOY_HOOK_URL`.
(`OPENROUTER_API_KEY` is only needed locally — content generation is a manual step.)
