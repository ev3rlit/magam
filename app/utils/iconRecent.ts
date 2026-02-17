import type { LucideIconName } from './lucideRegistry';

export const ICON_RECENT_STORAGE_KEY = 'magam.icons.recent.v1';
export const ICON_RECENT_MAX = 8;

export function updateRecentIcons(
  prev: LucideIconName[],
  nextIcon: LucideIconName,
  max = ICON_RECENT_MAX,
): LucideIconName[] {
  const deduped = prev.filter((name) => name !== nextIcon);
  return [nextIcon, ...deduped].slice(0, max);
}

export function parseRecentIcons(
  raw: string | null,
  isValid: (name: string) => boolean,
  max = ICON_RECENT_MAX,
): LucideIconName[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const result: LucideIconName[] = [];
    for (const item of parsed) {
      if (typeof item !== 'string') continue;
      if (!isValid(item)) continue;
      if (result.includes(item as LucideIconName)) continue;
      result.push(item as LucideIconName);
      if (result.length >= max) break;
    }
    return result;
  } catch {
    return [];
  }
}
