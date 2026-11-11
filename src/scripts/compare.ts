/** /compare — matrix of up to 6 tools plus the "Real Cost" team-size calculator. */
import { COMPARE_EVENT, MAX_COMPARE, getSelected, setSelected } from './store';
import { renderMatrix } from './compare-render';
import { clamp, readJson } from './util';
import { showToast } from './toast';
import type { CatalogTool } from './types';

const all = readJson<CatalogTool[]>('catalog-full', []);
const bySlug = new Map(all.map((t) => [t.slug, t]));

const matrix = document.getElementById('matrix');
const emptyEl = document.getElementById('compare-empty');
const filledEl = document.getElementById('compare-filled');
const slider = document.getElementById('team-slider') as HTMLInputElement | null;
const teamNumber = document.getElementById('team-number') as HTMLInputElement | null;
const teamLabel = document.getElementById('team-label');
const picker = document.getElementById('add-tool') as HTMLSelectElement | null;
const countEl = document.getElementById('compare-count');
const live = document.getElementById('compare-live');

let team = 5;

// A shared link (/compare/?tools=a,b,c) wins over the locally saved selection.
const fromUrl = (new URLSearchParams(location.search).get('tools') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => bySlug.has(s));
if (fromUrl.length) setSelected(fromUrl);
const urlTeam = Number(new URLSearchParams(location.search).get('team'));
if (Number.isFinite(urlTeam) && urlTeam >= 1) team = clamp(Math.round(urlTeam), 1, 100);

function selectedTools(): CatalogTool[] {
  return getSelected()
    .map((s) => bySlug.get(s))
    .filter((t): t is CatalogTool => Boolean(t));
}

function renderPicker(chosen: CatalogTool[]): void {
  if (!picker) return;
  const taken = new Set(chosen.map((t) => t.slug));
  const full = chosen.length >= MAX_COMPARE;
  picker.disabled = full;
  const groups = new Map<string, CatalogTool[]>();
  all.filter((t) => !taken.has(t.slug)).forEach((t) => groups.set(t.category, [...(groups.get(t.category) ?? []), t]));

  picker.replaceChildren();
  const first = new Option(full ? `Maximum of ${MAX_COMPARE} tools reached` : 'Add a tool…', '');
  picker.append(first);
  groups.forEach((list, cat) => {
    const g = document.createElement('optgroup');
    g.label = cat;
    list.forEach((t) => g.append(new Option(t.name, t.slug)));
    picker.append(g);
  });
}

function render(): void {
  const chosen = selectedTools();
  if (emptyEl) emptyEl.hidden = chosen.length > 0;
  if (filledEl) filledEl.hidden = chosen.length === 0;
  if (countEl) countEl.textContent = `${chosen.length} of ${MAX_COMPARE} tools`;
  renderPicker(chosen);
  if (!matrix) return;
  matrix.innerHTML = chosen.length ? renderMatrix(chosen, team) : '';

  if (teamLabel) teamLabel.textContent = `${team} ${team === 1 ? 'user' : 'users'}`;
  if (live && chosen.length) {
    live.textContent = `Prices updated for a team of ${team}.`;
  }
}

function setTeam(n: number, source?: HTMLInputElement | null): void {
  team = clamp(Math.round(Number.isFinite(n) ? n : 1), 1, 100);
  if (slider && source !== slider) slider.value = String(team);
  if (teamNumber && source !== teamNumber) teamNumber.value = String(team);
  slider?.setAttribute('aria-valuetext', `${team} ${team === 1 ? 'user' : 'users'}`);
  slider?.style.setProperty('--fill', `${((team - 1) / 99) * 100}%`);
  render();
}

slider?.addEventListener('input', () => setTeam(Number(slider.value), slider));
teamNumber?.addEventListener('input', () => {
  if (teamNumber.value !== '') setTeam(Number(teamNumber.value), teamNumber);
});
teamNumber?.addEventListener('blur', () => {
  teamNumber.value = String(team);
});

picker?.addEventListener('change', () => {
  const slug = picker.value;
  if (!slug) return;
  const next = [...getSelected(), slug];
  setSelected(next);
  showToast(`${bySlug.get(slug)?.name ?? 'Tool'} added.`, 'info', 1800);
});

matrix?.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-remove]');
  if (!btn) return;
  const slug = btn.dataset.remove ?? '';
  setSelected(getSelected().filter((s) => s !== slug));
  (document.getElementById('add-tool') as HTMLElement | null)?.focus();
});

document.getElementById('clear-all')?.addEventListener('click', () => setSelected([]));

document.getElementById('share-link')?.addEventListener('click', async () => {
  const url = `${location.origin}/compare/?tools=${getSelected().join(',')}&team=${team}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Comparison link copied to clipboard.');
  } catch {
    showToast(url, 'info', 8000);
  }
});

window.addEventListener(COMPARE_EVENT, render);
window.addEventListener('storage', render);
setTeam(team);
