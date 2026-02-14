# CLAUDE.md

Alternative execution engine using Node.js worker threads for process isolation. Same rendering pipeline as CLI executor but with sandboxing and timeout protection.

## How It Differs from CLI Executor

| Aspect | CLI Executor (`libs/cli`) | Runtime Executor (`libs/runtime`) |
|--------|--------------------------|----------------------------------|
| Isolation | Runs in main process | Runs in Worker thread |
| Timeout | None | 5 seconds (configurable) |
| Module resolution | require shim prepended to code | `setupWorkerModuleResolution()` in worker |
| Cleanup | Temp file deleted in finally | Temp file deleted + worker terminated |
| Error handling | Direct try/catch | Worker message protocol (success/error) |

## Executor (`src/lib/executor.ts`)

1. Transpile user code via local `transpile()` (same esbuild config as CLI)
2. Write transpiled code to temp file in `os.tmpdir()`
3. Spawn `Worker` thread pointing to `worker.ts`
4. Set up 5-second timeout — terminates worker and rejects on timeout
5. Listen for worker messages: `{ status: 'success', data }` or `{ status: 'error', error }`
6. Clean up: terminate worker + delete temp file

## Worker (`src/lib/worker.ts`)

Runs inside the Worker thread:
1. `setupWorkerModuleResolution()` from `@graphwrite/shared`
2. `require()` the temp file
3. Call default export function → React element
4. `renderToGraph(element)` → graph AST
5. `postMessage({ status: 'success', data: result })` or `postMessage({ status: 'error', error })`

## Transpiler (`src/lib/transpiler.ts`)

Identical esbuild config to CLI: `bundle: true`, `platform: 'node'`, `format: 'cjs'`, external `react`/`@graphwrite/core`.

## Build

tsup: CJS + ESM + DTS. External: esbuild.
