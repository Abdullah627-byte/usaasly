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

/* ------------------------------------------------------------------ *
 * Programmatic SEO helpers: "A vs B" comparisons and "alternatives".
 * ------------------------------------------------------------------ */

export interface CatalogPair {
  /** URL slug `<a>-vs-<b>`; the two slugs are sorted so each pair has exactly one URL. */
  slug: string;
  a: CatalogTool;
  b: CatalogTool;
}

/** Canonical (alphabetical) slug for a pair, regardless of argument order. */
export function pairSlug(x: CatalogTool, y: CatalogTool): string {
  const [a, b] = [x, y].sort((p, q) => p.slug.localeCompare(q.slug));
  return `${a.slug}-vs-${b.slug}`;
}

export function comparePath(x: CatalogTool, y: CatalogTool): string {
  return `/compare/${pairSlug(x, y)}/`;
}

export function alternativesSlug(t: CatalogTool): string {
  return `best-${t.slug}-alternatives`;
}

export function alternativesPath(t: CatalogTool): string {
  return `/alternatives/${alternativesSlug(t)}/`;
}

/** Every unique same-category pair (A-vs-B only, never also B-vs-A). */
export function categoryPairs(): CatalogPair[] {
  const sorted = [...catalog].sort((x, y) => x.slug.localeCompare(y.slug));
  const pairs: CatalogPair[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      if (a.category === b.category) pairs.push({ slug: `${a.slug}-vs-${b.slug}`, a, b });
    }
  }
  return pairs;
}

/** Same-category tools, best rated first (ties broken by name for stable output). */
export function getTopCompetitors(tool: CatalogTool, limit = 4): CatalogTool[] {
  return catalog
    .filter((t) => t.category === tool.category && t.slug !== tool.slug)
    .sort((x, y) => y.rating - x.rating || x.name.localeCompare(y.name))
    .slice(0, limit);
}

/** Categories that make a sensible fallback when a category has too few tools. */
const RELATED_CATEGORIES: Record<string, string[]> = {
  'AI Assistants': ['AI Writing', 'AI Coding', 'AI Creative'],
  'AI Creative': ['AI Assistants', 'Design', 'AI Writing'],
  'AI Writing': ['AI Assistants', 'Marketing', 'AI Creative'],
  'AI Coding': ['AI Assistants', 'Automation'],
  'Project Management': ['Productivity & Docs', 'Automation', 'Communication'],
  CRM: ['Marketing', 'Customer Support', 'Communication'],
  Design: ['AI Creative', 'Productivity & Docs'],
  'Productivity & Docs': ['Project Management', 'Communication', 'Automation'],
  Communication: ['Productivity & Docs', 'Project Management', 'Customer Support'],
  Automation: ['Productivity & Docs', 'Project Management', 'AI Coding'],
  Marketing: ['CRM', 'Analytics', 'AI Writing'],
  Analytics: ['Marketing', 'CRM'],
  'Customer Support': ['CRM', 'Communication'],
};

/**
 * Top alternatives for a tool: same category first, then related categories,
 * then everything else; best rated first inside each group.
 */
export function getAlternatives(tool: CatalogTool, limit = 6): CatalogTool[] {
  const related = RELATED_CATEGORIES[tool.category] ?? [];
  const rank = (t: CatalogTool) => (t.category === tool.category ? 0 : related.includes(t.category) ? 1 : 2);
  return catalog
    .filter((t) => t.slug !== tool.slug)
    .sort((x, y) => rank(x) - rank(y) || y.rating - x.rating || x.name.localeCompare(y.name))
    .slice(0, limit);
}

/** Short price phrase for running text: `free to start` / `from $20/user/mo`. */
export function priceText(t: CatalogTool): string {
  if (t.starting_price === 0) return 'free to start';
  return `from ${money(t.starting_price)}${t.price_per_user ? '/user' : ''}/mo`;
}

/** Schema.org node for a catalog tool. No Review/aggregateRating: ratings are hidden (SHOW_RATINGS=false). */
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
  };
}
