import type { APIRoute } from 'astro';
import { alternativesPath, catalog, categoryPairs, toolPath } from '../lib/catalog';
import { tools as pseoTools } from '../lib/tools';
import { absoluteUrl } from '../lib/seo';

/**
 * Generates /sitemap.xml at build time from the same helpers the pages use,
 * so every generated route is listed automatically:
 *   - static pages, /tool/<slug>/
 *   - /compare/<a>-vs-<b>/      (categoryPairs: same-category, one URL per pair)
 *   - /alternatives/best-<slug>-alternatives/
 *   - /review/<slug>/           (only when generated content exists; otherwise the page is noindex)
 */
export const GET: APIRoute = () => {
  const paths: string[] = [
    '/',
    '/compare/',
    '/stack-builder/',
    '/about/',
    '/methodology/',
    '/contact/',
    ...catalog.map((t) => toolPath(t)),
    ...categoryPairs().map((p) => `/compare/${p.slug}/`),
    ...catalog.map((t) => alternativesPath(t)),
    ...pseoTools.filter((t) => t.content).map((t) => `/review/${t.slug}/`),
  ];

  const unique = [...new Set(paths)];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    unique.map((p) => `  <url>\n    <loc>${absoluteUrl(p)}</loc>\n  </url>`).join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
