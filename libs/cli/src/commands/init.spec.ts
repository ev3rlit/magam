import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initProject } from './init';
import { mkdir, writeFile, access } from 'fs/promises';
import { join } from 'path';

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
}));

describe('initProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize project structure when tsconfig does not exist', async () => {
    const cwd = '/tmp/test-project';
    // Simulate tsconfig.json missing (access throws)
    vi.mocked(access).mockRejectedValue(new Error('ENOENT'));

    await initProject(cwd);

    expect(mkdir).toHaveBeenCalledWith(
      join(cwd, '.magam', 'node_modules', 'magam'),
      { recursive: true },
    );

    expect(writeFile).toHaveBeenCalledWith(
      join(cwd, '.magam', 'node_modules', 'magam', 'index.d.ts'),
      expect.stringContaining('export declare const Canvas'),
    );

    expect(writeFile).toHaveBeenCalledWith(
      join(cwd, 'tsconfig.json'),
      expect.stringContaining('"baseUrl": "."'),
    );
  });

  it('should not overwrite tsconfig.json if it exists', async () => {
    const cwd = '/tmp/existing-project';
    // Simulate tsconfig.json exists (access resolves)
    vi.mocked(access).mockResolvedValue(undefined);

    await initProject(cwd);

    expect(mkdir).toHaveBeenCalled();

    expect(writeFile).not.toHaveBeenCalledWith(
      join(cwd, 'tsconfig.json'),
      expect.any(String),
    );
  });

  it('should not overwrite tsconfig.json if it exists', async () => {
    const cwd = '/tmp/existing-project';
    // Simulate tsconfig.json exists (access resolves)
    vi.mocked(access).mockResolvedValue(undefined);

    await initProject(cwd);

    // Should still create structure
    expect(mkdir).toHaveBeenCalled();

    // Should NOT write tsconfig.json
    expect(writeFile).not.toHaveBeenCalledWith(
      join(cwd, 'tsconfig.json'),
      expect.any(String),
    );
  });
});
