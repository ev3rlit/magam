import { writeFile, unlink } from 'fs/promises';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { renderToGraph } from '@magam/core';
import { resolveModulePaths, generateRequireShim } from '@magam/shared';

export async function execute(jsCode: string): Promise<any> {
  const id = randomUUID();
  const tempFilePath = resolve(tmpdir(), `magam-exec-${id}.js`);

  try {
    // Resolve module paths for dependencies
    const paths = resolveModulePaths(process.cwd());

    // Generate and inject require shim for module resolution
    const shim = generateRequireShim(paths);
    const injectedCode = shim + jsCode;

    // 1. Write jsCode to a temporary file
    await writeFile(tempFilePath, injectedCode);

    // 2. Clear require cache for this file to ensure fresh execution
    try {
      delete require.cache[require.resolve(tempFilePath)];
    } catch (e) {
      // Ignore if not in cache
    }

    // 3. Require the temp file
    // The injected module.paths ensures it can find 'react' and '@magam/core'
    const userModule = require(tempFilePath);

    // 4. Get default export
    const defaultExport = userModule.default || userModule;

    if (typeof defaultExport !== 'function') {
      throw new Error(
        'No default export function found. Please export a default function that returns a React element.',
      );
    }

    // 5. Call default export to get the root element
    const rootElement = defaultExport();

    if (!rootElement) {
      throw new Error('Default export function returned null or undefined.');
    }

    // 6. Render to graph
    return await renderToGraph(rootElement);
  } finally {
    // 7. Clean up
    try {
      await unlink(tempFilePath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
