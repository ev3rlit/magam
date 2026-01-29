# Plan: Implement @graphwrite/cli & Error Handling

## TL;DR

> **Quick Summary**: Build the `@graphwrite/cli` to watch `.tsx` files, transpile them (esbuild), execute them with `@graphwrite/core`, and stream the results/errors via WebSocket.
>
> **Deliverables**:
>
> - `@graphwrite/cli` package (executable)
> - Enhanced `@graphwrite/core` with validation logic
> - `init` command for Zero Config setup
> - `dev` command for Watcher/Server loop
> - Robust `GraphwriteError` system
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 Waves
> **Critical Path**: Core Error Refactor → CLI Execution Engine → Watcher Loop

---

## Context

### Architecture: The "Code-to-Graph" Loop

1.  **Input**: User edits `main.tsx`.
2.  **Watch**: `chokidar` detects change.
3.  **Transpile**: `esbuild` converts to CommonJS (bundling dependencies).
4.  **Execute**: Node `require()` loads the bundle (cache cleared).
5.  **Render**: `renderToGraph` executes the default export.
6.  **Catch**: Errors (Compile, Runtime, Validation) are caught.
7.  **Stream**: Success JSON or Error Info sent to WebSocket clients.

### Design Decisions

- **Execution**: `require` + `delete require.cache` (MVP).
- **Validation**: Runtime checks in `libs/core` components (e.g., `if (!x) throw new GraphwriteError(...)`).
- **Entry Point**: Convention is `export default function() { return <Canvas>...`.
- **Isolation**: `esbuild` bundles user code to isolate it from system `node_modules` issues, but aliases `react` to the CLI's instance to avoid hooks errors.

---

## Work Objectives

### Core Objective

Enable a "Zero Config" experience where users just write `.tsx` and see the result, with clear error messages if they mess up.

### Concrete Deliverables

- `libs/core/src/errors.ts`: Shared error types.
- `libs/cli/src/bin.ts`: Executable entry point.
- `libs/cli/src/commands/init.ts`: Project setup.
- `libs/cli/src/commands/dev.ts`: The main loop.
- `libs/cli/src/server/websocket.ts`: Communication layer.

### Definition of Done

- [ ] `graphwrite init` creates `tsconfig.json` and types.
- [ ] `graphwrite dev` starts server and watcher.
- [ ] Changing a file updates the graph.
- [ ] Syntax error -> CLI shows error, Viewer shows error.
- [ ] Missing prop error -> CLI shows error, Viewer shows error.

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (Nx).
- **Strategy**:
  - **Unit Tests**: For error classes, validation logic, and server logic.
  - **Integration Tests**: Simulate CLI execution flow (mock file system).
  - **Manual QA**: Required for the actual "watch -> update" loop experience.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Core Enhancement):
├── Task 1: Refactor Core for Error Propagation
└── Task 2: Implement Runtime Validation in Core Components

Wave 2 (CLI Foundation):
├── Task 3: Scaffold CLI & Implement Init Command
├── Task 4: Implement Transpiler (esbuild)
└── Task 5: Implement Execution Engine (require harness)

