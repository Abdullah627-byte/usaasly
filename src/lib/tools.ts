import raw from '../data/pseo-tools.json';

export type ToolStatus = 'active' | 'needs_manual_review';

export interface Faq {
  question: string;
  answer: string;
}

export interface ReviewContent {
  tagline: string;
  summary: string;
  pros: string[];
  cons: string[];
  best_for: string;
  verdict: string;
  rating: number; // 1-5
  faqs: Faq[];
}

export interface ComparisonRow {
  category: string;
  a: string;
  b: string;
  winner: 'a' | 'b' | 'tie';
}

export interface ComparisonContent {
  intro: string;
  winner: string; // slug of overall winner, or "tie"
  verdict: string;
  rows: ComparisonRow[];
  faqs: Faq[];
}

export interface Tool {
  name: string;
  slug: string;
  category: string;
  website: string;
  current_price: number | null;
  currency: string;
  price_unit: string;
  plan_features: string[];
  official_pricing_url: string;
  price_selector: string | null;
  price_regex: string | null;
  status: ToolStatus;
  last_checked: string | null;
  content: ReviewContent | null;
  /** Keyed by the *other* tool's slug. Stored on the alphabetically-first tool. */
  comparisons: Record<string, ComparisonContent>;
}

export const tools = raw as Tool[];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export interface Pair {
  /** URL slug: `<a>-vs-<b>`, alphabetical so every pair has one canonical URL. */
  slug: string;
  a: Tool;
  b: Tool;
  content: ComparisonContent | null;
}

export function allPairs(): Pair[] {
  const sorted = [...tools].sort((x, y) => x.slug.localeCompare(y.slug));
  const pairs: Pair[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      pairs.push({
        slug: `${a.slug}-vs-${b.slug}`,
        a,
        b,
        content: a.comparisons?.[b.slug] ?? null,
      });
    }
  }
  return pairs;
}

export function formatPrice(tool: Tool): string {
  if (tool.current_price === null || tool.current_price === undefined) return 'Contact vendor';
  if (tool.current_price === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: tool.currency || 'USD',
  }).format(tool.current_price);
}
