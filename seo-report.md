# SEO overhaul report (branch `seo-overhaul`)

- Date: 2026-11-16
- Branch: `seo-overhaul`, local only. Nothing was pushed, merged into `main` or deployed.
- Commits on the branch (oldest first): `c44b514`, `4f92491`, `f19407d`, `1d7a040`, `65aff28`, `a0e2ff2`, plus the commit that adds this report.
- Git author on these commits is a repo-local placeholder: `Abdullah <Abdullah627-byte@users.noreply.github.com>`. Change it with `git config user.name/user.email` and amend if you want your real identity.
- Supporting files: `seo-baseline.md` (Search Console "before" snapshot), `pricing-data.md` (every price, URL and check date; the single source of truth).

## 1. Starting point (seo-baseline.md)

Search Console, last 28 days (data only covered 11 to 14 Nov 2026): 0 clicks, 892 impressions, average position 73.7, 292 queries, 54 pages. Almost all demand is "<tool> pricing / cost / price". The top page, /tool/semrush/, was set to noindex by the site itself.

## 2. Pricing verification

- All prices were read on the vendors' own pricing pages with the monthly/annual toggle clicked. USD, before tax.
- The first pass ran from Pakistan. Everything was then re-read from a US IP. One vendor differed: **Pipedrive** showed lower regional prices outside the US. The US prices (annual 14/39/59/79, monthly 24/49/79/99) are used. All other first-pass numbers matched the US view.
- Five SEO tools were added later (Ahrefs, Moz and SE Ranking from a US IP; Ubersuggest and Mangools through a Tokyo VPN, Ubersuggest labelled US$, Mangools only "$").
- Promotions (HubSpot's $7 Starter, monday.com's "special offer") are mentioned but never used as the headline price. "Contact sales" plans are written as "custom pricing, not public".

## 3. What changed per page

### Rewritten pricing pages (new template)

/tool/semrush/, /tool/hubspot/, /tool/asana/, /tool/trello/, /tool/salesforce/, /tool/figma/, /tool/canva/, /tool/pipedrive/, /tool/monday-com/

Each page now has:
- Title "<Tool> Pricing 2026: <cheapest> to <top> per month" (60 characters or less with the site name) and a unique meta description with real numbers (155 or less).
- One H1, and the first two lines answer the price question directly.
- Plans table (monthly, annual per month, key limits, best for).
- "What it really costs" table for 1, 3 and 10 users from verified prices only (HubSpot also shows first-year totals with the required onboarding fee). Where a team size cannot be priced from verified numbers, the cell says "Not verified".
- Hidden costs and limits, "Is it worth it / who should skip it" with free or cheaper options linked to our /alternatives/ and /compare/ pages.
- Six FAQs, "Last verified" date with the official pricing URL, a link to Methodology, and a "What we could not verify" list.
- Related tools, compare and alternatives links; breadcrumbs.
- JSON-LD: SoftwareApplication with one Offer per plan and billing option, FAQPage, BreadcrumbList (plus site-wide Organization and WebSite).
- Page-specific og:title/og:description and a per-tool 1200x630 og:image (`public/og/<slug>.png`, rendered once locally so the build needs no fonts).
- A marked placeholder for an affiliate disclosure line (comment in `PricingHero.astro` and `PricingSource.astro`; the site flag `AFFILIATE_LINKS` is still false).

Content lives in `src/data/pricing-pages.json`; plan numbers in `src/data/tools.json` (`plans`). Old claims that could not be verified were removed from `hidden_limits` (Asana "free up to 10 users", monday.com and Canva "3-seat minimum").

### Semrush specifically
- Indexed again (it was noindex), and listed in the sitemap.
- Starting price corrected from $139.95 to the real $139 monthly / $117.33 annual.
- "Cheaper options" now cites verified prices for Ubersuggest, Mangools and Moz Starter, with compare links to Ahrefs, Moz and SE Ranking.

### New tools (old tool template, verified prices)
Ahrefs, Moz, SE Ranking, Ubersuggest, Mangools were added to the Marketing category with plans, limits, URLs and dates, monogram logos, and indexed tool pages. Ratings are hidden site-wide, so they carry rating 0 (no score was invented). Where a vendor does not name its AI models, the "Which AI models" FAQ is hidden and compare text says the models are not listed.

