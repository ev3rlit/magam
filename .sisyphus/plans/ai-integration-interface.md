# AI Integration & Interface Plan: Code-as-UI

## TL;DR

> **Quick Summary**: Complete the "Code-as-UI" pipeline where AI edits React files, the system safely executes them in a Worker thread, and the result is broadcast to the Canvas via WebSocket.
>
> **Deliverables**:
>
> - `libs/runtime`: Shared library for safe code execution (Executor + Transpiler).
> - `apps/api`: File Watcher Service & MCP `write_file` tool.
> - `apps/client`: Fixed WebSocket connection (port 3333) & Error Overlay.
>
> **Estimated Effort**: Medium (Infrastructure-heavy)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Shared Runtime → API Integration → Client Connection

---

## Context

### Original Request

"Code Level 조작이 핵심이야. 에이전트가 붙을 수 있는 인터페이스."
(Core is Code-Level manipulation. Build the interface for agents to attach.)

### Interview Summary

**Key Discussions**:

- **Identity**: "Code-as-UI" (Programmatic Whiteboard).
- **Control**: AI manipulates `.tsx` files directly, not JSON state.
- **Scope**: Build the plumbing (MCP/Socket/Runtime), not the Agent UI itself.

**Architecture Decisions**:

- **Shared Runtime**: Extract `executor` logic to `libs/runtime` to be used by both CLI and API.
- **Safety**: Use `Worker` threads for user code execution to prevent API freezes.
- **Hot Reload**: Use `chokidar` in API to trigger re-execution on file save.

### Metis Review

**Identified Gaps** (addressed):

- **Safety Risk**: Direct `require` in main process -> Switched to Worker Threads.
- **Connection Break**: Port mismatch (3001 vs 3333) -> Fixed in plan.
- **Tool Mismatch**: `add_node` (JSON) -> Replaced with `write_file` (Code) in MCP.

---

## Work Objectives

### Core Objective

Establish a robust "Live Loop": File Save → Watcher → Worker Execution → WebSocket → Canvas Update.

### Concrete Deliverables

- `libs/runtime`: A safe, shared library for executing React graph code.
- `apps/api/src/runtime`: Integration of the runtime with NestJS (Watcher).
- `apps/client`: A working `useSocket` hook that connects to port 3333.
- `apps/api/src/interface/mcp`: An MCP tool `write_file` for AI agents.

### Definition of Done

- [ ] `write_file` tool updates a `.tsx` file.
- [ ] Canvas automatically updates within 1 second of file save.
- [ ] Infinite loops in user code do NOT crash the API server (timeout works).
- [ ] Runtime errors display a red error overlay on the Client.

### Must Have

- **Worker Isolation**: User code must run in a separate thread.
- **Timeout**: Execution must fail after 500ms-1s.
- **Error Propagation**: Errors must be sent to the client, not just logged.

### Must NOT Have (Guardrails)

- **No Direct `eval`**: Use `vm` or `Worker` context.
- **No "Magic" State**: All state must be derived from the code.

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (Jest/Vitest)
- **User wants tests**: YES (implied by "High Quality")
- **Framework**: Vitest (for libs), Jest (for NestJS api)

### If TDD Enabled

Each TODO follows RED-GREEN-REFACTOR.

- **Worker Test**: Verify timeout works by trying to run an infinite loop.
- **Watcher Test**: Verify file change triggers event.

### Automated Verification (Zero User Intervention)

**For API/Backend changes** (using Bash curl/node):

```bash
# Verify Worker Isolation
bun -e "import { execute } from './libs/runtime'; execute('while(true){}').catch(e => console.log('Passed: ' + e.message))"
```

**For MCP Tool**:

```bash
# Verify Tool
curl -X POST http://localhost:3333/mcp -d '{"method":"tools/call","params":{"name":"write_file","args":{"path":"test.tsx","content":"..."}}}'
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation):
├── Task 1: [libs/runtime] Extract & Refactor Executor to Worker
└── Task 4: [apps/client] Fix WebSocket Connection & Types

Wave 2 (Integration):
├── Task 2: [apps/api] Implement File Watcher Service
└── Task 3: [apps/api] Implement MCP write_file Tool

Wave 3 (Polish):
└── Task 5: [apps/client] Implement Error Overlay
```

### Dependency Matrix

| Task        | Depends On | Blocks | Can Parallelize With |
| ----------- | ---------- | ------ | -------------------- |
| 1 (Runtime) | None       | 2, 3   | 4                    |
| 2 (Watcher) | 1          | None   | 3                    |
| 3 (MCP)     | 1          | None   | 2                    |
| 4 (Client)  | None       | 5      | 1                    |
| 5 (Overlay) | 4          | None   | None                 |

---

## TODOs

- [x] 1. [libs/runtime] Create Shared Runtime with Worker Isolation
     **Acceptance Criteria**:
  - [x] `nx test runtime` passes.
  - [x] Test case: "Infinite loop throws TimeoutError".
  - [x] Test case: "Valid React code returns Graph JSON".

- [x] 2. [apps/api] Implement File Watcher & Execution Service
     **Acceptance Criteria**:
  - [x] `touch workspace/test.tsx` triggers a log in API console.
  - [x] WebSocket client receives `graph-update` payload.

- [x] 3. [apps/api] Implement MCP `write_file` Tool
     **Acceptance Criteria**:
  - [x] Agent can invoke `write_file`.
  - [x] File is actually written to disk.
  - [x] **Security**: Path traversal attempts (e.g., `../sensitive.txt`) are rejected.
  - [x] Path outside workspace is rejected.

- [x] 4. [apps/client] Fix WebSocket Connection
     **Acceptance Criteria**:
  - [x] Browser console shows "Connected to WS".
  - [x] `isConnected` state turns true.

- [x] 5. [apps/client] Implement Error Overlay
     **Acceptance Criteria**:
  - [x] Mocking a `graph-error` event displays the red box.
  - [x] Mocking a `graph-update` event hides the red box.

---

## Success Criteria

### Verification Commands

```bash
# 1. Start System
nx serve api & nx serve client

# 2. Simulate AI Writing Code
curl -X POST http://localhost:3333/mcp/tool/write_file ...

# 3. Check Logs
# API should log: "File changed -> Executing -> Broadcasting"
# Client should log: "Received Graph Update"
```

### Final Checklist

- [ ] Safety: Infinite loops don't kill server.
- [ ] Latency: Update loop < 1s.
- [ ] Reliability: Auto-reconnect on socket drop.
