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
      }
    } catch (e) {
      // Fallback for local dev
      const possiblePath = resolve(process.cwd(), 'dist/libs/core/index.js');
      if (existsSync(possiblePath)) {
        localDistPath = possiblePath;
      }
    }

    // 4. Spawn Worker
    return new Promise((resolvePromise, reject) => {
      const worker = new Worker(join(__dirname, './worker.js'), {
        workerData: {
          filePath: tempJsPath,
          modulesPath,
          localDistPath,
        },
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Execution timed out (1000ms limit)'));
      }, 1000);

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
    // Cleanup
    await Promise.all([
      unlink(tempTsxPath).catch(() => {}),
      unlink(tempJsPath).catch(() => {}),
    ]);
  }
}
