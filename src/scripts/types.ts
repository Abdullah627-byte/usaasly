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