Side effect: 25 new same-category compare pages (for example /compare/ahrefs-vs-semrush/), 109 compare pages in total. Each is linked from both tool pages. If you prefer, these can be set to noindex.

### Homepage
- "(unverified)" label removed for Semrush (now verified). The nine rewritten tools show their verified starting prices.
- Title shortened to "SaaS & AI Tool Pricing, Limits and Real Costs".
- Links to the retired /review/ pages removed.

## 4. Site-wide technical SEO

- `sitemap.xml`: only indexable URLs (112). `<lastmod>` comes from the real "last verified" dates; pages without a real date have no lastmod rather than an invented one.
- `robots.txt`: explicit `Allow: /` for Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot; everything else, including GPTBot and ClaudeBot (training), stays under the default `User-agent: * / Allow: /`. References the sitemap.
- `llms.txt`: generated at build from site data, lists verified pricing pages and the about/methodology pages.
- Canonical on every page (checked: 0 mismatches), unique titles and descriptions on indexable pages (0 duplicates), 1 H1 per page, no duplicate ids, no heading skips, no orphan pages.
- Organization JSON-LD now has a description and contact point; WebSite has a language.
- About and Methodology explain the US-region check, promotions, custom pricing and who runs the site.
- Core Web Vitals: no render-blocking JS (small module scripts), one 35 KB CSS file, SVG logos with width/height. Cheap wins applied: long cache headers for hashed assets, logos and OG images (`public/_headers`); default OG image 783 KB to 65 KB.
- Shorter titles/descriptions on compare, alternatives, compare index and stack builder pages. 4 titles are still slightly over 60 characters (three long-name alternatives pages and the Microsoft Copilot tool page); no description is over 158.

## 5. Thin pages and retired pages

- "Best X alternatives" pages are indexed only when X has at least 3 same-category rivals (`MIN_SAME_CATEGORY_RIVALS` in `src/config/site.ts`). Now noindex and out of the sitemap: Grammarly, Slack, Zapier. Exempt and indexed: Make (already had impressions) and Semrush (also qualifies on its own now, with 7 rivals).
- Categories with only 2 to 4 tools (no category pages exist; this affects alternatives/compare pages): Analytics 2, Customer Support 2, AI Writing 3, Communication 3, Automation 3, AI Creative 4, AI Coding 4, Design 4, Productivity & Docs 4.
- /review/notion/, /review/trello/, /review/asana/, /review/clickup/ now 301 to the matching /tool/ page (`public/_redirects`). As a fallback the built pages are noindex with a canonical to the tool page. They had no Search Console impressions.

## 6. Weekly cron

- `.github/workflows/cron.yml` runs `scripts/update_prices.py`, which writes only `src/data/pseo-tools.json`, and the job commits only that file. That file is now used only by the retired /review/ pages (always noindex, never in the sitemap or on the homepage). The verified pages read `tools.json` and `pricing-pages.json`, which the cron never touches. Nothing needed fixing.
- Guard added: `npm run check` (`scripts/check-seo.mjs`) fails if a /review/ URL returns to the sitemap or homepage, if a noindex page enters the sitemap, if a pricing page loses valid JSON-LD, if an indexable page has 0 or 2+ H1s, or if titles duplicate. It is not wired into the Cloudflare build command, so it cannot block a deploy unless you add it.
- Deleting the old code would mean removing `src/pages/review/[slug].astro`, `src/lib/tools.ts`, `src/components/StatusNotice.astro`, `src/data/pseo-tools.json`, `scripts/update_prices.py`, `scripts/generate_content.py`, `scripts/common.py`, `requirements.txt`, `.github/workflows/cron.yml`, the `prices`/`content` npm scripts, README sections, `.env.example` keys and the GitHub secrets (Discord, Telegram, OpenRouter, deploy hook). Keep `public/_redirects`. Side effect: the weekly cron commit currently triggers a weekly Cloudflare rebuild; that would stop. Not done.

## 7. Cloudflare (read-only check, 2026-11-16)

Read from Security > Settings > Bot traffic in the dashboard DOM. Nothing was changed; the policies dialog was closed without saving.

