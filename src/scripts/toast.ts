/** Accessible toast notifications rendered into <div id="toast-region" aria-live="polite">. */

export function showToast(message: string, kind: 'success' | 'info' = 'success', ms = 4200): void {
  const region = document.getElementById('toast-region');
  if (!region) return;

  const toast = document.createElement('div');
  toast.className = 'toast pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg';

  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.className = kind === 'success' ? 'text-emerald-300' : 'text-sky-300';
  icon.textContent = kind === 'success' ? '✓' : 'ℹ';

  const text = document.createElement('span');
  text.textContent = message;

  toast.append(icon, text);
  region.append(toast);

  window.setTimeout(() => toast.remove(), ms);
}
