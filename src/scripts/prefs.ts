/** "Show Open-Source / Free Only" preference. The state lives on <html data-free-only>. */

const KEY = 'usaasly:free-only';
export const FREE_ONLY_EVENT = 'usaasly:free-only-change';

export function isFreeOnly(): boolean {
  return document.documentElement.dataset.freeOnly === 'true';
}

export function setFreeOnly(on: boolean): void {
  document.documentElement.dataset.freeOnly = on ? 'true' : 'false';
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent<boolean>(FREE_ONLY_EVENT, { detail: on }));
}
