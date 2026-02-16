import type { ChatChunk } from '@magam/shared';

export function normalizeTextChunk(content: string): ChatChunk {
  return { type: 'text', content };
}

export function normalizeErrorChunk(content: string, metadata?: Record<string, unknown>): ChatChunk {
  return { type: 'error', content, metadata };
}

export function normalizeDoneChunk(metadata?: Record<string, unknown>): ChatChunk {
  return { type: 'done', content: '', metadata };
}
