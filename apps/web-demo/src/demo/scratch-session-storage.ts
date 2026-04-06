import type { ScratchDocument } from '@/src/demo/contracts';

export const SCRATCH_SESSION_STORAGE_KEY = 'magam:web-demo:scratch:v1';

export function readScratchDocumentSnapshot(
  storage: Storage,
  availablePaths: Set<string>,
): ScratchDocument | null {
  const rawValue = storage.getItem(SCRATCH_SESSION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!isScratchDocument(parsedValue) || !availablePaths.has(parsedValue.sourcePath)) {
      storage.removeItem(SCRATCH_SESSION_STORAGE_KEY);

      return null;
    }

    return parsedValue;
  } catch {
    storage.removeItem(SCRATCH_SESSION_STORAGE_KEY);

    return null;
  }
}

export function writeScratchDocumentSnapshot(
  storage: Storage,
  document: ScratchDocument | null,
): void {
  if (!document) {
    storage.removeItem(SCRATCH_SESSION_STORAGE_KEY);

    return;
  }

  storage.setItem(SCRATCH_SESSION_STORAGE_KEY, JSON.stringify(document));
}

function isScratchDocument(value: unknown): value is ScratchDocument {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.documentId === 'string' &&
    typeof candidate.sourcePath === 'string' &&
    typeof candidate.source === 'string'
  );
}
