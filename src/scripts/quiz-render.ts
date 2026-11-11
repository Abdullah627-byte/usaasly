/** HTML templates for the quiz wizard (all dynamic text is escaped). */
import type { Match, Option } from './quiz-data';
import { esc } from './util';

const COMPARE_BTN =
  'min-h-11 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-700 aria-pressed:text-white';
const OPTION_LABEL =
  'flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 hover:border-slate-300 has-[:checked]:border-indigo-700 has-[:checked]:bg-indigo-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600';

export function stepHtml(key: string, title: string, options: Option[], selected?: string): string {
  return `
    <fieldset>
      <legend id="quiz-title" class="text-xl font-bold text-slate-900">${esc(title)}</legend>
      <div class="mt-4 grid gap-2 sm:grid-cols-2">
        ${options
          .map(
            (o) => `
          <label class="${OPTION_LABEL}">
            <input type="radio" name="${esc(key)}" value="${esc(o.id)}" class="mt-1 size-5 shrink-0" ${selected === o.id ? 'checked' : ''} />
            <span><span class="block text-sm font-semibold text-slate-900">${esc(o.label)}</span><span class="block text-sm text-slate-600">${esc(o.hint)}</span></span>
          </label>`,
          )
          .join('')}
      </div>
    </fieldset>`;
}

export function resultsHtml(matches: Match[], freeOnly: boolean): string {
  const note = freeOnly
    ? '<p class="mt-1 text-sm text-slate-600">Showing open-source and free tools only, because that filter is on.</p>'
    : '';

  if (!matches.length) {
    return `<h2 id="quiz-title" class="text-xl font-bold text-slate-900">No matches found</h2>${note}<p class="mt-2 text-sm text-slate-600">Try a different goal, or turn off the free-only filter.</p>`;
  }

  return `
    <h2 id="quiz-title" class="text-xl font-bold text-slate-900">Your top ${matches.length} ${matches.length === 1 ? 'match' : 'matches'}</h2>${note}
    <ol class="mt-4 space-y-3">
      ${matches
        .map(
          (m, i) => `
        <li class="rounded-2xl border border-slate-200 bg-white p-4">
          <div class="flex items-start gap-3">
            <img src="${esc(m.tool.logo)}" alt="" width="48" height="48" class="size-12 shrink-0 rounded-xl" />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-wide text-indigo-700">#${i + 1} match</p>
              <h3 class="text-base font-semibold text-slate-900">${esc(m.tool.name)}</h3>
              <p class="text-sm text-slate-600">${esc(m.tool.bestFor)}</p>
            </div>
          </div>
          <ul class="mt-3 list-disc space-y-0.5 pl-5 text-sm text-slate-700">${m.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
          <div class="mt-3 flex flex-wrap gap-2">
            <a href="/tool/${esc(m.tool.slug)}/" class="flex min-h-11 items-center rounded-full bg-indigo-700 px-4 text-sm font-semibold text-white hover:bg-indigo-800">View ${esc(m.tool.name)}</a>
            <button type="button" data-compare-toggle="${esc(m.tool.slug)}" data-name="${esc(m.tool.name)}" aria-pressed="false" class="${COMPARE_BTN}"><span data-label>+ Compare</span><span class="sr-only"> ${esc(m.tool.name)}</span></button>
          </div>
        </li>`,
        )
        .join('')}
    </ol>`;
}
