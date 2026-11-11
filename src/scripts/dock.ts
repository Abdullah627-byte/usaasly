/** Floating comparison dock: visible while 1–6 tools are selected. */
import './compare-buttons';
import { COMPARE_EVENT, MAX_COMPARE, getSelected, setSelected } from './store';
import { readJson } from './util';

interface DockTool {
  name: string;
  logo: string;
}

const dock = document.getElementById('compare-dock');
const names = readJson<Record<string, DockTool>>('dock-data', {});

if (dock) {
  const chips = dock.querySelector<HTMLElement>('[data-dock-chips]')!;
  const count = dock.querySelector<HTMLElement>('[data-dock-count]')!;
  const link = dock.querySelector<HTMLAnchorElement>('[data-dock-link]')!;
  const clear = dock.querySelector<HTMLButtonElement>('[data-dock-clear]')!;

  const render = () => {
    const selected = getSelected().filter((s) => names[s]);
    const wasHidden = dock.hidden;
    dock.hidden = selected.length === 0;
    document.body.classList.toggle('dock-open', selected.length > 0);
    if (wasHidden && !dock.hidden) {
      dock.classList.remove('dock-in');
      void dock.offsetWidth; // restart the slide-in animation
      dock.classList.add('dock-in');
    }
    if (!selected.length) return;

    count.textContent = `${selected.length} of ${MAX_COMPARE} selected`;
    link.href = `/compare/?tools=${selected.join(',')}`;
    link.textContent = selected.length === 1 ? 'Add one more to compare →' : 'Compare now →';

    chips.replaceChildren(
      ...selected.map((slug) => {
        const t = names[slug];
        const chip = document.createElement('span');
        chip.className = 'flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 pl-2';

        const img = document.createElement('img');
        img.src = t.logo;
        img.alt = '';
        img.width = 28;
        img.height = 28;
        img.className = 'size-7 rounded-lg';

        const label = document.createElement('span');
        label.className = 'text-sm font-medium text-slate-800';
        label.textContent = t.name;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'flex size-11 items-center justify-center rounded-full text-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900';
        remove.setAttribute('aria-label', `Remove ${t.name} from comparison`);
        remove.textContent = '×';
        remove.addEventListener('click', () => setSelected(getSelected().filter((s) => s !== slug)));

        chip.append(img, label, remove);
        return chip;
      }),
    );
  };

  clear.addEventListener('click', () => setSelected([]));
  window.addEventListener(COMPARE_EVENT, render);
  window.addEventListener('storage', render);
  window.addEventListener('pageshow', render);
  render();
}
