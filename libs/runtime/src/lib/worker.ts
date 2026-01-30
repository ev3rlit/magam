import { parentPort, workerData } from 'worker_threads';
import { renderToGraph } from '@graphwrite/core';
import { existsSync } from 'fs';
import { resolve } from 'path';

// If running in ts-node/register, we might need to handle imports carefully.
// But this worker runs in a separate process.

async function run() {
  const { filePath, modulesPath, localDistPath } = workerData;

  try {
    console.log('[Worker] Starting execution for:', filePath);
    console.log('[Worker] File exists?', existsSync(filePath));

    // Inject module.paths hack or require shim to ensure dependencies are found
    if (modulesPath) {
      // We add the resolved node_modules to the search path of the module
      module.paths.push(modulesPath);
    } else if (localDistPath) {
      // Inject require shim for local development
      const reactPath = require.resolve('react');
      const reactJsxPath = require.resolve('react/jsx-runtime');

      const _originalRequire = require;

      // We can't easily overwrite global require in strict mode/ESM sometimes,
      // but in CJS worker it should work.
      // However, modifying the prototype or strict mocking is better.
      // For now, let's use the same shim logic but adapted for this context.

      // Actually, since we are in the worker, we can pre-load these.
      const _localCore = require(localDistPath);
      const _react = require(reactPath);
      const _reactJsx = require(reactJsxPath);

      (global as any).React = _react;

      // We need to intercept require calls from the user module
      const Module = require('module');
      const originalLoad = Module._load;

      Module._load = function (request: string, parent: any, isMain: boolean) {
        if (request === '@graphwrite/core') return _localCore;
        if (request === 'react') return _react;
        if (request === 'react/jsx-runtime') return _reactJsx;
        return originalLoad(request, parent, isMain);
      };
    }

    // Clear cache just in case (though worker is fresh usually)
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
