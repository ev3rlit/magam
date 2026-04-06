export function createDemoSourceVersion(sourceByPath: ReadonlyMap<string, string>): string {
  const normalizedEntries = Array.from(sourceByPath.entries())
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([path, source]) => `${path}\n${source}`)
    .join('\n---\n');

  return hashDemoSource(normalizedEntries);
}

function hashDemoSource(input: string): string {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `demo:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
