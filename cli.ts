#!/usr/bin/env bun

import { spawn } from 'bun';
import { resolve, join } from 'path';
import { createServer } from 'node:net';

const args = process.argv.slice(2);
const command = args[0];

interface WarmupConfig {
  enabled: boolean;
  strict: boolean;
  timeoutMs: number;
  retries: number;
  paths: string[];
}

const DEFAULT_WARMUP_PATHS = ['/', '/api/file-tree'];
const DEFAULT_WARMUP_TIMEOUT_MS = 30_000;
const DEFAULT_WARMUP_RETRIES = 2;
const DEFAULT_WARMUP_STARTUP_DELAY_MS = 2_500;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseInteger(value: string | undefined, fallback: number, min: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed >= min ? parsed : fallback;
}

function normalizeWarmupPaths(raw: string | undefined): string[] {
  if (!raw || raw.trim() === '') {
    return [...DEFAULT_WARMUP_PATHS];
  }

  const uniquePaths = new Set(
    raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  );

  const paths = [...uniquePaths];
  if (paths.length === 0) {
    return [...DEFAULT_WARMUP_PATHS];
  }

  for (const path of paths) {
    if (!path.startsWith('/')) {
      throw new Error(`Invalid warm-up path '${path}'. Paths must start with '/'.`);
    }
  }

  return paths;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'x-magam-warmup': '1',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function runWarmup(baseUrl: string, config: WarmupConfig): Promise<void> {
  if (!config.enabled) {
    return;
  }

  const startupDelayMs = parseInteger(
    process.env.MAGAM_WARMUP_STARTUP_DELAY_MS,
    DEFAULT_WARMUP_STARTUP_DELAY_MS,
    0,
  );

  console.log('[Warmup] enabled', {
    strict: config.strict,
    timeoutMs: config.timeoutMs,
    retries: config.retries,
    paths: config.paths,
    startupDelayMs,
  });

  if (startupDelayMs > 0) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, startupDelayMs));
  }

  const failures: Array<{ path: string; reason: string }> = [];

  for (const routePath of config.paths) {
    let succeeded = false;

    for (let attempt = 1; attempt <= config.retries + 1; attempt += 1) {
      const startedAt = performance.now();
      try {
        const response = await fetchWithTimeout(`${baseUrl}${routePath}`, config.timeoutMs);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const durationMs = performance.now() - startedAt;
        console.log(`[Warmup] success ${routePath} attempt=${attempt} durationMs=${durationMs.toFixed(1)}`);
        succeeded = true;
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Warmup] failed ${routePath} attempt=${attempt} reason=${message}`);
        if (attempt <= config.retries) {
          await new Promise((resolveRetryDelay) => setTimeout(resolveRetryDelay, 750));
        }
      }
    }

    if (!succeeded) {
      failures.push({ path: routePath, reason: 'exhausted retries' });
      if (config.strict) {
        break;
      }
    }
  }

  if (failures.length === 0) {
    console.log('[Warmup] completed');
    return;
  }

  if (config.strict) {
    throw new Error(`[Warmup] strict mode failure: ${JSON.stringify(failures)}`);
  }

  console.warn('[Warmup] completed with warnings', failures);
}

let targetDir: string | undefined;
let port: string | undefined;
let debug = false;

const warmupConfig: WarmupConfig = {
  enabled: parseBoolean(process.env.MAGAM_WARMUP, false),
  strict: parseBoolean(process.env.MAGAM_WARMUP_STRICT, false),
  timeoutMs: parseInteger(process.env.MAGAM_WARMUP_TIMEOUT_MS, DEFAULT_WARMUP_TIMEOUT_MS, 1000),
  retries: parseInteger(process.env.MAGAM_WARMUP_RETRIES, DEFAULT_WARMUP_RETRIES, 0),
  paths: normalizeWarmupPaths(process.env.MAGAM_WARMUP_PATHS),
};

async function getAvailablePort(startPort: number): Promise<number> {
  const checkPort = (port: number): Promise<boolean> => {
    return new Promise((resolvePort) => {
      const server = createServer();
      server.listen(port, () => {
        server.close(() => resolvePort(true));
      });
      server.on('error', () => resolvePort(false));
    });
  };

  let currentPort = startPort;
  while (!(await checkPort(currentPort))) {
    currentPort += 1;
  }
  return currentPort;
}

async function waitForServer(
  port: number,
  maxAttempts = 30,
  interval = 200,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, interval));
  }

  throw new Error(`Server on port ${port} did not become ready`);
}

for (let i = 1; i < args.length; i += 1) {
  const current = args[i];

  if (current === '--port' || current === '-p') {
    port = args[i + 1];
    i += 1;
    continue;
  }

  if (current === '--debug') {
    debug = true;
    continue;
  }

  if (current === '--warmup') {
    warmupConfig.enabled = true;
    continue;
  }

  if (current === '--no-warmup') {
    warmupConfig.enabled = false;
    continue;
  }

  if (current === '--warmup-strict') {
    warmupConfig.strict = true;
    continue;
  }

  if (current === '--warmup-timeout') {
    warmupConfig.timeoutMs = parseInteger(args[i + 1], warmupConfig.timeoutMs, 1000);
    i += 1;
    continue;
  }

  if (current === '--warmup-retries') {
    warmupConfig.retries = parseInteger(args[i + 1], warmupConfig.retries, 0);
    i += 1;
    continue;
  }

  if (current === '--warmup-paths') {
    warmupConfig.paths = normalizeWarmupPaths(args[i + 1]);
    i += 1;
    continue;
  }

  if (!current.startsWith('-') && !targetDir) {
    targetDir = current;
  }
}

if (!targetDir) {
  console.error('Error: You must specify a directory to run (e.g. "." or "./examples")');
  process.exit(1);
}

if (warmupConfig.timeoutMs < 1000) {
  console.error('Error: warm-up timeout must be >= 1000ms');
  process.exit(1);
}

if (warmupConfig.retries < 0) {
  console.error('Error: warm-up retries must be >= 0');
  process.exit(1);
}

if (command === 'dev') {
  const absoluteTargetDir = resolve(process.cwd(), targetDir);

  const initialPort = port ? parseInt(port, 10) : 3000;
  const nextPort = await getAvailablePort(initialPort);

  let httpPort = await getAvailablePort(3002);
  while (httpPort === nextPort) {
    httpPort = await getAvailablePort(httpPort + 1);
  }

  let wsPort = await getAvailablePort(3001);
  while (wsPort === nextPort || wsPort === httpPort) {
    wsPort = await getAvailablePort(wsPort + 1);
  }

  console.log('🚀 Starting Magam dev server...');
  console.log(`📁 Target directory: ${absoluteTargetDir}`);
  console.log(`🔧 HTTP render server: ${httpPort}`);

  if (initialPort !== nextPort) {
    if (debug) {
      console.log(`⚠️  Port ${initialPort} is in use. Using available port: ${nextPort}`);
    } else {
      console.log(`🔌 Next.js port: ${nextPort}`);
    }
  } else {
    console.log(`🔌 Next.js port: ${nextPort}`);
  }
  console.log();

  const renderServerProc = spawn({
    cmd: [
      'bun',
      'run',
      join(process.cwd(), 'libs/cli/src/bin.ts'),
      'serve',
      absoluteTargetDir,
    ],
    env: {
      ...process.env,
      MAGAM_HTTP_PORT: httpPort.toString(),
    },
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  try {
    await waitForServer(httpPort);
    console.log('✅ HTTP render server ready');
  } catch (error) {
    console.error('❌ HTTP render server failed to start');
    renderServerProc.kill();
    process.exit(1);
  }

  const nextProc = spawn({
    cmd: ['bun', '--bun', 'next', 'dev', '-p', nextPort.toString()],
    cwd: './app',
    env: {
      ...process.env,
      MAGAM_TARGET_DIR: absoluteTargetDir,
      MAGAM_HTTP_PORT: httpPort.toString(),
      NEXT_PUBLIC_MAGAM_WS_PORT: wsPort.toString(),
    },
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  const wsServerProc = spawn({
    cmd: ['bun', 'run', join(process.cwd(), 'app/ws/server.ts')],
    env: {
      ...process.env,
      MAGAM_WS_PORT: wsPort.toString(),
      MAGAM_TARGET_DIR: absoluteTargetDir,
    },
    stdio: ['inherit', 'inherit', 'inherit'],
  });
  console.log(`✅ WebSocket server starting on port ${wsPort}...`);

  const childProcesses = [renderServerProc, wsServerProc, nextProc];

  let shuttingDown = false;

  const shutdown = (exitCode = 0) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log('\n🛑 Shutting down...');
    for (const child of childProcesses) {
      child.kill();
    }
    process.exit(exitCode);
  };

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));

  try {
    await runWarmup(`http://localhost:${nextPort}`, warmupConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Warmup] aborted: ${message}`);
    shutdown(1);
  }
} else {
  console.log('Usage: bun cli.ts dev [directory] [--port <number>]');
  console.log('');
  console.log('Commands:');
  console.log('  dev [directory]  Start development server (default: ./examples)');
  console.log('Options:');
  console.log('  -p, --port             Specify port to run on');
  console.log('  --debug                Show debug output');
  console.log('  --warmup               Run warm-up requests after startup');
  console.log('  --no-warmup            Force disable warm-up requests');
  console.log('  --warmup-strict        Exit non-zero if warm-up fails');
  console.log('  --warmup-timeout <ms>  Warm-up request timeout (>=1000)');
  console.log('  --warmup-retries <n>   Warm-up retries per path');
  console.log('  --warmup-paths <csv>   Warm-up paths (e.g. "/,/api/file-tree")');
}
