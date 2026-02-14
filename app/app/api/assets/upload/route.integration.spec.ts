import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let workspaceRoot: string;

async function loadRoute() {
  vi.resetModules();
  return import('./route');
}

describe('assets/upload integration', () => {
  beforeEach(async () => {
    workspaceRoot = await mkdtemp(path.join(tmpdir(), 'magam-upload-route-'));
    process.env.MAGAM_TARGET_DIR = workspaceRoot;
  });

  afterEach(async () => {
    delete process.env.MAGAM_TARGET_DIR;
    await rm(workspaceRoot, { recursive: true, force: true });
  });

  it('stores local file and returns asset path', async () => {
    const sourcePath = path.join(workspaceRoot, 'source.png');
    const fileBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x00,
    ]);
    await writeFile(sourcePath, fileBytes);

    const form = new FormData();
    form.set('source', sourcePath);
    form.set('file', new File([fileBytes], 'logo.png', { type: 'image/png' }));

    const { POST } = await loadRoute();
    const response = await POST(new Request('http://localhost/api/assets/upload', {
      method: 'POST',
      body: form,
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.code).toBe('IMG_201_UPLOADED');
    expect(body.path).toContain('assets/images');

    const absPath = path.join(workspaceRoot, body.path);
    const info = await stat(absPath);
    expect(info.isFile()).toBe(true);
  });

  it('returns 422 for url sourceType', async () => {
    const form = new FormData();
    form.set('source', 'https://example.com/logo.png');
    form.set('sourceType', 'url');

    const { POST } = await loadRoute();
    const response = await POST(new Request('http://localhost/api/assets/upload', {
      method: 'POST',
      body: form,
    }));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe('IMG_422_FETCH_FAILED');
  });
});
