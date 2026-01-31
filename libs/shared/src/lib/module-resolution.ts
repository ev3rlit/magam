import { resolve, join } from 'path';
import { existsSync } from 'fs';

/**
 * Resolved module paths for GraphWrite dependencies
 */
export interface ResolvedPaths {
  /** Path to node_modules directory (when installed as package) */
  modulesPath?: string;
  /** Path to local dist folder (for monorepo development) */
  localDistPath?: string;
  /** Path to react module */
  reactPath?: string;
  /** Path to react/jsx-runtime module */
  reactJsxPath?: string;
}

/**
 * Module map for interceptor - maps module names to their resolved exports
 */
export type ModuleMap = Record<string, unknown>;

/**
 * Resolves module paths for @graphwrite/core and React dependencies.
 * Handles both installed package and monorepo development scenarios.
 *
 * @param baseDir - Base directory for resolution (usually process.cwd())
 * @returns Resolved paths for core dependencies
 */
export function resolveModulePaths(baseDir: string): ResolvedPaths {
  const result: ResolvedPaths = {};

  // Try to resolve @graphwrite/core path
  try {
    const corePath = require.resolve('@graphwrite/core');
    const splitPath = corePath.split('node_modules');

    if (splitPath.length > 1) {
      // Installed as package - use node_modules path
      result.modulesPath =
        splitPath.slice(0, -1).join('node_modules') + 'node_modules';
    } else {
      // Resolved to source, need fallback to dist
      throw new Error('Resolved to source, forcing fallback to dist');
    }
  } catch {
    // Fallback: Check for local dist in monorepo environment
    const pathsToTry = [
      resolve(baseDir, 'dist/libs/core/index.js'),
      resolve(baseDir, '../../dist/libs/core/index.js'),
    ];

    for (const p of pathsToTry) {
      if (existsSync(p)) {
        result.localDistPath = p;
        break;
      }
    }

    if (!result.localDistPath) {
      console.warn(
        'Could not resolve @graphwrite/core path for execution context injection'
      );
    }
  }

  // Resolve React paths when using local dist
  if (result.localDistPath) {
    try {
      result.reactPath = require.resolve('react');
      result.reactJsxPath = require.resolve('react/jsx-runtime');
    } catch {
      console.warn('Could not resolve react paths');
    }
  }

  return result;
}

/**
 * Creates a Module._load interceptor for injecting custom module resolutions.
 * This is useful for ensuring consistent module instances across worker threads.
 *
 * @param moduleMap - Map of module names to their resolved exports
 * @returns Cleanup function to restore original Module._load
 */
export function createModuleInterceptor(
  moduleMap: ModuleMap
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Module = require('module');
  const originalLoad = Module._load;

  Module._load = function (
    request: string,
    parent: unknown,
    isMain: boolean
  ): unknown {
    if (request in moduleMap) {
      return moduleMap[request];
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  // Return cleanup function
  return () => {
    Module._load = originalLoad;
  };
}

/**
 * Creates a Module._load interceptor that resolves @graphwrite/core
 * from a local dist path relative to the executing script.
 *
 * @param scriptDir - __dirname of the executing script
 * @param coreRelativePath - Relative path from script to core (e.g., '../../core')
 * @returns Cleanup function to restore original Module._load
 */
export function createCoreInterceptor(
  scriptDir: string,
  coreRelativePath = '../../core'
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Module = require('module');
  const fs = require('fs');
  const path = require('path');

  const originalLoad = Module._load;
  const potentialLocalPath = path.resolve(scriptDir, coreRelativePath);
  const hasLocalCore = fs.existsSync(path.join(potentialLocalPath, 'index.js'));

  if (!hasLocalCore) {
    // No local core found, no-op interceptor
    return () => {};
  }

  Module._load = function (
    request: string,
    parent: unknown,
    isMain: boolean
  ): unknown {
    if (request === '@graphwrite/core') {
      return require(potentialLocalPath);
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  return () => {
    Module._load = originalLoad;
  };
}

/**
 * Generates a require shim code string for injection into executed code.
 * This is used when executing user code that needs access to GraphWrite dependencies.
 *
 * @param paths - Resolved module paths
 * @returns JavaScript code string that sets up require shim
 */
export function generateRequireShim(paths: ResolvedPaths): string {
  if (paths.modulesPath) {
    // When installed as package, just add to module.paths
    return `module.paths.push('${paths.modulesPath.replace(/\\/g, '/')}');\n`;
  }

  if (paths.localDistPath && paths.reactPath && paths.reactJsxPath) {
    // For local development, inject full require shim
    return `
const _originalRequire = require;
const _localCore = _originalRequire('${paths.localDistPath.replace(/\\/g, '/')}');
const _react = _originalRequire('${paths.reactPath.replace(/\\/g, '/')}');
const _reactJsx = _originalRequire('${paths.reactJsxPath.replace(/\\/g, '/')}');

// Polyfill global React just in case it's needed by transpiled code
global.React = _react;

require = function(id) {
  if (id === '@graphwrite/core') return _localCore;
  if (id === 'react') return _react;
  if (id === 'react/jsx-runtime') return _reactJsx;
  return _originalRequire.apply(this, arguments);
};
Object.assign(require, _originalRequire);

// Also inject React into the module scope
const React = _react;
`;
  }

  return '';
}

/**
 * Sets up module resolution for a worker thread context.
 * Call this at the start of a worker to ensure dependencies are resolved correctly.
 *
 * @param modulesPath - Path to node_modules (if available)
 * @param localDistPath - Path to local dist (for monorepo dev)
 * @returns Cleanup function to restore original module loading
 */
export function setupWorkerModuleResolution(
  modulesPath?: string,
  localDistPath?: string
): () => void {
  if (modulesPath) {
    // Add to module search paths
    module.paths.push(modulesPath);
    return () => {
      const idx = module.paths.indexOf(modulesPath);
      if (idx !== -1) module.paths.splice(idx, 1);
    };
  }

  if (localDistPath) {
    // Load modules and create interceptor
    const reactPath = require.resolve('react');
    const reactJsxPath = require.resolve('react/jsx-runtime');

    const _localCore = require(localDistPath);
    const _react = require(reactPath);
    const _reactJsx = require(reactJsxPath);

    // Set global React
    (global as Record<string, unknown>)['React'] = _react;

    // Create module interceptor
    return createModuleInterceptor({
      '@graphwrite/core': _localCore,
      react: _react,
      'react/jsx-runtime': _reactJsx,
    });
  }

  return () => {};
}
