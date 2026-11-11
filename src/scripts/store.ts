/** Comparison selection shared across pages (localStorage, with in-memory fallback). */

const KEY = 'usaasly:compare';
export const MAX_COMPARE = 6;
export const COMPARE_EVENT = 'usaasly:compare-change';

let memory: string[] = [];

export function getSelected(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (Array.isArray(parsed)) {
      return [...new Set(parsed.filter((s): s is string => typeof s === 'string'))].slice(0, MAX_COMPARE);
    }
  } catch {
    return memory;
  }
  return [];
}

export function setSelected(list: string[]): string[] {
  const next = [...new Set(list)].slice(0, MAX_COMPARE);
  memory = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: memory fallback is used */
  }
  window.dispatchEvent(new CustomEvent<string[]>(COMPARE_EVENT, { detail: next }));
  return next;
}

export type ToggleResult = 'added' | 'removed' | 'full';

export function toggleSelected(slug: string): ToggleResult {
  const current = getSelected();
  if (current.includes(slug)) {
    setSelected(current.filter((s) => s !== slug));
    return 'removed';
  }
  if (current.length >= MAX_COMPARE) return 'full';
  setSelected([...current, slug]);
  return 'added';
}
