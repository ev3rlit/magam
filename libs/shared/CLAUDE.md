# CLAUDE.md

Module resolution utilities shared between CLI, runtime, and user code. Solves the problem of making `require('@graphwrite/core')` and `require('react')` work inside dynamically-generated temp files.

## Core Problem

When the executor writes transpiled user code to a temp file in `os.tmpdir()`, Node's `require()` can't find `@graphwrite/core` or `react` because the temp file isn't inside the project's `node_modules` tree. This package provides two strategies to fix that.

## Key Functions

### resolveModulePaths(baseDir: string): ResolvedPaths

Determines where `@graphwrite/core` and `react` live on disk.

```typescript
interface ResolvedPaths {
  modulesPath: string;      // node_modules directory (installed mode)
  localDistPath: string;    // dist/libs/core/index.js (monorepo mode)
  reactPath: string;        // path to react module
  reactJsxPath: string;     // path to react/jsx-runtime
}
```

Resolution strategy:
1. Try `require.resolve('@graphwrite/core')` — if path contains `node_modules`, use installed mode
2. Otherwise try fallback dist paths: `${baseDir}/dist/libs/core/index.js` or `${baseDir}/../../dist/libs/core/index.js`

### generateRequireShim(paths: ResolvedPaths): string

Generates a JavaScript code string that's prepended to transpiled user code.

**Installed mode** — Just adds module search path:
```javascript
module.paths.push('${modulesPath}');
```

**Monorepo mode** — Monkey-patches require to intercept known modules:
```javascript
require = function(id) {
  if (id === '@graphwrite/core') return _localCore;
  if (id === 'react') return _react;
  if (id === 'react/jsx-runtime') return _reactJsx;
  return _originalRequire.apply(this, arguments);
};
```

Also injects `global.React` and local `const React` for JSX.

### createModuleInterceptor(moduleName, resolvePath): void

Monkey-patches `Module._load` to intercept imports of a specific module. Used at CLI startup to make `require('@graphwrite/core')` work everywhere in the process.

### createCoreInterceptor(dirname, relativePath): void

Convenience wrapper for `createModuleInterceptor` specifically for `@graphwrite/core`.

### setupWorkerModuleResolution(): void

Called inside worker threads (runtime package). Sets up module resolution for the isolated worker context.

## Build

tsup: CJS + ESM + DTS. No external dependencies beyond tslib.
