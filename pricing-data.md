# Pricing data (single source of truth for the page rewrites)

- Date checked: 2026-11-16
- Method: each vendor's official pricing page was opened in Chrome and the monthly/annual toggle was clicked where one exists. Prices are USD, before tax.
- Region check: the first pass ran from Pakistan. On 2026-11-16 every price below was re-read through a US connection (the debug Chrome showed IP location Ashburn, Virginia, US). Result: Semrush, HubSpot, Asana, Trello, Salesforce, Figma, Canva and monday.com were identical to the first pass. **Pipedrive was different**: the Pakistan view showed discounted regional prices (annual 14/24/49/69, monthly 19/34/64/89). The US view, used below, is annual 14/39/59/79 and monthly 24/49/79/99. This matches the 13 Nov manual check already in tools.json.
- Rule used: if a number was not on the page, it is written as "unverified" or "custom pricing, not public". Nothing here is estimated.
- "annual" = price per month when billed annually. "monthly" = price when billed month to month.

## Summary table

| Tool | Cheapest paid plan (annual / monthly) | Top public plan (annual / monthly) | Free plan |
|---|---|---|---|
| Semrush | SEO $117.33 / $139 | Pro+ $248.17 / $299 (Advanced is custom) | Yes (very limited) |
| HubSpot | Starter $20 per seat regular (promo from $7 for new customers) | Sales Hub Enterprise $150 per seat (Professional $90 to $100) | Yes (2 users) |
| Asana | Starter $10.99 / $13.49 per user | Advanced $24.99 / $30.49 per user | Yes (Personal, 2 users) |
| Trello | Standard $5 / $6 per user | Enterprise $17.50 per user (annual only) | Yes (10 collaborators) |
| Salesforce | Starter Suite $25 per user (monthly or annual) | Max $550 per user (annual) | Yes (Free Suite) |
| Figma | Pro Full seat $16 / $20 | Enterprise Full seat $90 (annual) | Yes (Starter) |
| Canva | Pro $12 / $18 (per person) | Business $20.83 / $25 (per person) | Yes |
| Pipedrive | Lite $14 / $24 per seat | Ultimate $79 / $99 per seat | No (14-day trial) |
| monday.com | Basic $9 / $12 per seat (10 seats) | Pro $19 / $24 per seat (10 seats) | Yes (2 seats) |
| Cursor | Plus $8 per month | Ultra $200 per month; Teams $30+ per user | Yes (limited) |

---

## 1. Semrush

- Official URL: https://www.semrush.com/pricing/seo-ai-search/ (https://www.semrush.com/prices/ redirects here)
- Checked: 2026-11-16. Toggle: Monthly / Annually (annual shown as "save up to 17%").

| Plan | Annual (per month) | Monthly | Key limits |
|---|---|---|---|
| Free | $0 | $0 | 1 demo project, 10 reports per day, no credit card |
| SEO | $117.33 | $139 | 5 websites, 500 keywords tracked daily, Position Tracking, Site Audit |
| Starter (SEO + AI Search) | $165.17 | $199 | 5 websites, 500 keywords, 50 AI prompts tracked daily, 1 domain for AI brand performance, 300 AI visibility reports per day, MCP access |
| Pro+ (SEO + AI Search) | $248.17 | $299 | 15 websites, 1,500 keywords, 100 AI prompts daily, historical data, content optimization, multi-location tracking |
| Advanced | custom pricing, not public | custom pricing, not public | 40+ websites, 5,000+ keywords, unlimited prompts, share of voice, API, team users |
| Enterprise | custom pricing, not public | custom pricing, not public | custom limits |

- Extra users: Additional Users add-on, "starting at $45/mo".
- Other add-ons: Lead Generation $90/mo, Base Report $10/mo, Pro Report $20/mo.
- Trial: "Try Semrush free for seven days. Cancel anytime." (page FAQ). Cancel, downgrade or upgrade at any time unless you have custom terms with a signed agreement.
- Current site value to fix: tools.json says starting price $139.95. The page shows $139 monthly.
- Also needed: `pricing_url`, `last_verified`, plans in tools.json, and the slug must be added to `INDEXED_TOOL_SLUGS` (currently noindex).

## 2. HubSpot (Smart CRM / Customer Platform)

- Official URL: https://www.hubspot.com/pricing/crm
- Checked: 2026-11-16. Currency selector showed "USD ($)".

