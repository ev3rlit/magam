import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { renderToGraph } from '../../../core/src';

export async function execute(jsCode: string): Promise<any> {
  const id = randomUUID();
  const tempFilePath = resolve(tmpdir(), `graphwrite-exec-${id}.js`);

  try {
    // Determine the node_modules path from the CLI's dependencies
    // This ensures the executed script uses the same React/Core instances
    let modulesPath: string | undefined;
    let localDistPath: string | undefined;
    try {
      const corePath = require.resolve('@graphwrite/core');
      const splitPath = corePath.split('node_modules');
      if (splitPath.length > 1) {
        // Reconstruct path up to the last node_modules
        modulesPath =
          splitPath.slice(0, -1).join('node_modules') + 'node_modules';
      }
    } catch (e) {
      // Fallback: Check for local dist in monorepo environment
      const localPath = resolve(process.cwd(), 'dist/libs/core/index.js');
      if (existsSync(localPath)) {
        localDistPath = localPath;
      } else {
        // Fallback or ignore if not found (should not happen in prod)
        console.warn(
          'Could not resolve @graphwrite/core path for execution context injection',
        );
      }
    }

    // Inject module.paths hack or require shim to ensure dependencies are found
    let injectedCode = jsCode;

    if (modulesPath) {
      // We add the resolved node_modules to the search path of the module
      injectedCode = `module.paths.push('${modulesPath.replace(
        /\\/g,
        '/',
      )}');\n${jsCode}`;
    } else if (localDistPath) {
      // Inject require shim for local development
      // Resolve React paths to ensure they are available in the shim
      const reactPath = require.resolve('react');
      const reactJsxPath = require.resolve('react/jsx-runtime');

      const shim = `
const _originalRequire = require;
const _localCore = _originalRequire('${localDistPath.replace(/\\/g, '/')}');
const _react = _originalRequire('${reactPath.replace(/\\/g, '/')}');
const _reactJsx = _originalRequire('${reactJsxPath.replace(/\\/g, '/')}');

// Polyfill global React just in case it's needed by transpiled code
global.React = _react;

require = function(id) {
  if (id === '@graphwrite/core') return _localCore;
  if (id === 'react') return _react;
  if (id === 'react/jsx-runtime') return _reactJsx;
  return _originalRequire.apply(this, arguments);
};
Object.assign(require, _originalRequire);
`;
      injectedCode = shim + '\n' + jsCode;
    }

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
