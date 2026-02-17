import type { LucideIconName } from './lucideRegistry';

const MAX_RESULTS_DEFAULT = 50;

const normalize = (value: string) => value.trim().toLowerCase();

type MatchKind = 'prefix' | 'includes';

type ScoredResult = {
  name: LucideIconName;
  kind: MatchKind;
};

export function searchIconNames(
  names: LucideIconName[],
  query: string,
  maxResults = MAX_RESULTS_DEFAULT,
): LucideIconName[] {
  const q = normalize(query);

  if (!q) {
    return [...names].sort((a, b) => a.localeCompare(b)).slice(0, maxResults);
  }

  const matched: ScoredResult[] = [];

  for (const name of names) {
    const target = normalize(name);

    if (target.startsWith(q)) {
      matched.push({ name, kind: 'prefix' });
      continue;
    }

    if (target.includes(q)) {
      matched.push({ name, kind: 'includes' });
    }
  }

  return matched
    .sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === 'prefix' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .map((item) => item.name)
    .slice(0, maxResults);
}
