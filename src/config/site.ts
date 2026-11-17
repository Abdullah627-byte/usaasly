/** Single source of truth for sitewide flags and identifiers — never hardcode these in pages. */
export const SITE_NAME = 'Usaasly';
export const CONTACT_EMAIL = 'stackcompare0@gmail.com';

/** Editorial star ratings (ToolCard, ToolHeader, compare/alternatives pages) are hidden until a real scoring system ships. */
export const SHOW_RATINGS = false;
/** User-submitted reviews (the review form on tool pages) aren't live yet. */
export const REVIEWS_ENABLED = false;
/** No affiliate/referral links are used on the site at this time. */
export const AFFILIATE_LINKS = false;

/**
 * "Best X alternatives" pages are only indexed when X has at least this many rivals in its own category;
 * with fewer, the page is mostly filler from related categories (thin), so it stays live but noindex.
 */
export const MIN_SAME_CATEGORY_RIVALS = 3;
/** Alternatives pages kept indexed even though they are thin, because they already earn Search Console impressions. */
export const ALTERNATIVES_INDEX_EXEMPT: readonly string[] = ['make'];

/**
 * Tools we are actively targeting for Google. Tool, alternatives and compare pages for every other tool stay live
 * but are noindex (and left out of the sitemap) until their pricing has been verified and they are added here.
 */
export const INDEXED_TOOL_SLUGS: readonly string[] = [
  'chatgpt',
  'claude',
  'gemini',
  'perplexity',
  'microsoft-copilot',
  'cursor',
  'github-copilot',
  'midjourney',
  'grammarly',
  'figma',
  'canva',
  'notion',
  'asana',
  'monday-com',
  'clickup',
  'hubspot',
  'salesforce',
  'slack',
  'zapier',
  'make',
  'trello',
  'jira',
  'airtable',
  'linear',
  'pipedrive',
  // Pricing verified on 2026-11-16 (see pricing-data.md).
  'semrush',
];
