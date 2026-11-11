/** /stack-builder — pick 1 tool from each of 3 categories and total the monthly cost. */
import { FREE_ONLY_EVENT, isFreeOnly } from './prefs';
import { breakdownRow, slotHtml } from './stack-render';
import { clamp, money, monthlyCost, readJson, round2 } from './util';
import { setSelected } from './store';
import type { ToolLite } from './types';

const tools = readJson<ToolLite[]>('catalog-lite', []);
const categories = [...new Set(tools.map((t) => t.category))];
const bySlug = new Map(tools.map((t) => [t.slug, t]));

const SLOTS = 3;
const DEFAULTS = ['CRM', 'AI Assistants', 'Project Management'];

const slotsEl = document.getElementById('slots');
const slider = document.getElementById('stack-team') as HTMLInputElement | null;
const teamNumber = document.getElementById('stack-team-number') as HTMLInputElement | null;
const breakdownEl = document.getElementById('breakdown-list');
const compareBtn = document.getElementById('stack-compare') as HTMLButtonElement | null;

let team = 5;
const slotCategory: string[] = DEFAULTS.filter((c) => categories.includes(c)).slice(0, SLOTS);
while (slotCategory.length < SLOTS) slotCategory.push(categories.find((c) => !slotCategory.includes(c)) ?? categories[0]);
const slotTool: (string | null)[] = Array(SLOTS).fill(null);

const pool = (cat: string): ToolLite[] => tools.filter((t) => t.category === cat && (!isFreeOnly() || t.free));
const plural = (n: number) => `${n} ${n === 1 ? 'user' : 'users'}`;

function renderSummary(): void {
  let total = 0;
  const rows = slotTool.map((slug, i) => {
    const t = slug ? bySlug.get(slug) : undefined;
    const cost = t ? monthlyCost(t.price, t.perUser, team) : 0;
    total += cost;
    return breakdownRow(slotCategory[i], t, cost, team);
  });
  total = round2(total);

  if (breakdownEl) breakdownEl.innerHTML = rows.join('');
  document.querySelectorAll<HTMLElement>('[data-total]').forEach((el) => (el.textContent = money(total)));
  document.querySelectorAll<HTMLElement>('[data-yearly]').forEach((el) => (el.textContent = `${money(total * 12)} / year`));
  document.querySelectorAll<HTMLElement>('[data-team-label]').forEach((el) => (el.textContent = plural(team)));
  if (compareBtn) compareBtn.disabled = !slotTool.some(Boolean);
}

function renderSlots(): void {
  // Drop any chosen tool that the Free-Only filter now hides.
  slotTool.forEach((s, i) => {
    if (s && !pool(slotCategory[i]).some((t) => t.slug === s)) slotTool[i] = null;
  });
  if (slotsEl) {
    slotsEl.innerHTML = slotCategory
      .map((cat, i) => slotHtml(i, cat, categories, new Set(slotCategory.filter((_, j) => j !== i)), pool(cat), slotTool[i]))
      .join('');
  }
  renderSummary();
}

slotsEl?.addEventListener('change', (e) => {
  const el = e.target;
  if (el instanceof HTMLSelectElement && el.dataset.slotCat !== undefined) {
    const i = Number(el.dataset.slotCat);
    slotCategory[i] = el.value;
    slotTool[i] = null;
    renderSlots();
    document.getElementById(`slot-${i}-cat`)?.focus();
  } else if (el instanceof HTMLInputElement && el.type === 'radio') {
    slotTool[Number(el.name.replace('slot-', ''))] = el.value;
    renderSummary();
  }
});

function setTeam(n: number, source?: HTMLInputElement | null): void {
  team = clamp(Math.round(Number.isFinite(n) ? n : 1), 1, 100);
  if (slider && source !== slider) slider.value = String(team);
  if (teamNumber && source !== teamNumber) teamNumber.value = String(team);
  slider?.setAttribute('aria-valuetext', plural(team));
  renderSummary();
}

slider?.addEventListener('input', () => setTeam(Number(slider.value), slider));
teamNumber?.addEventListener('input', () => {
  if (teamNumber.value !== '') setTeam(Number(teamNumber.value), teamNumber);
});
teamNumber?.addEventListener('blur', () => {
  teamNumber.value = String(team);
});

compareBtn?.addEventListener('click', () => {
  const picks = slotTool.filter((s): s is string => Boolean(s));
  if (!picks.length) return;
  setSelected(picks);
  location.href = `/compare/?tools=${picks.join(',')}&team=${team}`;
});

window.addEventListener(FREE_ONLY_EVENT, renderSlots);
renderSlots();
