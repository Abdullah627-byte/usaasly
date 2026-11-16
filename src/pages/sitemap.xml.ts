import type { APIRoute } from 'astro';
import { alternativesPath, catalog, categoryPairs, isIndexedAlternatives, isIndexedTool, toolPath, type CatalogTool } from '../lib/catalog';
import { absoluteUrl } from '../lib/seo';

/**
 * Generates /sitemap.xml at build time from the same helpers the pages use,
 * so every generated route is listed automatically:
 *   - static pages, /tool/<slug>/
 *   - /compare/<a>-vs-<b>/      (categoryPairs: same-category, one URL per pair)
 *   - /alternatives/best-<slug>-alternatives/   (only where the tool has enough same-category rivals, see isIndexedAlternatives)
 *   - /review/<slug>/ is retired: it 301-redirects to the tool page and is not listed.
 *
 * <lastmod> is only written when we have a real date: the pricing "last verified" date of the tool(s) on the page.
 * Pages without one get no <lastmod> rather than a made-up date.
 */
interface Entry {
  path: string;
  lastmod?: string;
}

/** Latest valid YYYY-MM-DD among the given dates, or undefined. */
function latest(dates: (string | null | undefined)[]): string | undefined {
  const ok = dates.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
  return ok.length ? ok.sort().at(-1) : undefined;
}
const verified = (...ts: CatalogTool[]) => latest(ts.map((t) => t.last_verified));

export const GET: APIRoute = () => {
  const indexed = catalog.filter(isIndexedTool);
  const entries: Entry[] = [
    { path: '/', lastmod: verified(...indexed) },
    { path: '/compare/' },
    { path: '/stack-builder/' },
    { path: '/about/' },
    { path: '/methodology/' },
    { path: '/contact/' },
    ...indexed.map((t) => ({ path: toolPath(t), lastmod: verified(t) })),
    ...categoryPairs()
      .filter((p) => isIndexedTool(p.a) && isIndexedTool(p.b))
      .map((p) => ({ path: `/compare/${p.slug}/`, lastmod: verified(p.a, p.b) })),
    ...indexed.filter(isIndexedAlternatives).map((t) => ({ path: alternativesPath(t), lastmod: verified(t) })),
  ];

  const seen = new Set<string>();
  const unique = entries.filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)));
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    unique
      .map((e) => `  <url>\n    <loc>${absoluteUrl(e.path)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}\n  </url>`)
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
