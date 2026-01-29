# Phase 1 Implementation Plan: Core Foundation

## 1. Project Structure (Nx Monorepo)

We will use **Nx** to manage the monorepo. It provides excellent tooling for NestJS and React integration.

```text
graphwrite/
├── apps/
│   ├── api/          # NestJS Server (WebSocket + MCP + Static Serve)
│   └── client/       # React + Vite + Tailwind + React Flow
├── libs/
│   └── shared/       # Shared Types (CanvasState, Commands, Events)
├── package.json
└── nx.json
```

## 2. Dependencies

### Core
-   **Nx**: Build system and monorepo management.

### Backend (apps/api)
-   **@nestjs/common, @nestjs/core**: Framework.
-   **@nestjs/websockets, @nestjs/platform-socket.io**: Real-time communication.
-   **socket.io**: WebSocket engine.
-   **@modelcontextprotocol/sdk**: MCP Server implementation.
-   **zod**: Validation (especially for MCP commands).

### Frontend (apps/client)
-   **react, react-dom**: UI Library.
-   **reactflow**: Canvas engine.
-   **zustand**: State management (Client-side sync).
-   **socket.io-client**: WebSocket client.
-   **tailwindcss**: Styling.
-   **lucide-react**: Icons.

## 3. Step-by-Step Implementation Tasks

### Step 1: Workspace Initialization
- [ ] **Init Nx Workspace**: Create an empty Nx workspace with `npm`.
- [ ] **Install Plugins**: Add `@nx/nest` and `@nx/react`.

### Step 2: Backend Setup (NestJS)
- [ ] **Generate API**: Create `apps/api` using NestJS preset.
- [ ] **Gateway Setup**: Create `CanvasGateway` (WebSocket).
- [ ] **Serve Static**: Configure `ServeStaticModule` to serve `../client/dist` (for single-process deployment).
- [ ] **MCP Module**: Create a basic `McpModule` using `stdio` transport.

### Step 3: Shared Library
- [ ] **Lib Setup**: Create `libs/shared`.
- [ ] **Type Definitions**: Define `Node`, `Edge`, `CanvasState` interfaces (mirrored from PRD).
- [ ] **Events**: Define WebSocket event constants (`CANVAS_UPDATE`, `NODE_MOVE`, etc.).

### Step 4: Frontend Setup (React)
- [ ] **Generate Client**: Create `apps/client` using React (Vite) preset.
- [ ] **Tailwind**: Configure Tailwind CSS.
- [ ] **React Flow**: Install and render an empty `<ReactFlow />` canvas.
- [ ] **Zustand**: Create `useCanvasStore` with basic actions (`addNode`, `onNodesChange`).

### Step 5: Real-time Connection
- [ ] **Backend Logic**: Implement `handleConnection` and basic state persistence (in-memory for now).
- [ ] **Frontend Logic**: Connect `socket.io-client` in `useEffect`.
- [ ] **Sync**: Implement bidirectional sync (Client Move -> Socket -> Server -> Broadcast -> Client Update).

### Step 6: Single Process Check
- [ ] **Build Script**: Create a `start:all` or similar script that builds the client and runs the server.
