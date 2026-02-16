import { PassThrough } from 'stream';
import { EventEmitter } from 'events';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import { AdapterRuntimeError, runCLIStream } from './cli-runner';

const { spawnMock } = vi.hoisted(() => ({
  spawnMock: vi.fn(),
}));

vi.mock('child_process', () => ({
  spawn: spawnMock,
}));

function createFakeProcess() {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const stdin = new PassThrough();
  const emitter = new EventEmitter() as ChildProcessWithoutNullStreams;
  (emitter as any).stdout = stdout;
  (emitter as any).stderr = stderr;
  (emitter as any).stdin = stdin;
  (emitter as any).kill = vi.fn((signal?: string) => {
    emitter.emit('close', signal === 'SIGKILL' ? 137 : 143, signal ?? 'SIGTERM');
    return true;
  });
  return emitter;
}

describe('runCLIStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('streams stdout as tool_use/text chunks and uses fixed cwd', async () => {
    const child = createFakeProcess();
    spawnMock.mockReturnValue(child);

    setTimeout(() => {
      child.stdout.write('{"type":"tool_use","tool":"read_file","input":"a.ts"}\n');
      child.stdout.write('{"type":"text","content":"hello"}\n');
      child.stdout.write('plain line\n');
      child.emit('close', 0, null);
    }, 0);

    const chunks = [] as any[];
    for await (const chunk of runCLIStream({
      providerId: 'claude',
      displayName: 'Claude Code',
      command: 'claude',
      args: ['-p', 'prompt'],
      prompt: 'prompt',
      targetDir: '/safe/dir',
      timeoutMs: 5_000,
      getAbortRequested: () => false,
      onProcess: () => {},
    })) {
      chunks.push(chunk);
    }

    expect(spawnMock).toHaveBeenCalledWith('claude', ['-p', 'prompt'], expect.objectContaining({ cwd: '/safe/dir' }));
    expect(chunks[0]).toMatchObject({ type: 'tool_use' });
    expect(chunks[1]).toEqual({ type: 'text', content: 'hello' });
    expect(chunks[2]).toEqual({ type: 'text', content: 'plain line' });
  });

  it('parses sse style json and falls back safely for malformed lines', async () => {
    const child = createFakeProcess();
    spawnMock.mockReturnValue(child);

    setTimeout(() => {
      child.stdout.write('data: {"text":"from-sse"}\n');
      child.stdout.write('{"content":[{"text":"a"},"b"]}\n');
      child.stdout.write('{"text": "broken"\n');
      child.emit('close', 0, null);
    }, 0);

    const chunks: any[] = [];
    for await (const chunk of runCLIStream({
      providerId: 'gemini',
      displayName: 'Gemini CLI',
      command: 'gemini',
      args: ['-p', 'prompt'],
      prompt: 'prompt',
      targetDir: '/safe/dir',
      timeoutMs: 5_000,
      getAbortRequested: () => false,
      onProcess: () => {},
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      { type: 'text', content: 'from-sse' },
      { type: 'text', content: 'ab' },
      { type: 'text', content: '{"text": "broken"' },
    ]);
  });

  it('maps missing binary to BINARY_NOT_FOUND with install hint', async () => {
    const child = createFakeProcess();
    spawnMock.mockReturnValue(child);

    setTimeout(() => {
      child.emit('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }));
      child.emit('close', 1, null);
    }, 0);

    await expect((async () => {
      for await (const _chunk of runCLIStream({
        providerId: 'claude',
        displayName: 'Claude Code',
        installUrl: 'https://example.com/install',
        command: 'claude',
        args: ['-p', 'prompt'],
        prompt: 'prompt',
        targetDir: '/safe/dir',
        timeoutMs: 5_000,
        getAbortRequested: () => false,
        onProcess: () => {},
      })) {
        // no-op
      }
    })()).rejects.toMatchObject<Partial<AdapterRuntimeError>>({ code: 'BINARY_NOT_FOUND' });
  });

  it('maps invalid CLI args to INVALID_ARGS', async () => {
    const child = createFakeProcess();
    spawnMock.mockReturnValue(child);

    setTimeout(() => {
      child.stderr.write('error: unknown option --foo\n');
      child.emit('close', 2, null);
    }, 0);

    await expect((async () => {
      for await (const _chunk of runCLIStream({
        providerId: 'codex',
        displayName: 'Codex CLI',
        command: 'codex',
        args: ['--foo', 'prompt'],
        prompt: 'prompt',
        targetDir: '/safe/dir',
        timeoutMs: 5_000,
        getAbortRequested: () => false,
        onProcess: () => {},
      })) {
        // no-op
      }
    })()).rejects.toMatchObject<Partial<AdapterRuntimeError>>({ code: 'INVALID_ARGS' });
  });

  it('maps abort to ABORTED error', async () => {
    const child = createFakeProcess();
    spawnMock.mockReturnValue(child);

    let shouldAbort = false;
    setTimeout(() => {
      shouldAbort = true;
    }, 10);

    await expect((async () => {
      for await (const _chunk of runCLIStream({
        providerId: 'gemini',
        displayName: 'Gemini CLI',
        command: 'gemini',
        args: ['-p', 'prompt'],
        prompt: 'prompt',
        targetDir: '/safe/dir',
        timeoutMs: 5_000,
        getAbortRequested: () => shouldAbort,
        onProcess: () => {},
      })) {
        // no-op
      }
    })()).rejects.toMatchObject<Partial<AdapterRuntimeError>>({ code: 'ABORTED' });
  });
});
