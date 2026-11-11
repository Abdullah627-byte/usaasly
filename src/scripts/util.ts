/** Small, dependency-free helpers shared by server (frontmatter) and client scripts. */

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape text for safe interpolation into an HTML template string. */
export function esc(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => ESC[c] ?? c);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `$20`, `$10.99`, `$1,406.63` */
export function money(n: number): string {
  const v = round2(n);
  return Number.isInteger(v) ? usd0.format(v) : usd2.format(v);
}

/** Real monthly cost: per-user tools scale with team size, flat tools do not. */
export function monthlyCost(price: number, perUser: boolean, team: number): number {
  return round2(perUser ? price * team : price);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Read a `<script type="application/json" id="…">` payload. */
export function readJson<T>(id: string, fallback: T): T {
  const el = document.getElementById(id);
  if (!el?.textContent) return fallback;
  try {
    return JSON.parse(el.textContent) as T;
  } catch {
    return fallback;
  }
}
