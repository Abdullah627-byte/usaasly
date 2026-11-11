/** Builds the comparison matrix HTML (all dynamic text is escaped). */
import type { CatalogTool } from './types';
import { esc, money, monthlyCost } from './util';

const TH = 'border-b border-slate-200 bg-white p-3 align-top';
const ROW_HEAD =
  'sticky left-0 z-10 w-32 min-w-32 border-b border-r border-slate-200 bg-slate-50 p-3 text-left align-top text-xs font-semibold uppercase tracking-wide text-slate-700 sm:w-40 sm:min-w-40';
const CELL = 'w-56 min-w-56 border-b border-slate-200 p-3 align-top text-sm text-slate-800 sm:w-64 sm:min-w-64';


function row(label: string, tools: CatalogTool[], cell: (t: CatalogTool) => string, id?: string): string {
  return `<tr${id ? ` id="${id}"` : ''}>
    <th scope="row" class="${ROW_HEAD}">${esc(label)}</th>
    ${tools.map((t) => `<td class="${CELL}">${cell(t)}</td>`).join('')}
  </tr>`;
}

function list(items: string[], kind: 'pro' | 'con'): string {
  const mark = kind === 'pro' ? '<span class="text-emerald-700" aria-hidden="true">+</span>' : '<span class="text-rose-700" aria-hidden="true">−</span>';
  const label = kind === 'pro' ? 'Pro' : 'Con';
  return `<ul class="space-y-1.5">${items.map((i) => `<li class="flex gap-2">${mark}<span><span class="sr-only">${label}: </span>${esc(i)}</span></li>`).join('')}</ul>`;
}

function priceCell(t: CatalogTool): string {
  if (t.starting_price === 0) return '<p class="text-lg font-bold text-emerald-800">Free</p>';
  return `<p class="text-lg font-bold text-slate-900">${money(t.starting_price)}</p><p class="text-xs text-slate-600">${t.price_per_user ? 'per user / month' : 'flat / month'}</p>`;
}

export function renderMatrix(tools: CatalogTool[], team: number): string {
  const costs = tools.map((t) => monthlyCost(t.starting_price, t.price_per_user, team));
  const lowest = Math.min(...costs);

  const head = `<tr>
    <th scope="col" class="sticky left-0 top-0 z-30 w-32 min-w-32 border-b border-r border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 sm:w-40 sm:min-w-40">Tool</th>
    ${tools
      .map(
        (t) => `<th scope="col" class="sticky top-0 z-20 w-56 min-w-56 sm:w-64 sm:min-w-64 ${TH}">
      <div class="flex items-center gap-3 text-left">
        <img src="${esc(t.logo)}" alt="" width="40" height="40" class="size-10 shrink-0 rounded-xl" />
        <div class="min-w-0">
          <a href="/tool/${esc(t.slug)}/" class="flex min-h-11 min-w-11 items-center truncate text-sm font-semibold text-slate-900 hover:underline">${esc(t.name)}</a>
          <p class="truncate text-xs font-normal text-slate-600">${esc(t.category)}</p>
        </div>
        <button type="button" data-remove="${esc(t.slug)}" aria-label="Remove ${esc(t.name)} from comparison" class="ml-auto flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-slate-600 hover:bg-slate-100">×</button>
      </div>
    </th>`,
      )
      .join('')}
  </tr>`;

  const body = [
    row('Exact pricing', tools, priceCell),
    `<tr>
      <th scope="row" class="${ROW_HEAD}">Real monthly cost<span class="mt-1 block text-[11px] font-normal normal-case tracking-normal text-slate-600">for ${team} ${team === 1 ? 'user' : 'users'}</span></th>
      ${tools
        .map((t, i) => {
          const c = costs[i];
          const detail = t.starting_price === 0 ? 'Free to start' : t.price_per_user ? `${money(t.starting_price)} × ${team} users` : 'Flat fee, same for any team size';
          const badge = c === lowest && tools.length > 1 ? '<span class="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">Lowest</span>' : '';
          return `<td class="${CELL} bg-indigo-50/50"><p class="text-xl font-bold text-indigo-900">${c === 0 ? 'Free' : money(c)}<span class="text-sm font-medium text-slate-700">${c === 0 ? '' : '/mo'}</span>${badge}</p><p class="text-xs text-slate-700">${esc(detail)}</p>${c > 0 ? `<p class="mt-1 text-xs text-slate-600">${money(c * 12)} / year</p>` : ''}</td>`;
        })
        .join('')}
    </tr>`,
    row('Free tier', tools, (t) => (t.is_open_source ? 'Open source (free to self-host)' : t.has_free_tier ? 'Yes' : 'No')),
    row('Hidden limits', tools, (t) => esc(t.hidden_limits)),
    row('AI models', tools, (t) => esc(t.ai_model)),
    row('Use cases', tools, (t) => esc(t.best_for_usecase)),
    row('Pros', tools, (t) => list(t.pros, 'pro')),
    row('Cons', tools, (t) => list(t.cons, 'con')),
    row('Rating', tools, (t) => `<span class="font-semibold">${t.rating.toFixed(1)}</span> / 5`),
    row('Website', tools, (t) => `<a href="${esc(t.website_url)}" target="_blank" rel="noopener nofollow" class="inline-flex min-h-11 items-center font-semibold text-indigo-700 hover:underline">Visit ${esc(t.name)}<span class="sr-only"> (opens in a new tab)</span> ↗</a>`),
  ].join('');

  return `<table class="w-max min-w-full border-separate border-spacing-0 text-left">
    <caption class="sr-only">Side-by-side comparison of ${tools.map((t) => esc(t.name)).join(', ')}</caption>
    <thead>${head}</thead><tbody>${body}</tbody></table>`;
}
