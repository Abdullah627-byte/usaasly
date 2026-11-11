/** Binds every `[data-compare-toggle]` button on the page to the shared selection store. */
import { COMPARE_EVENT, MAX_COMPARE, getSelected, toggleSelected } from './store';
import { showToast } from './toast';

export function syncCompareButtons(): void {
  const selected = getSelected();
  document.querySelectorAll<HTMLButtonElement>('[data-compare-toggle]').forEach((btn) => {
    const on = selected.includes(btn.dataset.compareToggle ?? '');
    btn.setAttribute('aria-pressed', String(on));
    const label = btn.querySelector('[data-label]');
    if (label) label.textContent = on ? '✓ Added' : '+ Compare';
  });
}

document.addEventListener('click', (e) => {
  const btn = (e.target as Element | null)?.closest<HTMLButtonElement>('[data-compare-toggle]');
  if (!btn) return;
  const slug = btn.dataset.compareToggle ?? '';
  const name = btn.dataset.name ?? slug;
  const result = toggleSelected(slug);
  if (result === 'full') {
    showToast(`You can compare up to ${MAX_COMPARE} tools. Remove one to add ${name}.`, 'info');
  } else if (result === 'added') {
    showToast(`${name} added to comparison (${getSelected().length} of ${MAX_COMPARE}).`, 'info', 2200);
  }
});

window.addEventListener(COMPARE_EVENT, syncCompareButtons);
window.addEventListener('storage', syncCompareButtons);
window.addEventListener('pageshow', syncCompareButtons);
syncCompareButtons();
