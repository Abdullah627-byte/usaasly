/** One paid plan. Prices are USD per month. A missing value (undefined) means "not verified yet"; null means the vendor does not offer that billing option. */
export interface PlanPrice {
  /** Vendor's plan name, e.g. "Pro". */
  name: string;
  /** Who the plan is aimed at: one person, or a team/organisation. */
  audience: 'individual' | 'team';
  /** Price per month when billed monthly. */
  monthly?: number | null;
  /** Price per month when billed annually. */
  yearly?: number | null;
  /** True when the price is per user/seat, false when it is a flat price for the plan. */
  per_user: boolean;
  /** Short caveat shown under the table row, e.g. "Price depends on team size". */
  note?: string;
}

/** One entry in the master 50-tool catalog (`src/data/tools.json`). */
export interface CatalogTool {
  id: number;
  name: string;
  slug: string;
  logo: string;
  category: string;
  best_for_usecase: string;
  starting_price: number;
  price_per_user: boolean;
  hidden_limits: string;
  has_free_tier: boolean;
  is_open_source: boolean;
  rating: number;
  ai_model: string;
  pros: string[];
  cons: string[];
  website_url: string;
  /** ISO date (YYYY-MM-DD) of a confirmed pricing check; only set after a real manual check. */
  last_verified?: string | null;
  /** Vendor's official pricing page; only set when the URL is known to be correct. */
  pricing_url?: string | null;
  /** Plan-by-plan prices (individual and team, monthly and yearly); only verified numbers. */
  plans?: PlanPrice[];
}

/** Compact projection embedded in pages that only need a few fields client-side. */
export interface ToolLite {
  slug: string;
  name: string;
  logo: string;
  category: string;
  bestFor: string;
  price: number;
  perUser: boolean;
  /** `is_open_source` or `starting_price === 0` — the rule behind the global toggle. */
  free: boolean;
  hasFree: boolean;
  oss: boolean;
  rating: number;
  ai: string;
}
