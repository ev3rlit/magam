# Draft: GraphWrite CLI & Error Handling Implementation Plan

## Core Requirements

1.  **Zero Config**: CLI automatically sets up `tsconfig.json` and type definitions in `.graphwrite/`.
2.  **Error Handling**: Capture Syntax, Props, Reference, Structure, and Import errors.
3.  **State Preservation**: On error, keep the last successful state.
4.  **Integration**:
    - **CLI**: Watcher, Transpiler (esbuild), Server (WebSocket).
    - **Core**: Already implemented (needs to be consumed by CLI).
    - **Viewer**: Displays error overlay.

## Proposed Architecture (Phase 2)

### 1. Library: `@graphwrite/cli`

- **Location**: `libs/cli` (or `apps/cli`? Design doc says `packages/cli` but we are in Nx). Let's use `libs/cli` for logic and `apps/cli` for the entry point if needed, or just `libs/cli` and expose a bin. _Decision: `libs/cli` as a library, expose via `bin`._
- **Dependencies**: `esbuild`, `chokidar`, `ws`, `@graphwrite/core` (local), `express`/`fastify` (for server).

### 2. Implementation Steps

#### A. Scaffold CLI Library

- Create `libs/cli`.
- Configure `bin` entry point.

#### B. Project Setup Logic (`init` command)

- Check/Create `.graphwrite` folder.
- Copy types from `@graphwrite/core` to `.graphwrite/node_modules/graphwrite`.
- Generate `tsconfig.json` if missing.

#### C. Watcher & Transpiler

- Use `chokidar` to watch user directory.
- Use `esbuild` to transpile `.tsx` -> `.js`.
- **Error Handling Point 1**: Catch `esbuild` errors (Syntax Error).

#### D. Execution Engine (The tricky part)

- How to run the transpiled code safely?
- **Option 1**: `vm` module.
- **Option 2**: `require` with cache clearing (simpler, but risky).
- **Recommendation**: `vm` or a worker thread to isolate execution and catch runtime errors safely.
- **Error Handling Point 2**: Catch Runtime Errors (Props Error, Reference Error).
  - We need to wrap `@graphwrite/core` components with validation logic or catch errors during `renderToGraph`.

#### E. Error Store & MCP

- Implement in-memory `ErrorStore`.
- Expose via MCP server (needs `mcp-sdk`).

#### F. Server & WebSocket

- Stream `graph` or `error` events to the frontend.

## Open Questions

1.  **Execution Environment**: Should we use `vm`?
    - _Pros_: Isolation, custom context (can mock `require`).
    - _Cons_: Complexity.
    - _Alternative_: `require` + `delete require.cache`. For a prototype/MVP, `require` is acceptable but `esbuild` bundling to a single file + `vm` is more robust for "Code-as-UI".
    - _Decision_: Start with `require` for speed, upgrade to `vm` if needed.

2.  **Validation**: Where do we check for "Missing ID"?
    - _Answer_: Inside `@graphwrite/core`.
    - _Action_: We might need to enhance `libs/core` to throw descriptive errors if props are missing. Currently, it just passes props to the reconciler.
    - _Refinement_: Add validation logic to `Sticky`, `Shape` components in `libs/core`.

## Plan Structure

1.  **Enhance Core for Validation**: Update `libs/core` components to throw `PropsError`.
2.  **Build CLI Scaffold**: Setup package and entry point.
3.  **Implement Auto-Setup**: Type generation.
4.  **Implement Watcher/Transpiler**: `esbuild` integration.
5.  **Implement Execution & Error Catching**: Run the code, catch errors, update Store.
6.  **Implement Server**: Serve the viewer and WebSocket.
