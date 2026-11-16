import raw from '../data/pricing-pages.json';
import { absoluteUrl, faqSchema } from './seo';
import { round2 } from '../scripts/util';
import type { CatalogTool, PlanPrice } from '../scripts/types';

/**
 * Editorial content for the rewritten pricing pages (src/data/pricing-pages.json).
 * Every number in it comes from pricing-data.md; plan prices themselves live in tools.json (`plans`).
 */
export interface CostRow {
  label: string;
  per_user: boolean;
  monthly?: number | null;
  annual?: number | null;
  /** One regular price when the vendor does not split monthly and annual billing. */
  list?: number;
  /** Team sizes we can price from verified numbers. */
  users: number[];
  one_time?: number;
  one_time_label?: string;
}

export interface PricingPageData {
  title: string;
  description: string;
  h1: string;
  answer: string[];
  cost: { intro: string; rows: CostRow[]; extras: string[] };
  hidden: { t: string; d: string }[];
  verdict: { worth: string; skip: string[]; cheaper: string };
  links: { compare: string[]; related: string[] };
  faqs: { q: string; a: string }[];
  unverified: string[];
}

export const pricingPages = raw as unknown as Record<string, PricingPageData>;

export function getPricingPage(slug: string): PricingPageData | undefined {
  return pricingPages[slug];
}

export const TEAM_SIZES = [1, 3, 10] as const;

export interface CostLine {
  label: string;
  billing: string;
  /** Monthly cost for each team size in TEAM_SIZES, or null when we have no verified number. */
  values: (number | null)[];
}

/** Turn cost rows into table lines (one per billing option). All maths uses only the verified prices. */
export function costLines(rows: CostRow[]): CostLine[] {
  const lines: CostLine[] = [];
  const cell = (row: CostRow, n: number, price: number) =>
    row.users.includes(n) ? round2(row.per_user ? price * n : price) : null;
  for (const r of rows) {
    if (typeof r.monthly === 'number') {
      lines.push({ label: r.label, billing: 'billed monthly', values: TEAM_SIZES.map((n) => cell(r, n, r.monthly as number)) });
    }
    if (typeof r.annual === 'number') {
      lines.push({ label: r.label, billing: 'billed annually, per month', values: TEAM_SIZES.map((n) => cell(r, n, r.annual as number)) });
    }
    if (typeof r.list === 'number') {
      lines.push({ label: r.label, billing: 'per month', values: TEAM_SIZES.map((n) => cell(r, n, r.list as number)) });
    }
    if (typeof r.one_time === 'number') {
      const base = (r.annual ?? r.list ?? r.monthly) as number;
      lines.push({
        label: r.label,
        billing: `first year in total, including ${r.one_time_label ?? 'one-time fee'} ($${r.one_time.toLocaleString('en-US')})`,
        values: TEAM_SIZES.map((n) => (r.users.includes(n) ? round2((r.per_user ? base * n : base) * 12 + (r.one_time as number)) : null)),
      });
    }
  }
  return lines;
}

/** schema.org Offer nodes: one per priced plan and billing option. Custom-priced plans are skipped (no number to publish). */
function offerNodes(tool: CatalogTool, plans: PlanPrice[]): Record<string, unknown>[] {
  const offers: Record<string, unknown>[] = [];
  const unit = (p: PlanPrice) => (p.per_user ? 'per user per month' : 'per month');
  const push = (p: PlanPrice, price: number, suffix: string) =>
    offers.push({
      '@type': 'Offer',
      name: suffix ? `${p.name} (${suffix})` : p.name,
      price,
      priceCurrency: 'USD',
      url: tool.pricing_url ?? tool.website_url,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price,
        priceCurrency: 'USD',
        unitText: unit(p),
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
      },
    });
  for (const p of plans) {
    if (p.custom) continue;
    if (typeof p.list === 'number') push(p, p.list, 'regular rate');
    if (typeof p.monthly === 'number') push(p, p.monthly, p.monthly === 0 && p.yearly === 0 ? '' : 'billed monthly');
    if (typeof p.yearly === 'number' && !(p.monthly === 0 && p.yearly === 0)) push(p, p.yearly, 'billed annually, per month');
  }
  return offers;
}

/** SoftwareApplication (with Offer entries) + FAQPage. BreadcrumbList is added by the page. */
export function pricingSchema(tool: CatalogTool, page: PricingPageData, path: string): Record<string, unknown>[] {
  return [
    {
      '@type': 'SoftwareApplication',
      '@id': `${absoluteUrl(path)}#software`,
      name: tool.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: tool.website_url,
      image: absoluteUrl(tool.logo),
      description: tool.best_for_usecase,
      offers: offerNodes(tool, tool.plans ?? []),
    },
    { ...faqSchema(page.faqs.map((f) => ({ question: f.q, answer: f.a }))), '@id': `${absoluteUrl(path)}#faq` },
  ];
}
