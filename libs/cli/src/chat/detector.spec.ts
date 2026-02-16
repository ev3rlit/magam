import { describe, expect, it, vi, beforeEach } from 'vitest';
import { detectProvider } from './detector';

const { spawnSyncMock } = vi.hoisted(() => ({
  spawnSyncMock: vi.fn(),
}));
vi.mock('child_process', () => ({
  spawnSync: spawnSyncMock,
}));

describe('provider detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses alternate version flags when --version fails', async () => {
    spawnSyncMock
      .mockReturnValueOnce({ status: 2, stdout: '', stderr: 'unknown option --version', error: undefined })
      .mockReturnValueOnce({ status: 0, stdout: 'claude 1.2.3\n', stderr: '', error: undefined });

    const detected = await detectProvider('claude');

    expect(detected.isInstalled).toBe(true);
    expect(detected.version).toBe('claude 1.2.3');
  });

  it('marks provider as not installed when command is missing', async () => {
    spawnSyncMock.mockReturnValue({
      status: null,
      stdout: '',
      stderr: 'command not found',
      error: { code: 'ENOENT' },
    });

    const detected = await detectProvider('gemini');

    expect(detected.isInstalled).toBe(false);
    expect(detected.version).toBeNull();
  });
});
