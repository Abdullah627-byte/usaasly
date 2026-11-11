// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const SITE = 'https://usassly.com';

/**
 * Pages without generated content are rendered with `noindex`, so they must
 * also be kept out of the sitemap. We compute that list from pseo-tools.json.
 */
function noindexPaths() {
  const tools = JSON.parse(
    readFileSync(new URL('./src/data/pseo-tools.json', import.meta.url), 'utf-8'),
  );
  const skip = new Set();
  const sorted = [...tools].sort((x, y) => x.slug.localeCompare(y.slug));
  for (const t of sorted) {
    if (!t.content) skip.add(`${SITE}/review/${t.slug}/`);
  }
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (!a.comparisons || !a.comparisons[b.slug]) {
        skip.add(`${SITE}/compare/${a.slug}-vs-${b.slug}/`);
      }
    }
  }
  return skip;
}

const skip = noindexPaths();

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !skip.has(page) })],
  vite: {
    plugins: [tailwindcss()],
  },
});
