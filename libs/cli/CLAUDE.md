# CLAUDE.md

HTTP server, transpiler, and executor for Magam. Takes user `.tsx` files, transpiles them with esbuild, executes them to produce React elements, and renders to graph AST via the core reconciler.

## Entry Point (`src/bin.ts`)

Three commands:
- **`serve [dir]`** — Starts HTTP render server only (port 3002)
- **`dev [dir]`** — Starts HTTP server + WebSocket server + file watcher
- **`init [dir]`** — Creates `.magam/` project scaffolding

On startup, calls `createCoreInterceptor()` from `@magam/shared` to set up Module._load interception for monorepo development.

## HTTP Server (`src/server/http.ts`)

Port: `MAGAM_HTTP_PORT` env var or 3002 default. CORS enabled for all origins.

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | `{ status: 'ok', targetDir }` |
| `/files` | GET | All `.tsx` files via fast-glob |
| `/file-tree` | GET | Hierarchical folder tree (directories first, alphabetic) |
| `/render` | POST | Core pipeline: `{ filePath }` → transpile → execute → graph AST |

### POST /render Flow

```
Request { filePath: 'diagram.tsx' }
  → path.resolve(targetDir, filePath)
  → Check file exists (404 if not)
  → transpile(absolutePath) → CJS string
  → execute(cjsCode) → ResultAsync<Container>
  → result.isOk() ? { graph: result.value } : { error, type, details }
```

## Transpiler (`src/core/transpiler.ts`)

esbuild config:
- `bundle: true`, `platform: 'node'`, `format: 'cjs'`, `write: false`
- **External**: `react`, `magam`, `@magam/core` — not bundled, resolved at runtime via require shim
- Returns in-memory output string (`outputFiles[0].text`)

## Executor (`src/core/executor.ts`)

Seven-step process:
1. Generate UUID temp file path in `os.tmpdir()`
2. `resolveModulePaths(cwd)` from `@magam/shared`
3. `generateRequireShim(paths)` — generates JS code that intercepts `require()` calls
4. Prepend shim to transpiled code, write to temp file
5. Clear Node require cache for the temp path
6. `require()` temp file, get default export function, call it → React element
7. `renderToGraph(element)` → graph AST. Temp file cleaned up in `finally`.

The require shim is critical — it makes `require('@magam/core')` and `require('react')` work inside temp files that aren't in the project's node_modules tree.

## WebSocket Server (`src/server/websocket.ts`)

Port: `MAGAM_WS_PORT` env var or 3001 default. Auto-discovery: tries up to 10 ports if preferred is taken.

Singleton pattern — second call to `startServer()` reuses existing instance. Provides `broadcast(msg)` to send JSON to all connected clients.

## Dev Command (`src/commands/dev.ts`)

Entry file discovery: provided arg → `overview.tsx` → `main.tsx`.

**File watching**: chokidar watches `**/*.tsx`, ignoring node_modules and .git. 100ms debounce — clears timer on each change, runs after 100ms of quiet.

**WebSocket messages**:
- `get-files` → responds with `.tsx` file list
- `switch-file` → changes entry point, re-renders
- Broadcasts: `{ type: 'graph-update', payload: graphAST }` on success, `{ type: 'error', payload: { message, type } }` on failure

## Init Command (`src/commands/init.ts`)

Creates `.magam/node_modules/magam/index.d.ts` with mock type declarations for IDE support. Creates `tsconfig.json` with path alias (only if one doesn't exist — never overwrites).

## Build

tsup: CJS + ESM + DTS. Entry: `src/index.ts`.
