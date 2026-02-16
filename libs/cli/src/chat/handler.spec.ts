import { describe, expect, it } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import type { CLIAdapter } from './adapters/base';
import type { ChatChunk, CLIRunOptions } from '@magam/shared';
import { ChatHandler } from './handler';
import { AdapterRuntimeError } from './adapters/cli-runner';

class FakeAdapter implements CLIAdapter {
  id = 'claude' as const;
  displayName = 'Fake';
  installUrl = 'https://example.com';

  public lastOptions: CLIRunOptions | null = null;
  public lastPrompt: string | null = null;
  public aborted = false;

  async *run(prompt: string, options: CLIRunOptions): AsyncIterable<ChatChunk> {
    this.lastPrompt = prompt;
    this.lastOptions = options;
    yield { type: 'text', content: 'fake-response' };
  }

  abort(): void {
    this.aborted = true;
  }
}

describe('ChatHandler', () => {
  it('streams progress and done chunks', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-handler-'));
    await fs.writeFile(path.join(tmp, 'index.tsx'), 'export const App = () => null');

    const adapter = new FakeAdapter();
    const handler = new ChatHandler({ targetDir: tmp, adapterFactory: () => adapter });

    const chunks = [] as any[];
    for await (const chunk of handler.send({
      message: 'hello',
      providerId: 'claude',
      sessionId: 'session-a',
      currentFile: 'index.tsx',
      model: 'gpt-5',
      effort: 'high',
    })) {
      chunks.push(chunk);
    }

    expect(chunks.some((c) => c.type === 'tool_use' && String(c.content).includes('Building prompt context'))).toBe(true);
    expect(chunks.some((c) => c.type === 'done' && c.metadata?.sessionId === 'session-a')).toBe(true);
    expect(adapter.lastOptions?.permissionMode).toBe('auto');
    expect(adapter.lastOptions?.model).toBe('gpt-5');
    expect(adapter.lastOptions?.reasoningEffort).toBe('high');
  });

  it('passes fixed targetDir as adapter workingDirectory', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-handler-safe-'));
    const fake = new FakeAdapter();
    const handler = new ChatHandler({
      targetDir: tmp,
      adapterFactory: () => fake,
    });

    for await (const _chunk of handler.send({
      message: 'hello',
      providerId: 'claude',
      sessionId: 'session-safe',
      currentFile: 'index.tsx',
      ...({ workingDirectory: '/tmp/unsafe' } as any),
    })) {
      // consume stream
    }

    expect(fake.lastOptions?.workingDirectory).toBe(tmp);
    expect(fake.lastOptions?.permissionMode).toBe('auto');
  });

  it('includes mention context in prompt sent to adapter', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-handler-mentions-'));
    await fs.mkdir(path.join(tmp, 'src'), { recursive: true });
    await fs.writeFile(path.join(tmp, 'src', 'a.ts'), 'export const a = 1;');

    const adapter = new FakeAdapter();
    const handler = new ChatHandler({ targetDir: tmp, adapterFactory: () => adapter });

    for await (const _chunk of handler.send({
      message: 'hello',
      providerId: 'claude',
      fileMentions: [{ path: 'src/a.ts' }],
      nodeMentions: [
        { id: 'n-1', summary: 'first summary' },
        { id: 'n-2', summary: 'second summary' },
      ],
    })) {
      // consume stream
    }

    expect(adapter.lastPrompt).toContain('Mentioned file (src/a.ts)');
    expect(adapter.lastPrompt).toContain('id=n-1');
    expect(adapter.lastPrompt).toContain('id=n-2');
  });

  it('maps adapter runtime errors with error code metadata', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-handler-error-'));

    const failingAdapter: CLIAdapter = {
      id: 'claude',
      displayName: 'Failing',
      installUrl: 'https://example.com',
      async *run(): AsyncIterable<ChatChunk> {
        throw new AdapterRuntimeError('TIMEOUT', 'timed out', { timeoutMs: 10 });
      },
      abort() {},
    };

    const handler = new ChatHandler({
      targetDir: tmp,
      adapterFactory: () => failingAdapter,
    });

    const chunks: ChatChunk[] = [];
    for await (const chunk of handler.send({
      message: 'hello',
      providerId: 'claude',
      sessionId: 'session-timeout',
    })) {
      chunks.push(chunk);
    }

    const errorChunk = chunks.find((chunk) => chunk.type === 'error');
    expect(errorChunk).toBeDefined();
    expect(errorChunk?.metadata?.code).toBe('TIMEOUT');
  });

  it('aborts active run', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-handler-abort-'));

    const abortableAdapter: CLIAdapter = {
      id: 'gemini',
      displayName: 'Abortable',
      installUrl: 'https://example.com',
      aborted: false,
      async *run(): AsyncIterable<ChatChunk> {
        while (!(this as any).aborted) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        throw new AdapterRuntimeError('ABORTED', 'run aborted');
      },
      abort() {
        (this as any).aborted = true;
      },
    } as CLIAdapter;

    const handler = new ChatHandler({
      targetDir: tmp,
      adapterFactory: () => abortableAdapter,
    });

    const iterator = handler.send({
      message: 'hello',
      providerId: 'gemini',
      sessionId: 'session-stop',
      currentFile: 'index.tsx',
    })[Symbol.asyncIterator]();

    const first = await iterator.next();
    expect(first.value?.type).toBe('tool_use');

    const stop = handler.stop('session-stop');
    expect(stop).toEqual({ stopped: true });

    const rest: any[] = [];
    while (true) {
      const next = await iterator.next();
      if (next.done) break;
      rest.push(next.value);
    }

    const doneChunk = rest.find((chunk) => chunk.type === 'done');
    expect(doneChunk).toBeDefined();
    expect(doneChunk?.metadata?.stopped).toBe(true);
    expect(doneChunk?.metadata?.code).toBe('ABORTED');
    expect(rest.some((chunk) => chunk.type === 'error' && chunk.metadata?.code === 'ABORTED')).toBe(false);
  });
});
