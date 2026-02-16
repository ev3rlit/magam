import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildProviderCommandCandidates, clearProviderCommandCache } from './provider-command';

const { spawnSyncMock } = vi.hoisted(() => ({
  spawnSyncMock: vi.fn(),
}));
vi.mock('child_process', () => ({
  spawnSync: spawnSyncMock,
}));

describe('provider command candidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearProviderCommandCache();
  });

  it('prefers codex exec pattern when help includes exec', () => {
    spawnSyncMock.mockReturnValue({ stdout: 'Usage: codex exec <prompt>', stderr: '', status: 0 });

    const candidates = buildProviderCommandCandidates('codex', 'hello', { permissionMode: 'interactive' });

    expect(candidates[0]).toEqual({ command: 'codex', args: ['exec', 'hello'] });
    expect(candidates.some((c) => c.args[0] === '--prompt')).toBe(true);
  });

  it('adds auto-approval flags only when supported by provider help', () => {
    spawnSyncMock.mockReturnValue({ stdout: 'Usage: claude --dangerously-skip-permissions -p <prompt>', stderr: '', status: 0 });

    const candidates = buildProviderCommandCandidates('claude', 'hello', { permissionMode: 'auto' });

    expect(candidates[0]?.args).toContain('--dangerously-skip-permissions');
  });

  it('adds model flag only when supported by provider help', () => {
    spawnSyncMock.mockReturnValue({ stdout: 'Usage: codex exec --model <name>', stderr: '', status: 0 });

    const candidates = buildProviderCommandCandidates('codex', 'hello', {
      permissionMode: 'interactive',
      model: 'gpt-5',
    });

    expect(candidates[0]?.args).toContain('--model');
    expect(candidates[0]?.args).toContain('gpt-5');
  });

  it('adds reasoning effort flag only when supported by provider help', () => {
    spawnSyncMock.mockReturnValue({ stdout: 'Usage: codex exec --reasoning-effort <low|medium|high>', stderr: '', status: 0 });

    const candidates = buildProviderCommandCandidates('codex', 'hello', {
      permissionMode: 'interactive',
      reasoningEffort: 'high',
    });

    expect(candidates[0]?.args).toContain('--reasoning-effort');
    expect(candidates[0]?.args).toContain('high');
  });

  it('falls back through known variants when help is unavailable', () => {
    spawnSyncMock.mockReturnValue({ stdout: '', stderr: 'not found', status: 127 });

    const candidates = buildProviderCommandCandidates('gemini', 'hello', { permissionMode: 'interactive' });

    expect(candidates).toEqual([
      { command: 'gemini', args: ['-p', 'hello'] },
      { command: 'gemini', args: ['--prompt', 'hello'] },
      { command: 'gemini', args: ['hello'] },
    ]);
  });
});
