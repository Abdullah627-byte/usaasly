/** Homepage: real-time search, ⌘K shortcut, category pills and the combined filter state. */
import { FREE_ONLY_EVENT, isFreeOnly } from './prefs';

const input = document.getElementById('search') as HTMLInputElement | null;
const grid = document.getElementById('tool-grid');
const countEl = document.getElementById('result-count');
const emptyEl = document.getElementById('empty-state');
const pills = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-pill]'));
const clearBtn = document.getElementById('search-clear') as HTMLButtonElement | null;

let category = 'all';

function apply(): void {
  if (!grid) return;
  const q = (input?.value ?? '').trim().toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  const freeOnly = isFreeOnly();
  let visible = 0;

  grid.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
    const text = card.dataset.search ?? '';
    const matchesText = terms.every((t) => text.includes(t));
    const matchesCat = category === 'all' || card.dataset.cat === category;
    card.hidden = !(matchesText && matchesCat);
    // The global toggle hides cards with CSS ([data-free="false"]); mirror it for the count.
    if (!card.hidden && !(freeOnly && card.dataset.free === 'false')) visible += 1;
  });

  if (countEl) {
    countEl.textContent = `${visible} ${visible === 1 ? 'tool' : 'tools'}${freeOnly ? ' · open-source / free only' : ''}`;
  }
  if (emptyEl) emptyEl.hidden = visible > 0;
  if (clearBtn) clearBtn.hidden = !q;
}

function selectCategory(next: string): void {
  category = next;
  pills.forEach((p) => p.setAttribute('aria-pressed', String(p.dataset.pill === next)));
  apply();
}

pills.forEach((p) => p.addEventListener('click', () => selectCategory(p.dataset.pill ?? 'all')));
input?.addEventListener('input', apply);
clearBtn?.addEventListener('click', () => {
  if (!input) return;
  input.value = '';
  apply();
  input.focus();
});
document.getElementById('reset-filters')?.addEventListener('click', () => {
  if (input) input.value = '';
  selectCategory('all');
});
window.addEventListener(FREE_ONLY_EVENT, apply);

// ⌘K / Ctrl+K focuses the search box from anywhere; "/" does too (when not typing).
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  const typing = /^(input|textarea|select)$/i.test((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
  if (key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    input?.focus();
    input?.select();
  } else if (key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    input?.focus();
  } else if (key === 'escape' && document.activeElement === input && input?.value) {
    input.value = '';
    apply();
  }
});

// Show the right modifier glyph for the platform.
const isMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
document.querySelectorAll<HTMLElement>('[data-kbd]').forEach((el) => {
  el.textContent = isMac ? '⌘K' : 'Ctrl K';
});

// Support the Schema.org SearchAction target: /?q=term
const initial = new URLSearchParams(location.search).get('q');
if (initial && input) input.value = initial;
apply();
