/** HTML templates for the Stack Builder (all dynamic text is escaped). */
import { esc, money } from './util';
import type { ToolLite } from './types';

export function priceText(t: ToolLite): string {
  if (t.price === 0) return 'Free';
  return `${money(t.price)}${t.perUser ? ' /user' : ''} /mo`;
}

const OPTION =
  'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3 hover:border-slate-300 has-[:checked]:border-indigo-700 has-[:checked]:bg-indigo-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600';

export function slotHtml(i: number, category: string, allCategories: string[], takenElsewhere: Set<string>, list: ToolLite[], picked: string | null): string {
  const options = allCategories
    .map((c) => `<option value="${esc(c)}" ${c === category ? 'selected' : ''} ${takenElsewhere.has(c) ? 'disabled' : ''}>${esc(c)}</option>`)
    .join('');

  const body = list.length
    ? `<div role="radiogroup" aria-labelledby="slot-${i}-title" class="mt-3 grid gap-2 sm:grid-cols-2">
        ${list
          .map(
            (t) => `<label class="${OPTION}">
              <input type="radio" class="size-5 shrink-0" name="slot-${i}" value="${esc(t.slug)}" ${picked === t.slug ? 'checked' : ''} />
              <img src="${esc(t.logo)}" alt="" width="36" height="36" loading="lazy" class="size-9 shrink-0 rounded-lg" />
              <span class="min-w-0"><span class="block truncate text-sm font-semibold text-slate-900">${esc(t.name)}</span><span class="block text-xs text-slate-700">${esc(priceText(t))}</span></span>
            </label>`,
          )
          .join('')}
      </div>`
    : '<p class="mt-3 text-sm text-slate-600">No open-source or free tools in this category. Turn off the filter to see all tools.</p>';

  return `<section aria-labelledby="slot-${i}-title" class="rounded-3xl border border-slate-200 bg-white p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 id="slot-${i}-title" class="text-lg font-semibold text-slate-900">${i + 1}. ${esc(category)}</h2>
      <div>
        <label for="slot-${i}-cat" class="sr-only">Category for choice ${i + 1}</label>
        <select id="slot-${i}-cat" data-slot-cat="${i}" class="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800">${options}</select>
      </div>
    </div>
    ${body}
  </section>`;
}

export function breakdownRow(category: string, t: ToolLite | undefined, cost: number, team: number): string {
  if (!t) {
    return `<li class="flex justify-between gap-3 py-2 text-sm text-slate-600"><span>${esc(category)}</span><span>Not chosen</span></li>`;
  }
  const detail = t.price === 0 ? 'Free' : t.perUser ? `${money(t.price)} × ${team}` : 'Flat fee';
  return `<li class="flex items-start justify-between gap-3 py-2 text-sm"><span class="min-w-0"><span class="block font-semibold text-slate-900">${esc(t.name)}</span><span class="block text-xs text-slate-600">${esc(detail)}</span></span><span class="shrink-0 font-semibold text-slate-900">${cost === 0 ? 'Free' : money(cost)}</span></li>`;
}
