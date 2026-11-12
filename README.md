# Usaasly — zero-cost programmatic SEO

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
│   ├── data/tools.json             master catalog: 50 SaaS & AI tools (directory, compare, stack builder)
│   ├── data/pseo-tools.json        programmatic-SEO database (prices, generated reviews/comparisons)
│   ├── lib/{tools,seo}.ts          typed loader, pair generation, JSON-LD helpers
│   ├── layouts/Layout.astro        header + Free-Only toggle, meta tags, canonical, OG, JSON-LD @graph
│   ├── layouts/BaseLayout.astro    thin wrapper used by the pSEO pages
│   ├── components/StatusNotice.astro
│   └── pages/{index,compare,stack-builder,tool/[slug],review/[slug],compare/[slug]}.astro
│   ├── scripts/                    vanilla TS (bundled by Astro): search, quiz, dock, compare, stack
│   └── lib/catalog.ts              typed loader for the 50-tool catalog
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

1. Add a pSEO tool to `src/data/pseo-tools.json` (set `price_selector` or `price_regex` so the scraper can read the price).
2. `python3 scripts/generate_content.py --dry-run` then run it without `--dry-run`.
3. `python3 scripts/update_prices.py --dry-run` to test selectors.
4. `npm run build` → `dist/`.

Pages without generated content are emitted with `noindex` and excluded from the sitemap, so thin pages never get indexed.
Comparison URLs are `/compare/<a>-vs-<b>/` with slugs in alphabetical order (one canonical URL per pair); the content lives on `tools[a].comparisons[b]`.

## `pseo-tools.json` fields

`name, slug, category, website, current_price, currency, price_unit, plan_features, official_pricing_url, status`
(`active` | `needs_manual_review`) plus `price_selector`, `price_regex`, `last_checked`, `content`, `comparisons`.

New tools start as `needs_manual_review`; they become `active` after the first successful scrape.

## Deploy (Cloudflare Pages, free)

- Connect the GitHub repo. Build command: `npm run build`; output dir: `dist`; env `NODE_VERSION=22`.
- The weekly commit from the Action triggers a rebuild through the Git integration. Optionally add a Deploy Hook URL as the `CLOUDFLARE_DEPLOY_HOOK_URL` secret.

## GitHub secrets

`DISCORD_WEBHOOK_URL` and/or `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, optionally `CLOUDFLARE_DEPLOY_HOOK_URL`.
(`OPENROUTER_API_KEY` is only needed locally — content generation is a manual step.)


## Directory (50-tool catalog)

`src/data/tools.json` holds exactly 50 tools with: `id, name, slug, logo, category, best_for_usecase, starting_price, price_per_user, hidden_limits, has_free_tier, is_open_source, rating, ai_model, pros, cons, website_url`.
Each tool gets a page at `/tool/<slug>/`. Other pages: `/` (search, ⌘K, quiz, category pills, compare dock), `/compare/` (up to 6 tools + team-size cost calculator, shareable via `?tools=a,b&team=10`), `/stack-builder/`.

The header toggle "Show Open-Source / Free Only" sets `<html data-free-only>`; CSS hides every element with `data-free="false"` (`is_open_source` is false and `starting_price` > 0). All interactivity is vanilla TypeScript with no framework.

`scripts/build-catalog.mjs <dir>` can regenerate `tools.json` and the monogram logos in `public/logos/` from JSON-Lines part files (validates the schema and the 50-tool count).

Note: prices and limits are editorial snapshots and should be re-verified against vendor pricing pages before launch.
