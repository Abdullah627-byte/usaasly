import type { APIRoute } from 'astro';
import { catalog, isIndexedTool, toolPath } from '../lib/catalog';
import { getPricingPage } from '../lib/pricingPages';
import { absoluteUrl } from '../lib/seo';
import { SITE_NAME } from '../config/site';

/**
 * /llms.txt: a short, plain-text map of the site for AI assistants (see https://llmstxt.org).
 * Generated from the same data as the pages, so it never drifts. Only indexable tool pages are listed.
 */
export const GET: APIRoute = () => {
  const indexed = catalog.filter(isIndexedTool);
  const priced = indexed.filter((t) => getPricingPage(t.slug));
  const others = indexed.filter((t) => !getPricingPage(t.slug));

  const line = (t: (typeof catalog)[number]) => {
    const when = t.last_verified ? ` (prices last verified ${t.last_verified})` : '';
    return `- [${t.name}](${absoluteUrl(toolPath(t))}): ${t.best_for_usecase}${when}`;
  };

  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_NAME} is an independent directory that compares SaaS and AI tool pricing, hidden limits and real costs. Prices are read from each vendor's official pricing page in US dollars, with monthly and annual billing recorded separately, and every page shows a "last verified" date. Plans without a public price are labelled "custom pricing, not public". Anything we could not confirm is listed as unverified on the page.`,
    '',
    '## How to use this site',
    '',
    '- Each tool page answers "how much does it cost" first, then covers plans, real cost for 1, 3 and 10 users, hidden costs and limits, who should skip it, and FAQs.',
    '- Always confirm a price on the vendor\'s own pricing page before buying; vendors change prices often.',
    `- No ratings or user reviews are published, and there are no paid placements or affiliate links.`,
    '',
    '## Pricing pages (verified)',
    '',
    ...priced.map(line),
    '',
    '## Other tool pages',
    '',
    ...others.map(line),
    '',
    '## About the site',
    '',
    `- [Methodology](${absoluteUrl('/methodology/')}): how prices are verified and what is excluded (taxes, promotions, add-ons)`,
    `- [About](${absoluteUrl('/about/')}): who runs the site and what it is (and is not)`,
    `- [Compare tools](${absoluteUrl('/compare/')}): side-by-side comparisons and a team-size cost calculator`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
