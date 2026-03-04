import { expect } from 'bun:test';

function normalizeSource(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export function expectIncludesAll(source: string, snippets: string[]): void {
  const normalized = normalizeSource(source);
  snippets.forEach((snippet) => {
    expect(normalized.includes(normalizeSource(snippet))).toBe(true);
  });
}

export function expectIncludesNone(source: string, snippets: string[]): void {
  const normalized = normalizeSource(source);
  snippets.forEach((snippet) => {
    expect(normalized.includes(normalizeSource(snippet))).toBe(false);
  });
}

export function expectSameSnippetCount(source: string, snippet: string, expectedCount: number): void {
  const normalized = normalizeSource(source);
  const escaped = snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = normalized.match(new RegExp(escaped, 'g'));
  expect(matches?.length ?? 0).toBe(expectedCount);
}
