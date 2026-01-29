import { writeFile, unlink } from 'fs/promises';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { renderToGraph } from '@graphwrite/core';

export async function execute(jsCode: string): Promise<any> {
  const id = randomUUID();
  const tempFilePath = resolve(tmpdir(), `graphwrite-exec-${id}.js`);

  try {
    // Determine the node_modules path from the CLI's dependencies
    // This ensures the executed script uses the same React/Core instances
    let modulesPath: string | undefined;
    try {
      const corePath = require.resolve('@graphwrite/core');
      const splitPath = corePath.split('node_modules');
      if (splitPath.length > 1) {
        // Reconstruct path up to the last node_modules
        modulesPath =
          splitPath.slice(0, -1).join('node_modules') + 'node_modules';
      }
    } catch (e) {
      // Fallback or ignore if not found (should not happen in prod)
      console.warn(
        'Could not resolve @graphwrite/core path for execution context injection',
      );
    }

    // Inject module.paths hack to ensure dependencies are found
    // We add the resolved node_modules to the search path of the module
    const injectedCode = modulesPath
      ? `module.paths.push('${modulesPath.replace(/\\/g, '/')}');\n${jsCode}`
      : jsCode;

    // 1. Write jsCode to a temporary file
    await writeFile(tempFilePath, injectedCode);

    // 2. Clear require cache for this file to ensure fresh execution
    try {
      delete require.cache[require.resolve(tempFilePath)];
    } catch (e) {
      // Ignore if not in cache
    }

    // 3. Require the temp file
    // The injected module.paths ensures it can find 'react' and '@graphwrite/core'
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
