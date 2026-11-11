#!/usr/bin/env node
// Merges catalog part files (JSON Lines) into src/data/tools.json, adds id + logo,
// validates the schema, and writes one monogram SVG per tool to public/logos/.
// Usage: node scripts/build-catalog.mjs <dir-with-parts>
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: build-catalog.mjs <parts-dir>');

const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort();
const rows = files.flatMap((f) =>
  readFileSync(join(dir, f), 'utf-8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)),
);

const FIELDS = {
  name: 'string', slug: 'string', category: 'string', best_for_usecase: 'string',
  starting_price: 'number', price_per_user: 'boolean', hidden_limits: 'string',
  has_free_tier: 'boolean', is_open_source: 'boolean', rating: 'number', ai_model: 'string',
  pros: 'array', cons: 'array', website_url: 'string',
};

const seen = new Set();
for (const r of rows) {
  for (const [k, t] of Object.entries(FIELDS)) {
    const v = r[k];
    const ok = t === 'array' ? Array.isArray(v) && v.length >= 3 && v.every((x) => typeof x === 'string') : typeof v === t;
    if (!ok) throw new Error(`${r.slug ?? r.name}: bad field ${k}`);
  }
  if (seen.has(r.slug)) throw new Error(`duplicate slug ${r.slug}`);
  seen.add(r.slug);
  if (r.rating < 0 || r.rating > 5) throw new Error(`${r.slug}: rating out of range`);
  if (r.starting_price < 0) throw new Error(`${r.slug}: negative price`);
}
if (rows.length !== 50) throw new Error(`expected exactly 50 tools, got ${rows.length}`);

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

mkdirSync('public/logos', { recursive: true });
const out = rows.map((r, i) => {
  const clean = r.name.replace(/[^A-Za-z0-9]/g, '');
  const mono = r.slug === 'n8n' ? 'n8' : clean[0].toUpperCase();
  const bg = hslToHex((i * 137.5) % 360, 55, 34); // white text on this is >= 7:1
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${r.name}"><rect width="96" height="96" rx="22" fill="${bg}"/><text x="48" y="50" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif" font-size="${mono.length > 1 ? 40 : 50}" font-weight="700" fill="#fff">${mono}</text></svg>\n`;
  writeFileSync(`public/logos/${r.slug}.svg`, svg);
  return {
    id: i + 1, name: r.name, slug: r.slug, logo: `/logos/${r.slug}.svg`, category: r.category,
    best_for_usecase: r.best_for_usecase, starting_price: r.starting_price, price_per_user: r.price_per_user,
    hidden_limits: r.hidden_limits, has_free_tier: r.has_free_tier, is_open_source: r.is_open_source,
    rating: r.rating, ai_model: r.ai_model, pros: r.pros, cons: r.cons, website_url: r.website_url,
  };
});
writeFileSync('src/data/tools.json', JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.length} tools, ${new Set(out.map((t) => t.category)).size} categories`);
console.log('free-or-oss:', out.filter((t) => t.is_open_source || t.starting_price === 0).length);