| Plan | Price | Notes |
|---|---|---|
| Free tools | $0/mo | Free for up to 2 users, no credit card |
| Starter (Customer Platform) | Regular: $20/mo per seat. Promotional "starts at $7/mo per seat" for new customers (page banner: "save up to 65% on Starter", limited time). With the "Pay Monthly" option the promo showed $10/mo per seat. | Includes 1,000 marketing contacts and 500 HubSpot Credits. Billing options on page: Pay Monthly, Commit monthly, Pay Annually |
| Sales Hub Professional (https://www.hubspot.com/pricing/sales) | "Starts at" $90/mo per seat with Pay Annually; $100/mo per seat on the other billing options (Pay Monthly, Commit annually) | Includes 3,000 HubSpot Credits. Required one-time Professional Onboarding fee: $1,500 |
| Sales Hub Enterprise | "Starts at" $150/mo per seat, Talk to Sales | Includes 5,000 HubSpot Credits. Required one-time Enterprise Onboarding fee: $3,500 |

- Sales Hub page also shows a banner for new customers only: Professional $57 per seat (was $95) and Enterprise $98 per seat (was $140) when billed annually. These banner "was" prices do not match the $90/$100/$150 list prices on the same page, so use the list prices ($90/$100 and $150) and treat the banner as a limited promo.
- Marketing Hub, Service Hub and the other hubs have their own pages and prices; not recorded here (not needed for the CRM page).
- Extra users: Starter is per seat (each seat $20/mo regular). The FAQ answer on how many users Starter allows and what extra users cost was collapsed and could not be read: unverified.
- Free vs Starter limits visible on the page: Free marketing email is 2,000 sends per calendar month with HubSpot branding; Starter removes HubSpot branding on email and live chat.
- Trial: unverified.
- Promo prices are for new customers only and time-limited. Pages must show the regular $20 as the headline and the promo as a footnote.
- Need to check later (per-hub pages) before any page claims Professional or Enterprise prices.

## 3. Asana

- Official URL: https://asana.com/pricing
- Checked: 2026-11-16. Toggle: Monthly / Yearly ("save up to 18%").

| Plan | Annual (per user, per month) | Monthly (per user) | Key limits / features |
|---|---|---|---|
| Personal | $0 | $0 | 2 users, unlimited tasks and projects, list/board/calendar views, unlimited storage with 100 MB max per file |
| Starter | $10.99 | $13.49 | No seat limits, timeline and Gantt, dashboards, unlimited automations, forms, custom fields, unlimited free guests. AI: 5 requests per user per month (up to 50 per account), AI Studio 50K credits per billing account per month |
| Advanced | $24.99 | $30.49 | Everything in Starter plus portfolios, goals, resource management, approvals and proofing, time tracking. AI Studio 75K credits per account per month, AI Meetings |
| Enterprise | custom pricing, not public ("Contact sales for pricing") | custom pricing, not public | Everything in Advanced plus SAML authentication; AI Studio 200K credits per billing account per month; AI Teammates up to 250 requests per account |
| Enterprise+ | custom pricing, not public | custom pricing, not public | Adds SIEM integration, data residency, audit logs and dedicated workspaces |

- Extra users: per user pricing, no seat limit on Starter.
- Cancel: you can cancel any time and keep paid features until the end of the current period (page FAQ).
- Trial: the page FAQ mentions a free trial of Asana, but no length is given: unverified.
- Prepaid AI requests are sold separately: $0.50 per AI request billed upfront, or $0.60 per request billed monthly (pay as you go).

## 4. Trello (Atlassian)

- Official URL: https://trello.com/pricing
- Checked: 2026-11-16. The page prints both annual and monthly prices.

| Plan | Annual (per user, per month) | Monthly (per user) | Key limits |
|---|---|---|---|
| Free | $0 | $0 | Up to 10 collaborators per Workspace, up to 10 boards per Workspace, unlimited cards, 10 MB per file, 250 Workspace command runs per month |
| Standard | $5 | $6 | Unlimited boards, 250 MB per file, 1,000 command runs per month, custom fields, card mirroring, advanced checklists, AI features, single-board guests |
| Premium | $10 | $12.50 | Views (Calendar, Timeline, Table, Dashboard, Map), unlimited command runs, admin and security features, workspace-level templates, simple data export |
| Enterprise | $17.50 (billed annually, $210 per user per year) | not shown | Unlimited Workspaces, organization-wide permissions, SSO and provisioning with Atlassian Guard. "Est. cost for users: Contact sales" |

- Extra users: per user, same rate as the plan.
- Trial: the FAQ says any Workspace can enrol in a free trial of Trello Premium (unlimited boards, automation, Timeline and Dashboard views). Trial length: unverified (not stated).

## 5. Salesforce (Sales Cloud suites)

- Official URL: https://www.salesforce.com/sales/pricing/
- Checked: 2026-11-16. Currency selector set to US Dollar (USD). Page notes the information is subject to change and that AI can be added to Core and above.

| Plan | Price (per user, per month) | Billing | Notes |
|---|---|---|---|
| Free Suite | $0 | n/a | listed in the comparison table |
| Starter Suite | $25 | monthly or annually | lead, account, contact and opportunity management, built-in sales flows, email marketing |
| Pro Suite | $100 | annually | quoting and forecasting, AgentExchange access, Premier Support (add-on) |
| Core | $195 | annually | everything in Professional Edition plus Premier Success, Slack Business+, Tableau Next |
| Advanced | $395 | annually | enhanced security, Sales Programs, backup and recover |
| Max | $550 | annually | Agentforce for Sales and Agentforce Coworker, 2.75M Flex Credits per org per year. Button says "Contact us" |

- Extra users: per user. Add-ons: Agentforce for Sales "from $125 USD/user/month"; Premier Success Plan is a paid add-on on lower tiers.
- Trial: "Try Sales Cloud free for 30 days. No credit card, no installations." (page text).
- Monthly prices for Pro and above: not offered on this page (annual billing only).

## 6. Figma

- Official URL: https://www.figma.com/pricing/
- Checked: 2026-11-16. Page header says "Prices in USD". Toggle: Monthly / Annual (applies to Professional; Organization and Enterprise say "Billed annually").

| Plan | Seat | Annual (per month) | Monthly |
|---|---|---|---|
| Starter | n/a | Free | Free |
| Professional | Full seat | $16 | $20 |
| Professional | Dev seat | $12 | $15 |
| Professional | Collab seat | $3 | $5 |
| Organization | Full seat | $55 | not offered (annual only) |
| Organization | Dev seat | $25 | not offered |
| Organization | Collab seat | $5 | not offered |
| Enterprise | Full seat | $90 | not offered |
| Enterprise | Dev seat | $35 | not offered |
| Enterprise | Collab seat | $5 | not offered |

- Key limits: Starter has unlimited drafts and 150 AI credits per day, up to 500 AI credits per month. Professional adds unlimited files and projects, team libraries, advanced prototyping, Dev Mode. Full seat AI credits per month: Professional 3,000, Organization 3,500, Enterprise 4,250. Dev and Collab seats get 500 per month.
- Extra users: priced per seat type (see table). Viewers can comment without a paid seat.
- Add-ons: AI credits (extra purchase), Governance+ (Enterprise only, contact sales).
- Trial: no free trial is mentioned on the pricing page (Starter is the free plan): unverified. Professional plan can be downgraded or cancelled from the Admin Dashboard; Organization and Enterprise must contact Sales to downgrade or cancel.

## 7. Canva

- Official URL: https://www.canva.com/pricing/ (US view used: https://www.canva.com/pricing/?countryCode=us)
- Checked: 2026-11-16. Toggle: Monthly / Yearly ("save from 16%"). Prices exclude tax.

| Plan | Monthly | Yearly (total per year, per month) | Notes |
|---|---|---|---|
| Free | $0 | $0 | 1.6M+ templates, 4.7M+ elements, 1 Brand Kit (max 3 colors), limited AI |
| Pro (one person) | $18 | $144 per year ($12 per month) | 5 Brand Kits, 3.6M+ templates, 141M+ elements, 10x more AI than Free, social scheduling |
| Business (per person) | $25 | $250 per year ($20.83 per month) | 100 Brand Kits, approvals, 20x more AI than Free, team admin tools |
| Enterprise | custom pricing, not public | custom pricing, not public | 1000 Brand Kits, SSO and SCIM |

- Extra users: Business is per person. Pro is for one person.
- Add-ons: AI Pass (add-on to Pro or Business), extra cost. Price: unverified.
- Trial: the FAQ confirms a free trial of Canva Pro or Canva Business ("Start a free trial" button). Trial length: unverified (not stated).
- The current site stores only one plan for Canva; Pro and Business both need to be added.

## 8. Pipedrive

- Official URL: https://www.pipedrive.com/en/pricing
- Checked: 2026-11-16 from a US connection. Toggle: Billed monthly / Billed annually ("save up to 42%"). Prices are USD per seat per month. (The same page viewed from Pakistan showed lower regional prices and "save up to 26%"; those are not used.)

| Plan | Annual (per seat, per month) | Annual total per seat | Monthly (per seat) |
|---|---|---|---|
| Lite | $14 | $168 per year | $24 |
| Growth | $39 | $468 per year | $49 |
| Premium | $59 | $708 per year | $79 |
| Ultimate | $79 | $948 per year | $99 |

- Key features by tier: Lite has lead, calendar and pipeline management, AI report creation, meeting intelligence. Growth adds full email sync with tracking, automations and nurturing sequences, subscription and forecast reports. Premium adds lead generation and routing, custom scoring, contracts and e-signatures. Ultimate adds fortified account security with rules and alerts, phone and email data enrichment, a sandbox testing account, extended phone support, and partnership discounts (20% on PandaDoc and CloudTalk, 15% on Surfe).
- Free plan: none listed. Trial: free 14-day trial, no credit card required.
- Extra users: per seat.

## 9. monday.com (work management)

- Official URL: https://monday.com/pricing
- Checked: 2026-11-16. Toggle: Yearly (save 18%) / Monthly. Prices shown for "10 seats" selected; the page says price depends on billing country and seat count and excludes tax.

| Plan | Yearly (per seat, per month) | Monthly (per seat) | Key limits |
|---|---|---|---|
| Free | $0 | $0 | Up to 2 seats, up to 3 boards, up to 3 Docs, 200+ templates |
| Basic | $9 | $12 | Unlimited free viewers, unlimited items, 1,000 AI credits per month |
| Standard | $12 (promo; strikethrough $14, "$20 off per month" at 10 seats) | $14 | 3 workflows, 250 automation actions and 250 integration actions per month, timeline and Gantt, calendar view, guest access, 1,000 API calls per day, 2,000 AI credits per month |
| Pro | $19 (promo; strikethrough $22, "$30 off per month" at 10 seats) | $24 | 20 workflows, 25,000 automation actions and 25,000 integration actions per month, private boards and docs, time tracking, 10,000 API calls per day, 3,000 AI credits per month |
| Enterprise | custom pricing, not public | custom pricing, not public | 250 workflows, enterprise security, portfolio and resource management |

- Extra users: per seat. Seat-tier pricing (the number shown depends on seat count chosen); only the 10-seat view was recorded.
- Trial: 14-day free trial of the Pro plan (page FAQ). Free plan is for freelancers and individuals. If you paid for a yearly subscription in the last 30 days and cancel, you get a partial refund (remaining balance).
- monday CRM is a separate product with its own prices; not recorded here.

## 10. Cursor

- Official URL: https://cursor.com/pricing
- Checked: 2026-11-16. The page has Individual / Teams tabs. No monthly/annual toggle was visible, so annual pricing: unverified.
- Flag for review: the page text mixes Cursor features with Grok features (Grok Chat, Voice, Imagine, Build, Grok API, Grok Bot) and the Free and Plus cards list social-style features ("Post, reply, and follow", "Premium checkmark"). This looks like a combined subscription. The plan structure differs from what tools.json describes. A human should look at this page before the Cursor article makes any claim beyond the numbers below.

| Plan | Price per month | Usage |
|---|---|---|
| Free | $0 | Limited |
| Plus | $8 | Basic (the "introductory plan") |
| Premium | $30 | 4x Plus |
| Super | $100 | 15x Plus |
| Ultra | $200 | 50x Plus |
| Teams | $30+ per user | 4-50x Plus |
| Enterprise | custom pricing, not public | Pooled |

- Third-party model usage in Cursor is not included in the monthly price and is billed separately by usage.
- Teams features: centralized billing, usage analytics, team-wide privacy settings, SAML/OIDC SSO. Enterprise adds invoice/PO billing, SCIM and audit logs.
- Trial: unverified. Cancel anytime, at least 24 hours before renewal (from the page footer).

---

## Items still unverified (please read)

Second pass on 2026-11-16 closed these: Semrush 7-day trial, Salesforce 30-day trial, monday.com 14-day Pro trial, Asana Enterprise (contact sales), HubSpot Sales Hub Professional/Enterprise, Pipedrive Ultimate features. What is still open:

1. HubSpot: how many users Starter includes and what extra users cost (FAQ answer collapsed); trial terms; Marketing/Service Hub prices (not needed for the CRM page).
2. Trello and Canva: a free trial exists but the length is not stated, so pages must say "free trial available" without a number.
3. Figma: no trial mentioned; Organization and Enterprise are annual only.
4. Canva: AI Pass price.
5. monday.com: prices at seat counts other than 10; monday CRM is a separate product.
6. Cursor: annual pricing not shown; trial terms not shown; the Grok bundling needs a human look (see section 10).
7. Asana: Enterprise and Enterprise+ prices are not public (contact sales).
8. Region: re-checked from a US connection on 2026-11-16 (see the Region check note at the top); Pipedrive was corrected, the rest matched.
