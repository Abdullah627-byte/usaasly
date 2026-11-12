import type { APIRoute } from 'astro';
import { catalog, toolPath } from '../lib/catalog';
import { allPairs, tools as pseoTools } from '../lib/tools';
import { absoluteUrl } from '../lib/seo';

/**
 * Generates /sitemap.xml at build time.
 * Only indexable pages are listed: review/compare pages without generated
 * content are rendered with `noindex` (see BaseLayout usage), so they are skipped.
 */
export const GET: APIRoute = () => {
  const paths: string[] = [
    '/',
    '/compare/',
    '/stack-builder/',
    ...catalog.map((t) => toolPath(t)),
    ...pseoTools.filter((t) => t.content).map((t) => `/review/${t.slug}/`),
    ...allPairs()
      .filter((p) => p.content)
      .map((p) => `/compare/${p.slug}/`),
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
