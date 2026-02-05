#!/usr/bin/env bun

import { spawn, Subprocess } from 'bun';
import { resolve, join } from 'path';
import { createServer } from 'node:net';

const args = process.argv.slice(2);
const command = args[0];

let targetDir: string | undefined;
let port: string | undefined;
let debug = false;

// Port availability check helper
async function getAvailablePort(startPort: number): Promise<number> {
  const checkPort = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  };

  let currentPort = startPort;
  while (!(await checkPort(currentPort))) {
    currentPort++;
  }
  return currentPort;
}

// Wait for server to be ready
async function waitForServer(
  port: number,
  maxAttempts = 30,
  interval = 200
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Server on port ${port} did not become ready`);
}

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    port = args[i + 1];
    i++;
  } else if (args[i] === '--debug') {
    debug = true;
  } else if (!args[i].startsWith('-') && !targetDir) {
    targetDir = args[i];
  }
}

if (!targetDir) {
  console.error(
    'Error: You must specify a directory to run (e.g. "." or "./examples")'
  );
  process.exit(1);
}

if (command === 'dev') {
  const absoluteTargetDir = resolve(process.cwd(), targetDir);

  const initialPort = port ? parseInt(port, 10) : 3000;
  const nextPort = await getAvailablePort(initialPort);

  // Find available ports for both servers
  // Ensure httpPort is different from nextPort
  let httpPort = await getAvailablePort(3002);
  while (httpPort === nextPort) {
    httpPort = await getAvailablePort(httpPort + 1);
  }

  // Find available port for WebSocket server
  let wsPort = await getAvailablePort(3001);
  while (wsPort === nextPort || wsPort === httpPort) {
    wsPort = await getAvailablePort(wsPort + 1);
  }

  console.log(`🚀 Starting GraphWrite dev server...`);
  console.log(`📁 Target directory: ${absoluteTargetDir}`);
  console.log(`🔧 HTTP render server: ${httpPort}`);

  if (initialPort !== nextPort) {
    if (debug) {
      console.log(
        `⚠️  Port ${initialPort} is in use. Using available port: ${nextPort}`
      );
    } else {
      console.log(`🔌 Next.js port: ${nextPort}`);
    }
  } else {
    console.log(`🔌 Next.js port: ${nextPort}`);
  }
  console.log();

  // Start HTTP render server first
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
      GRAPHWRITE_HTTP_PORT: httpPort.toString(),
    },
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  // Wait for render server to be ready
  try {
    await waitForServer(httpPort);
    console.log(`✅ HTTP render server ready`);
  } catch (error) {
    console.error(`❌ HTTP render server failed to start`);
    renderServerProc.kill();
    process.exit(1);
  }

  // Start Next.js with render server info
  const cmd = ['bun', '--bun', 'next', 'dev'];
  cmd.push('-p', nextPort.toString());

  const nextProc = spawn({
    cmd,
    cwd: './app',
    env: {
      ...process.env,
      GRAPHWRITE_TARGET_DIR: absoluteTargetDir,
      GRAPHWRITE_HTTP_PORT: httpPort.toString(),
      NEXT_PUBLIC_GRAPHWRITE_WS_PORT: wsPort.toString(),
    },
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  // Start WebSocket server
  const wsServerProc = spawn({
    cmd: ['bun', 'run', join(process.cwd(), 'app/ws/server.ts')],
    env: {
      ...process.env,
      GRAPHWRITE_WS_PORT: wsPort.toString(),
      GRAPHWRITE_TARGET_DIR: absoluteTargetDir,
    },
    stdio: ['inherit', 'inherit', 'inherit'],
  });
  console.log(`✅ WebSocket server starting on port ${wsPort}...`);

  // Handle shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down...');
    renderServerProc.kill();
    wsServerProc.kill();
    nextProc.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  console.log('Usage: bun cli.ts dev [directory] [--port <number>]');
  console.log('');
  console.log('Commands:');
  console.log(
    '  dev [directory]  Start development server (default: ./examples)'
  );
  console.log('Options:');
  console.log('  -p, --port       Specify port to run on');
  console.log('  --debug          Show debug output');
}

