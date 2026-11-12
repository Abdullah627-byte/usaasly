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
];
