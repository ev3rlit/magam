import { parentPort, workerData } from 'worker_threads';
import { existsSync } from 'fs';
import { setupWorkerModuleResolution } from '@magam/shared';

async function run() {
  const { filePath, modulesPath, localDistPath } = workerData;

  try {
    console.log('[Worker] Running:', filePath);
    console.log('[Worker] Exists:', existsSync(filePath));

    // Set up module resolution for this worker
    setupWorkerModuleResolution(modulesPath, localDistPath);

    // Load renderToGraph dynamically AFTER shim/path setup
    // This allows the shim to intercept it if needed, or module.paths to find it
    let renderToGraph;
    try {
      const core = require('@magam/core');
      renderToGraph = core.renderToGraph;
    } catch (e) {
      throw new Error(
        `Could not load @magam/core: ${(e as Error).message}`,
      );
    }

    // Clear cache just in case (though worker is fresh usually)
    delete require.cache[require.resolve(filePath)];

    const userModule = require(filePath);
    const defaultExport = userModule.default || userModule;

    if (typeof defaultExport !== 'function') {
      throw new Error(
        'No default export function found. Please export a default function that returns a React element.',
      );
    }

    const rootElement = defaultExport();

    if (!rootElement) {
      throw new Error('Default export function returned null or undefined.');
    }

    const graph = await renderToGraph(rootElement);
    parentPort?.postMessage({ status: 'success', data: graph });
  } catch (error) {
    parentPort?.postMessage({
      status: 'error',
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error),
    });
  }
}

run();
