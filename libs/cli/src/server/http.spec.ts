import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure mocks are available for module factory
const { mockGlob, mockTranspile, mockExecute, mockExistsSync, mockReadFileSync } = vi.hoisted(() => {
  return {
    mockGlob: vi.fn(),
    mockTranspile: vi.fn(),
    mockExecute: vi.fn(),
    mockExistsSync: vi.fn(),
    mockReadFileSync: vi.fn(),
  };
});

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

// Import after mocks
import { startHttpServer, HttpServerResult } from './http';
import * as fs from 'fs';

describe('HTTP Render Server', () => {
  let serverResult: HttpServerResult;
  const targetDir = '/tmp/test';
  const port = 4001; // Use different port to avoid conflicts

  beforeEach(async () => {
    vi.clearAllMocks();
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
      mockExecute.mockResolvedValue({ graph: {} } as any);

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

  describe('CORS', () => {
    it('should handle OPTIONS requests', async () => {
      const response = await fetch(`${baseUrl}/render`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });
});