Wave 3 (Integration):
├── Task 6: Implement Watcher & Main Loop
└── Task 7: Implement WebSocket Server
```

### Agent Dispatch Summary

| Wave | Tasks   | Recommended Agents                                                              |
| ---- | ------- | ------------------------------------------------------------------------------- |
| 1    | 1, 2    | delegate_task(category="executor", load_skills=["vercel-react-best-practices"]) |
| 2    | 3, 4, 5 | delegate_task(category="architect", load_skills=[])                             |
| 3    | 6, 7    | delegate_task(category="executor", load_skills=[])                              |

---

## TODOs

- [x] 1. Refactor Core for Error Propagation

  **What to do**:
  - Create `libs/core/src/errors.ts` defining `GraphwriteError`.
  - Update `renderToGraph` in `libs/core/src/renderer.ts`:
    - Accept `onError` callback or return Promise that rejects.
    - Currently it swallows errors (`console.error`). Change to propagate.

  **Recommended Agent Profile**:
  - **Category**: `executor`

  **Acceptance Criteria**:
  - [ ] `renderToGraph` throws/rejects if reconciler fails.
  - [ ] Error types are exported.

  **Commit**: YES
  - Message: `refactor(core): implement error propagation and types`

- [x] 2. Implement Runtime Validation in Core Components

  **What to do**:
  - Update `Sticky`, `Shape`, `Text` in `libs/core/src/components/`.
  - Add checks: e.g., `if (props.x === undefined) throw new GraphwriteError('Missing x')`.
  - Ensure these checks run _during render_.

  **Recommended Agent Profile**:
  - **Category**: `executor`

  **Acceptance Criteria**:
  - [ ] Test: Rendering `<Sticky />` without props throws validation error.

  **Commit**: YES
  - Message: `feat(core): add runtime prop validation`

- [x] 3. Scaffold CLI & Implement Init Command

  **What to do**:
  - Create `libs/cli` library.
  - Implement `libs/cli/src/commands/init.ts`.
  - Logic: Check `.graphwrite`, copy `d.ts` from `libs/core` (how to locate? maybe copy during build?), write `tsconfig.json`.

  **Recommended Agent Profile**:
  - **Category**: `architect`

  **Acceptance Criteria**:
  - [ ] `init` creates correct files.
  - [ ] Test mocks fs and verifies writes.

  **Commit**: YES
  - Message: `feat(cli): scaffold library and init command`

- [x] 4. Implement Transpiler (esbuild)

  **What to do**:
  - Create `libs/cli/src/core/transpiler.ts`.
  - Function `transpile(entryPoint: string): Promise<string>`.
  - Config: `bundle: true`, `platform: 'node'`, `external: ['react', '@graphwrite/core']`.

  **Recommended Agent Profile**:
  - **Category**: `architect`

  **Acceptance Criteria**:
  - [ ] Test: Transpiles a simple TSX string to JS.

  **Commit**: YES
  - Message: `feat(cli): implement esbuild transpiler`

- [x] 5. Implement Execution Engine

  **What to do**:
  - Create `libs/cli/src/core/executor.ts`.
  - Function `execute(jsCode: string): Promise<GraphJSON>`.
  - Logic: Write JS to temp file -> `require(temp)` -> find default export -> call `renderToGraph` -> return result.
  - Handle `delete require.cache`.

  **Recommended Agent Profile**:
  - **Category**: `architect`

  **Acceptance Criteria**:
  - [ ] Test: Executes a dummy JS string and returns graph JSON.
  - [ ] Catches errors from the executed code.

  **Commit**: YES
  - Message: `feat(cli): implement execution engine`

- [x] 6. Implement Watcher & Main Loop

  **What to do**:
  - Create `libs/cli/src/commands/dev.ts`.
  - Use `chokidar` to watch `**/*.tsx`.
  - On change: Transpile -> Execute -> Broadcast.
  - Handle "State Preservation" (if error, keep old state).

  **Recommended Agent Profile**:
  - **Category**: `executor`

  **Acceptance Criteria**:
  - [ ] Test: integration test (mocking watcher events).

  **Commit**: YES
  - Message: `feat(cli): implement dev command and watch loop`

- [x] 7. Implement WebSocket Server

  **What to do**:
  - Create `libs/cli/src/server/websocket.ts`.
  - Use `ws` or `socket.io`.
  - Broadcast `graph-update` or `error` events.

  **Recommended Agent Profile**:
  - **Category**: `executor`

  **Acceptance Criteria**:
  - [ ] Test: Client can connect and receive messages.

  **Commit**: YES
  - Message: `feat(cli): implement websocket server`

---

## Success Criteria

### Final Checklist

- [x] `graphwrite dev` works on a sample project.
- [x] Errors are caught and displayed in CLI (not crashing).
- [x] Validation in Core prevents bad graphs.
