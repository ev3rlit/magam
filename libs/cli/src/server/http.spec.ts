import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  mockGlob,
  mockTranspile,
  mockExecute,
  mockExistsSync,
  mockReadFileSync,
  mockChatGetProviders,
  mockChatSend,
  mockChatStop,
} = vi.hoisted(() => ({
  mockGlob: vi.fn(),
  mockTranspile: vi.fn(),
  mockExecute: vi.fn(),
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockChatGetProviders: vi.fn(),
  mockChatSend: vi.fn(),
  mockChatStop: vi.fn(),
}));

// Mock fast-glob
vi.mock('fast-glob', () => ({
  default: mockGlob,
}));

// Mock dependencies
vi.mock('../core/transpiler', () => ({
  transpile: mockTranspile,
}));

vi.mock('../core/executor', () => ({
  execute: mockExecute,
}));

vi.mock('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

vi.mock('../chat/handler', () => ({
  ChatHandler: class {
    constructor(_config: unknown) {}
    getProviders() {
      return mockChatGetProviders();
    }
    send(request: unknown) {
      return mockChatSend(request);
    }
    stop(sessionId: string) {
      return mockChatStop(sessionId);
    }
  },
}));

// Import after mocks
import { startHttpServer, HttpServerResult } from './http';
import * as fs from 'fs';

describe('HTTP Render Server', () => {
  let serverResult: HttpServerResult;
  const targetDir = '/tmp/test';
  const port = 4001; // Use different port to avoid conflicts

  beforeEach(async () => {
    vi.clearAllMocks();

    mockChatGetProviders.mockResolvedValue([
      { id: 'claude', displayName: 'Claude Code', isInstalled: true },
    ]);

    mockChatSend.mockImplementation(async function* (request: any) {
      const sessionId = request?.sessionId ?? 'session-default';
      yield {
        type: 'tool_use',
        content: 'Building prompt context',
        metadata: { stage: 'prompt-build-start', sessionId },
      };
      yield {
        type: 'tool_use',
        content: `Running ${request?.providerId ?? 'unknown'} adapter`,
        metadata: { stage: 'adapter-start', sessionId },
      };
      yield {
        type: 'done',
        content: '',
        metadata: { sessionId },
      };
    });

    mockChatStop.mockImplementation(() => ({ stopped: false }));

    serverResult = await startHttpServer({ targetDir, port });
  });

  afterEach(async () => {
    await serverResult.close();
  });

  const baseUrl = `http://localhost:${port}`;

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ status: 'ok', targetDir });
    });
  });

  describe('GET /files', () => {
    it('should return list of files', async () => {
      mockGlob.mockResolvedValue(['file1.tsx', 'file2.tsx']);

      const response = await fetch(`${baseUrl}/files`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ files: ['file1.tsx', 'file2.tsx'] });
      expect(mockGlob).toHaveBeenCalledWith('**/*.tsx', { cwd: targetDir });
    });

    it('should handle glob errors', async () => {
      mockGlob.mockRejectedValue(new Error('Glob error'));

      const response = await fetch(`${baseUrl}/files`);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.type).toBe('FILES_ERROR');
    });
  });

  describe('POST /render', () => {
    it('should return 400 if filePath is missing', async () => {
      const response = await fetch(`${baseUrl}/render`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.type).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const response = await fetch(`${baseUrl}/render`, {
        method: 'POST',
        body: JSON.stringify({ filePath: 'missing.tsx' }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.type).toBe('FILE_NOT_FOUND');
    });

    it('should render file successfully', async () => {
      mockExistsSync.mockReturnValue(true);
      // We don't read file manually anymore, transpile does it
      mockTranspile.mockResolvedValue('transpiled code');
      mockExecute.mockResolvedValue({ isOk: () => true, value: {} } as any);

      const response = await fetch(`${baseUrl}/render`, {
        method: 'POST',
        body: JSON.stringify({ filePath: 'exists.tsx' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ graph: {} });
      // expect valid args
      expect(mockTranspile).toHaveBeenCalledWith(expect.stringContaining('exists.tsx'));
      expect(mockExecute).toHaveBeenCalledWith('transpiled code');
    });

    it('should handle render errors', async () => {
      mockExistsSync.mockReturnValue(true);
      mockTranspile.mockRejectedValue(new Error('Transpile error'));

      const response = await fetch(`${baseUrl}/render`, {
        method: 'POST',
        body: JSON.stringify({ filePath: 'error.tsx' }),
      });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.type).toBe('RENDER_ERROR');
    });
  });

  describe('Chat endpoints', () => {
    it('should return providers list', async () => {
      const response = await fetch(`${baseUrl}/chat/providers`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(body.providers)).toBe(true);
    });

    it('should reject workingDirectory in request body', async () => {
      const response = await fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'claude',
          workingDirectory: '/tmp/unsafe'
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.type).toBe('VALIDATION_ERROR');
    });


    it('should default permissionMode to auto', async () => {
      await fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'claude'
        }),
      });

      expect(mockChatSend).toHaveBeenCalledWith(
        expect.objectContaining({ permissionMode: 'auto' }),
      );
    });


    it('should pass interactive permissionMode when provided', async () => {
      await fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'claude',
          permissionMode: 'interactive'
        }),
      });

      expect(mockChatSend).toHaveBeenCalledWith(
        expect.objectContaining({ permissionMode: 'interactive' }),
      );
    });

    it('should forward valid model and reasoning effort fields', async () => {
      await fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'claude',
          model: 'gpt-5',
          effort: 'high',
        }),
      });

      expect(mockChatSend).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-5', reasoningEffort: 'high' }),
      );
    });

    it('should ignore unsupported model/effort values safely', async () => {
      await fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'claude',
          model: '../etc/passwd\u0000',
          effort: 'extreme',
        }),
      });

      const call = mockChatSend.mock.calls.at(-1)?.[0] as any;
      expect(call.model).toBeUndefined();
      expect(call.reasoningEffort).toBeUndefined();
    });

    it('should parse mention payloads and forward sanitized values', async () => {
      await fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'claude',
          fileMentions: [
            { path: 'src/a.ts' },
            { path: '' },
            '../outside.ts',
            { nope: true },
          ],
          nodeMentions: [
            { id: 'n1', summary: 'first node', title: 'Node 1', type: 'text' },
            { id: '', summary: 'invalid' },
            { id: 'n2', summary: '' },
          ],
        }),
      });

      expect(mockChatSend).toHaveBeenCalledWith(
        expect.objectContaining({
          fileMentions: [{ path: 'src/a.ts' }, { path: '../outside.ts' }],
          nodeMentions: [{ id: 'n1', summary: 'first node', title: 'Node 1', type: 'text' }],
        }),
      );
    });

    it('should cap mention counts', async () => {
      const manyFileMentions = Array.from({ length: 20 }, (_, i) => ({ path: `f-${i}.ts` }));
      const manyNodeMentions = Array.from({ length: 50 }, (_, i) => ({ id: `n-${i}`, summary: `s-${i}` }));

      await fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'claude',
          fileMentions: manyFileMentions,
          nodeMentions: manyNodeMentions,
        }),
      });

      expect(mockChatSend).toHaveBeenCalledWith(
        expect.objectContaining({
          fileMentions: expect.arrayContaining([{ path: 'f-0.ts' }, { path: 'f-9.ts' }]),
          nodeMentions: expect.arrayContaining([{ id: 'n-0', summary: 's-0' }, { id: 'n-19', summary: 's-19' }]),
        }),
      );

      const call = mockChatSend.mock.calls.at(-1)?.[0] as any;
      expect(call.fileMentions).toHaveLength(10);
      expect(call.nodeMentions).toHaveLength(20);
    });

    it('should stream SSE response for /chat/send with progress and done', async () => {
      const response = await fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'claude',
          sessionId: 's-1',
          currentFile: 'index.tsx'
        }),
      });

      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      expect(text).toContain('event: chunk');
      expect(text).toContain('Building prompt context');
      expect(text).toContain('Running claude adapter');
      expect(text).toContain('event: done');
      expect(text).toContain('"sessionId":"s-1"');
    });

    it('should stop active session run', async () => {
      let stopped = false;
      mockChatSend.mockImplementation(async function* () {
        yield {
          type: 'tool_use',
          content: 'Building prompt context',
          metadata: { sessionId: 'active-session' },
        };
        await new Promise((resolve) => setTimeout(resolve, 30));
        if (stopped) {
          yield {
            type: 'done',
            content: '',
            metadata: {
              code: 'ABORTED',
              stopped: true,
              stopReason: 'client-stop',
              sessionId: 'active-session',
            },
          };
          return;
        }
        yield { type: 'done', content: '', metadata: { sessionId: 'active-session' } };
      });
      mockChatStop.mockImplementation(() => {
        stopped = true;
        return { stopped: true };
      });

      const sendPromise = fetch(`${baseUrl}/chat/send`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'hello',
          providerId: 'gemini',
          sessionId: 'active-session',
          currentFile: 'index.tsx'
        }),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const stopResponse = await fetch(`${baseUrl}/chat/stop`, {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'active-session' }),
      });
      const stopBody = await stopResponse.json();

      const sendResponse = await sendPromise;
      const streamText = await sendResponse.text();

      expect(stopResponse.status).toBe(200);
      expect(stopBody).toEqual({ stopped: true });
      expect(streamText).toContain('event: done');
      expect(streamText).toContain('"stopped":true');
      expect(streamText).toContain('"code":"ABORTED"');
      expect(streamText).not.toContain('event: error');
    });
  });

  describe('CORS', () => {
    it.skip('should handle OPTIONS requests', async () => {
      const response = await fetch(`${baseUrl}/render`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });
});
