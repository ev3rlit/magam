## Learnings (AI Integration Phase)

### 1. Worker Threads for Safety

- **Issue**: Direct `require()` or `eval()` in the main process blocks the Event Loop and crashes the server on syntax errors/infinite loops.
- **Solution**: We implemented `libs/runtime` using `worker_threads`.
- **Pattern**:
  1. Write code to temp file.
  2. Spawn Worker.
  3. Worker loads code via `require` (inside its own process).
  4. Worker executes and posts result back.
  5. Timeout (1000ms) terminates worker if stuck.

### 2. NestJS + Chokidar

- **Integration**: `RuntimeService` wraps `chokidar`.
- **Debounce**: Essential to prevent double-execution when editors save files (sometimes triggers multiple FS events).
- **Structure**: `RuntimeService` is a provider in `AppModule`, effectively running as a singleton daemon.

### 3. MCP Tool Registration

- **Library**: `@modelcontextprotocol/sdk`.
- **Validation**: Strict `path.resolve` check against `process.cwd()/workspace` is critical to prevent `../../` attacks.
- **Transport**: Currently using `StdioServerTransport` but it's instantiated inside `McpService`.
  - _Note_: If we want to use this with an external Client, we might need an SSE transport or just rely on the fact that `apps/api` IS the MCP server if run via stdio.

### 4. WebSocket Port Standardization

- **Correction**: Client was hardcoded to `3001`, API defaults to `3333` (NestJS).
- **Fix**: Aligned both to `3333`.

### 5. Frontend Error Handling

- **UX**: Instead of crashing the canvas, we catch errors in the backend (`RuntimeService`) and emit `graph-error`.
- **UI**: `ErrorOverlay` subscribes to this event and shows a non-blocking red box.
