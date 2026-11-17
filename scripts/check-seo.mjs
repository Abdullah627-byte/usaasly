#!/usr/bin/env node
/**
 * Post-build SEO guard. Run after `npm run build`:  npm run check
 *
 * Fails (exit 1) if any of these break:
 *  - a URL in dist/sitemap.xml is missing or is noindex
 *  - the sitemap or the homepage mentions a retired /review/ URL
 *  - a /review/ page is indexable or does not point its canonical at /tool/<slug>/
 *  - a /tool/ page has a JSON-LD block that does not parse, or a verified pricing page lacks
 *    SoftwareApplication (with offers), FAQPage or BreadcrumbList
 *  - an indexable page has more or fewer than one <h1>, or two indexable pages share a title
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const pricingPages = JSON.parse(fs.readFileSync('src/data/pricing-pages.json', 'utf8'));
const problems = [];
const fail = (m) => problems.push(m);

const pages = {};
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name === 'index.html') {
      const rel = path.relative(dist, d).replace(/\\/g, '/');
      pages['/' + rel + (rel ? '/' : '')] = fs.readFileSync(p, 'utf8');
    }
  }
})(dist);

const robots = (h) => h.match(/name="robots" content="([^"]+)"/)?.[1] ?? '';
const isNoindex = (h) => /noindex/.test(robots(h));

// Sitemap
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>https:\/\/usaasly\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
for (const u of locs) {
  if (!pages[u]) fail(`sitemap lists a page that was not built: ${u}`);
  else if (isNoindex(pages[u])) fail(`sitemap lists a noindex page: ${u}`);
}
if (/\/review\//.test(sitemap)) fail('sitemap contains a retired /review/ URL');
if (/href="\/review\//.test(pages['/'] ?? '')) fail('homepage links to a retired /review/ URL');

// Retired review pages
for (const [u, h] of Object.entries(pages)) {
  if (!u.startsWith('/review/')) continue;
  const slug = u.split('/')[2];
  if (!isNoindex(h)) fail(`${u} is indexable`);
  const canon = h.match(/rel="canonical" href="([^"]+)"/)?.[1];
  if (canon !== `https://usaasly.com/tool/${slug}/`) fail(`${u} canonical is ${canon}`);
}

// JSON-LD on tool pages
for (const [u, h] of Object.entries(pages)) {
  if (!u.startsWith('/tool/')) continue;
  const slug = u.split('/')[2];
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let graph;
    try {
      graph = JSON.parse(m[1])['@graph'] ?? [];
    } catch (e) {
      fail(`${u} JSON-LD does not parse: ${e.message}`);
      continue;
    }
    if (pricingPages[slug]) {
      const sw = graph.find((n) => n['@type'] === 'SoftwareApplication');
      if (!sw?.offers?.length) fail(`${u} SoftwareApplication without offers`);
      else for (const o of sw.offers) if (typeof o.price !== 'number' || o.priceCurrency !== 'USD') fail(`${u} bad Offer ${o.name}`);
      if (!graph.some((n) => n['@type'] === 'FAQPage')) fail(`${u} missing FAQPage`);
      if (!graph.some((n) => n['@type'] === 'BreadcrumbList')) fail(`${u} missing BreadcrumbList`);
    }
  }
}

// One H1 and unique titles on indexable pages
const titles = new Map();
for (const [u, h] of Object.entries(pages)) {
  if (isNoindex(h) || u === '/404/') continue;
  const h1 = (h.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail(`${u} has ${h1} <h1> elements`);
  const t = h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  if (titles.has(t)) fail(`duplicate title on ${u} and ${titles.get(t)}`);
  titles.set(t, u);
}

console.log(`checked ${Object.keys(pages).length} pages, ${locs.length} sitemap URLs`);
if (problems.length) {
  console.error(`${problems.length} problem(s):\n- ` + problems.join('\n- '));
  process.exit(1);
}
console.log('SEO checks passed');
