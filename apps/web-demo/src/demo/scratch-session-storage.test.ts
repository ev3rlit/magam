import assert from 'node:assert/strict';
import test from 'node:test';
import type { ScratchDocument } from './contracts';
import {
  readScratchDocumentSnapshot,
  SCRATCH_SESSION_STORAGE_KEY,
  writeScratchDocumentSnapshot,
} from './scratch-session-storage';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

test('scratch session storage round-trips a valid document', () => {
  const storage = new MemoryStorage();
  const document: ScratchDocument = {
    documentId: 'scratch:examples/readme.tsx',
    sourcePath: 'examples/readme.tsx',
    source: 'export default function Example() {}',
  };

  writeScratchDocumentSnapshot(storage, document);

  assert.deepEqual(
    readScratchDocumentSnapshot(storage, new Set(['examples/readme.tsx'])),
    document,
  );
});

test('scratch session storage removes invalid paths during restore', () => {
  const storage = new MemoryStorage();

  storage.setItem(
    SCRATCH_SESSION_STORAGE_KEY,
    JSON.stringify({
      documentId: 'scratch:examples/unknown.tsx',
      sourcePath: 'examples/unknown.tsx',
      source: 'export default function Example() {}',
    }),
  );

  assert.equal(readScratchDocumentSnapshot(storage, new Set(['examples/readme.tsx'])), null);
  assert.equal(storage.getItem(SCRATCH_SESSION_STORAGE_KEY), null);
});

test('scratch session storage clears malformed payloads', () => {
  const storage = new MemoryStorage();

  storage.setItem(SCRATCH_SESSION_STORAGE_KEY, '{invalid json');

  assert.equal(readScratchDocumentSnapshot(storage, new Set(['examples/readme.tsx'])), null);
  assert.equal(storage.getItem(SCRATCH_SESSION_STORAGE_KEY), null);
});