| Setting | State |
|---|---|
| AI Crawler and Agent access policies: Search (search-engine bots, includes Googlebot and Bingbot) | Allow (do not block) |
| Training crawlers (GPTBot, ClaudeBot and similar) | Allow (do not block) |
| Agents (bots acting for a person, such as ChatGPT-User, Claude-User) | Allow (do not block) |
| Personal agents listed: Claude Duet (Anthropic), dots (OpenAI), Gemini Spark (Google), Muse (Meta) | Allow (do not block) each |
| Bot Preference Sync (prepends robots.txt with these settings) | On |
| Bot Fight Mode | Off (switch aria-checked=false) |
| AI Labyrinth | Off (switch aria-checked=false) |

- The dashboard groups crawlers by category; it does not list OAI-SearchBot, Claude-SearchBot or PerplexityBot by name. Their categories (Search and Agents) are set to Allow, so no change was needed and none was made.
- Live https://usaasly.com/robots.txt is still the old two-line file, because the new one is only on this branch. Bot Preference Sync did not add anything visible to it at the time of the check.

## 8. Checks run

- `npm run build`: 232 pages, no errors.
- `npm run check`: passed (231 pages, 112 sitemap URLs).
- Validation script on the 9 rewritten pages: 1 H1 each, titles 58 to 60 characters, descriptions 139 to 151, JSON-LD parses with SoftwareApplication (5 to 13 offers), FAQPage (6 questions) and BreadcrumbList, 0 broken internal links.
- JSON-LD parses on the 5 new tool pages.
- Mobile check at 375 px on /tool/figma/: layout fits, wide tables scroll inside their own container. Other pages were not checked visually on mobile.

## 9. Still unverified

- HubSpot: users included in Starter and extra-seat price; trial terms; Marketing/Service Hub prices; extra HubSpot Credits price.
- Asana: trial length; Enterprise and Enterprise+ (contact sales).
- Trello and Canva: trial length. Canva: AI Pass price.
- Figma: trial (none mentioned); extra AI credits price.
- monday.com: prices at seat counts other than 10; non-promotional yearly Standard/Pro.
- Semrush: users per plan; whether "Additional Users from $45/mo" is per user.
- Moz: Starter yearly price, extra-seat price, trial length.
- SE Ranking: extra-seat price. Mangools: currency code (only "$"), extra-seat price, free-account limits.
- Cursor: not rewritten. Its pricing page mixed Cursor and Grok features and showed no annual prices; it keeps the old template and needs a human look.

## 10. Things only you can do

1. Review the branch and open a PR from `seo-overhaul` to `main` (Cloudflare Pages deploys `main` automatically).
2. After deploy, in Search Console: submit `https://usaasly.com/sitemap.xml` again and use URL Inspection on /tool/semrush/ (it was noindex before). Watch the 28-day report against `seo-baseline.md`.
3. Set up Bing Webmaster Tools (it can import from Search Console) and submit the sitemap there.
4. Decide on AI training crawlers (GPTBot, ClaudeBot). Currently allowed in both robots.txt and Cloudflare.
5. Check that HTTP redirects to HTTPS for all paths (Search Console showed impressions on http:// URLs). In Cloudflare: SSL/TLS > Edge Certificates > Always Use HTTPS.
6. Affiliate programmes: apply if you want; then set `AFFILIATE_LINKS = true` and fill the marked disclosure placeholders.
7. Re-check prices on a schedule (vendors change them often); update `pricing-data.md`, `tools.json` and `pricing-pages.json` together.
8. Optional: README still says the catalog has exactly 50 tools and `scripts/build-catalog.mjs` validates 50; the catalog now has 55.

## 11. Deploy steps (when you are ready)

```bash
git checkout seo-overhaul
npm ci
npm run build
npm run check
git push -u origin seo-overhaul
```

Then open a pull request `seo-overhaul` -> `main` on GitHub, review the Cloudflare Pages preview deployment for the branch, and merge. Cloudflare Pages builds `main` with `npm run build`, output `dist`, `NODE_VERSION=22`. Optionally change the build command to `npm run build && npm run check` so a broken sitemap blocks the deploy.
