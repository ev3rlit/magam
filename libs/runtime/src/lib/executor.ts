import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { Worker } from 'worker_threads';
import { transpile } from './transpiler';

export async function execute(jsCode: string): Promise<any> {
  const id = randomUUID();
  const tempTsxPath = resolve(tmpdir(), `graphwrite-exec-${id}.tsx`);
  const tempJsPath = resolve(tmpdir(), `graphwrite-exec-${id}.js`);

  try {
    // 1. Write raw code to temp file
    await writeFile(tempTsxPath, jsCode);

    // 2. Transpile
    const transpiledCode = await transpile(tempTsxPath);
    await writeFile(tempJsPath, transpiledCode);

    // 3. Resolve paths for injection
    let modulesPath: string | undefined;
    let localDistPath: string | undefined;

    try {
      const corePath = require.resolve('@graphwrite/core');
      const splitPath = corePath.split('node_modules');
      if (splitPath.length > 1) {
        modulesPath =
          splitPath.slice(0, -1).join('node_modules') + 'node_modules';
      } else {
        throw new Error('Resolved to source, forcing fallback to dist');
      }
    } catch (e) {
      // Fallback for local dev
      console.log('Executor CWD:', process.cwd());
      const pathsToTry = [
        resolve(process.cwd(), 'dist/libs/core/index.js'),
        resolve(process.cwd(), '../../dist/libs/core/index.js'),
      ];

      for (const p of pathsToTry) {
        console.log('Trying path:', p, 'Exists:', existsSync(p));
        if (existsSync(p)) {
          localDistPath = p;
          break;
        }
      }
    }

    // 4. Resolve Worker Path
    let workerPath: string;
    try {
      // Try to resolve relative to current file (handles .ts in dev, .js in prod if co-located)
      workerPath = require.resolve('./worker');
    } catch (e) {
      // Fallback to expecting compiled js side-by-side
      workerPath = join(__dirname, 'worker.js');
    }

    const isTs = workerPath.endsWith('.ts');

    console.log('Executor: Spawning worker with file:', tempJsPath);
    console.log('Executor: File exists?', existsSync(tempJsPath));

    // 5. Spawn Worker
    return new Promise((resolvePromise, reject) => {
      const worker = new Worker(workerPath, {
        workerData: {
          filePath: tempJsPath,
          modulesPath,
          localDistPath,
        },
        // If in TS environment (dev/test), try to use ts-node to run the worker
        execArgv: isTs
          ? ['-r', 'ts-node/register', '-r', 'tsconfig-paths/register']
          : undefined,
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Execution timed out (5000ms limit)'));
      }, 5000);

      worker.on('message', (message) => {
        clearTimeout(timeout);
        if (message.status === 'success') {
          resolvePromise(message.data);
        } else {
          reject(new Error(message.error?.message || 'Unknown worker error'));
        }
        worker.terminate();
      });

      worker.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
        worker.terminate();
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          clearTimeout(timeout);
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  } finally {
    // Cleanup temp files asynchronously
    setImmediate(async () => {
      await Promise.all([
        unlink(tempTsxPath).catch((err: NodeJS.ErrnoException) => {
          if (err.code !== 'ENOENT') console.warn(`Cleanup failed: ${err.message}`);
        }),
        unlink(tempJsPath).catch((err: NodeJS.ErrnoException) => {
          if (err.code !== 'ENOENT') console.warn(`Cleanup failed: ${err.message}`);
        }),
      ]);
    });
  }
}
