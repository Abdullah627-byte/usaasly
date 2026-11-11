import raw from '../data/tools.json';
import { money } from '../scripts/util';
import type { CatalogTool, ToolLite } from '../scripts/types';
import { absoluteUrl } from './seo';

export { money };
export type { CatalogTool, ToolLite };

export const catalog = raw as CatalogTool[];

export function toLite(t: CatalogTool): ToolLite {
  return {
    slug: t.slug,
    name: t.name,
    logo: t.logo,
    category: t.category,
    bestFor: t.best_for_usecase,
    price: t.starting_price,
    perUser: t.price_per_user,
    free: t.is_open_source || t.starting_price === 0,
    hasFree: t.has_free_tier,
    oss: t.is_open_source,
    rating: t.rating,
    ai: t.ai_model,
  };
}

/** Categories in order of first appearance in the catalog. */
export const categories: string[] = [...new Set(catalog.map((t) => t.category))];

export function getCatalogTool(slug: string): CatalogTool | undefined {
  return catalog.find((t) => t.slug === slug);
}

/** The rule used by the global "Open-Source / Free Only" toggle. */
export function isFreeOrOss(t: CatalogTool): boolean {
  return t.is_open_source || t.starting_price === 0;
}

export function priceLabel(t: CatalogTool): string {
  if (t.starting_price === 0) return 'Free';
  return `From ${money(t.starting_price)}${t.price_per_user ? '/user' : ''}/mo`;
}

export function toolPath(t: CatalogTool): string {
  return `/tool/${t.slug}/`;
}

/** Schema.org node for a catalog tool (editorial rating, never a fabricated aggregate). */
export function softwareSchema(t: CatalogTool): Record<string, unknown> {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${absoluteUrl(toolPath(t))}#software`,
    name: t.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: t.website_url,
    image: absoluteUrl(t.logo),
    description: t.best_for_usecase,
    offers: {
      '@type': 'Offer',
      price: t.starting_price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: t.website_url,
    },
    review: {
      '@type': 'Review',
      author: { '@type': 'Organization', name: 'Usassly' },
      reviewRating: { '@type': 'Rating', ratingValue: t.rating, bestRating: 5, worstRating: 1 },
      reviewBody: `Pros: ${t.pros.join('; ')}. Cons: ${t.cons.join('; ')}.`,
    },
  };
}
