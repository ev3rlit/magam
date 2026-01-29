import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';
import { transpile } from '../core/transpiler';
import { execute } from '../core/executor';
import { GraphwriteError } from '@graphwrite/core';
import { startServer, broadcast } from '../server/websocket';

export async function startDevServer(cwd: string, entryFile?: string) {
  let entryPoint = entryFile;
  if (!entryPoint) {
    if (fs.existsSync(path.join(cwd, 'overview.tsx'))) {
      entryPoint = 'overview.tsx';
    } else if (fs.existsSync(path.join(cwd, 'main.tsx'))) {
      entryPoint = 'main.tsx';
    } else {
      console.error(
        '\x1b[31mNo entry file found. Please create overview.tsx or main.tsx\x1b[0m',
      );
      return;
    }
  }

  const fullEntryPoint = path.resolve(cwd, entryPoint);
  if (!fs.existsSync(fullEntryPoint)) {
    console.error(`\x1b[31mEntry file not found: ${fullEntryPoint}\x1b[0m`);
    return;
  }

  console.log(`Starting dev server... watching ${entryPoint}`);

  startServer(3001);
  console.log('WebSocket server started on port 3001');

  let lastSuccessState: any = null;
  let errors: any[] = [];

  const run = async () => {
    try {
      console.log('Compiling...');
      const code = await transpile(fullEntryPoint);

      console.log('Executing...');
      const result = await execute(code);

      lastSuccessState = result;
      errors = [];
      console.log('\x1b[32mUpdated successfully.\x1b[0m');

      broadcast({ type: 'graph-update', payload: result });
    } catch (error: any) {
      if (error instanceof GraphwriteError) {
        console.error(
          `\x1b[31m[${error.type.toUpperCase()}] ${error.message}\x1b[0m`,
        );
        if (error.suggestion) {
          console.error(`\x1b[33mTip: ${error.suggestion}\x1b[0m`);
        }
      } else if (error instanceof Error) {
        console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
      } else {
        console.error('\x1b[31mUnknown error occurred\x1b[0m', error);
      }
      errors.push(error);

      broadcast({
        type: 'error',
        payload: {
          message: error.message || 'Unknown error',
          type: error instanceof GraphwriteError ? error.type : 'general',
        },
      });
    }
  };

  await run();

  const watcher = chokidar.watch('**/*.tsx', {
    cwd,
    ignored: ['**/node_modules/**', '**/.git/**'],
    ignoreInitial: true,
  });

  let timer: NodeJS.Timeout;
  watcher.on('all', () => {
    clearTimeout(timer);
    timer = setTimeout(run, 100);
  });
}
