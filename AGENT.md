# AGENT.md

This file is an execution guide for AI coding agents working in this repository.
It is based on current source code, not only high-level docs.

## 1) Project Snapshot

Magam is an AI-native programmatic whiteboard:
- Users write diagram code in `.tsx` files.
- The backend transpiles + executes those files.
- A custom React reconciler converts React elements to graph AST.
- The frontend renders AST as React Flow nodes/edges with client-side layout.

This repo is a Bun workspace monorepo:
- `app/`: Next.js 15 frontend (viewer)
- `libs/core/`: Graph component API + custom reconciler
- `libs/cli/`: HTTP render server, transpiler, executor
- `libs/shared/`: module-resolution shim utilities
- `libs/runtime/`: worker-thread executor variant
- `notes/`, `examples/`: diagram source files used by dev flow

## 2) How Dev Mode Works

Primary command:

```bash
bun run dev
```

Root script currently runs:

```bash
bun run build:core && bun --watch run cli.ts dev ./notes
```

`cli.ts dev` starts 3 processes and auto-picks available ports:
- HTTP render server (`libs/cli/src/bin.ts serve`) on `MAGAM_HTTP_PORT` (default 3002)
- Next.js app (`app/`) on selected `-p` (default tries 3000)
- WebSocket file-sync server (`app/ws/server.ts`) on `NEXT_PUBLIC_MAGAM_WS_PORT`/`MAGAM_WS_PORT` (default 3001)

Important env flow:
- `MAGAM_TARGET_DIR`: directory containing user `.tsx` files
- `MAGAM_HTTP_PORT`: used by Next API proxies
- `NEXT_PUBLIC_MAGAM_WS_PORT`: consumed by browser `useFileSync`

## 3) End-to-End Render Pipeline

1. User selects/edits a `.tsx` file.
2. Frontend calls `POST /api/render` (`app/app/api/render/route.ts`).
3. API route proxies to HTTP server `/render` (`libs/cli/src/server/http.ts`).
4. HTTP server:
   - resolves file path against `targetDir`
   - transpiles TSX with esbuild (`libs/cli/src/core/transpiler.ts`)
   - executes transpiled module (`libs/cli/src/core/executor.ts`)
5. Executor calls `renderToGraph` from `@magam/core`.
6. Frontend parses graph AST into React Flow nodes/edges (`app/app/page.tsx`).
7. Client layout runs in `useElkLayout` (`app/hooks/useElkLayout.ts`).
8. Canvas renders in `GraphCanvas` (`app/components/GraphCanvas.tsx`).

## 4) Core Architecture Notes

### Frontend (`app/`)
- State: Zustand store in `app/store/graph.ts`
- Canvas: React Flow with custom node/edge renderers
- Layout: multi-phase ELK + anchor resolution + sequence layout
- File explorer: `/api/file-tree` + sidebar tree UI
- File sync: JSON-RPC over WebSocket (`app/hooks/useFileSync.ts`)

Main frontend files:
- `app/app/page.tsx`: AST -> React Flow mapping + render orchestration
- `app/components/GraphCanvas.tsx`: layout timing, providers, overlay UX
- `app/hooks/useElkLayout.ts`: multi-group and anchored layout pipeline
- `app/hooks/useFileSync.ts`: WS subscribe/update protocol
- `app/ws/server.ts`: Bun WebSocket + chokidar watcher (server process)

### Core library (`libs/core/`)
- Not DOM rendering. Uses custom React reconciler to build graph tree.
- Auto behaviors in `reconciler/hostConfig.ts`:
  - nested `Edge` gets `from` injected from parent id
  - children of `graph-group` get `parentId` + `extent: 'parent'`
- Scope/ID support via `EmbedScope` and `useNodeId`
- Server-side ELK is deprecated/pass-through; layout happens client-side

### CLI server (`libs/cli/`)
- HTTP routes:
  - `POST /render`
  - `GET /files`
  - `GET /file-tree`
  - `GET /health`
- Transpile config bundles user code and keeps `react`/`@magam/core` external
- Executor injects require shim from `@magam/shared` to load modules from temp files

## 5) Commands You Will Actually Use

From repo root:

```bash
# full dev loop
bun run dev

# build all packages
bun run build

# build core only
bun run build:core

# tests
bun test
```

Package-local:

```bash
cd app && bun run dev
cd libs/core && bun run build
cd libs/cli && bun run build
cd libs/runtime && bun run build
cd libs/shared && bun run build
```

## 6) Safe Change Strategy

When changing rendering behavior:
1. Start at `app/app/page.tsx` to inspect AST mapping logic.
2. Verify corresponding component contract in `libs/core/src/components/*`.
3. Confirm reconciler side-effects in `libs/core/src/reconciler/hostConfig.ts`.
4. Check layout impact in `app/hooks/useElkLayout.ts`.

When changing execution/transpile behavior:
1. `libs/cli/src/core/transpiler.ts`
2. `libs/cli/src/core/executor.ts`
3. `libs/shared/src/lib/module-resolution.ts`
4. Validate through `POST /render` path

When changing file sync/edit behavior:
1. `app/hooks/useFileSync.ts` (client requests)
2. `app/ws/methods.ts` (RPC handlers)
3. `app/ws/filePatcher.ts` (AST patching)
4. `app/ws/server.ts` (watch + notify)

## 7) Gotchas and Reality Checks

- Some docs are aspirational/outdated; prefer source-of-truth in code paths above.
- `bun run dev` currently defaults target files to `./notes` via root script.
- Frontend API routes are proxies; core render logic is not in Next API code.
- Layout issues often come from measurement timing; `GraphCanvas` waits for node dimensions before layout.
- If editing IDs or scoping logic, re-check EmbedScope behavior and anchor resolution.

## 8) Definition of Done for Agent Changes

Before finishing:
1. Run relevant tests (`bun test` or focused package tests).
2. Run build for affected package(s).
3. Verify no obvious regressions in:
   - file list/tree loading
   - render request success path
   - auto layout visibility (no FOUC regression)
   - WebSocket sync for file changes
4. Include changed files and behavior summary in final report.

