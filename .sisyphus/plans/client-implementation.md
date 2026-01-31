# Plan: Implement @graphwrite/client & UI Shell

## TL;DR

> **Quick Summary**: Build the `@graphwrite/client` web viewer using React Flow and Shadcn UI, and update `@graphwrite/cli` to support file navigation.
>
> **Deliverables**:
>
> - `@graphwrite/client` application (Vite/React)
> - Custom React Flow Nodes (`Sticky`, `Shape`, `Group`)
> - UI Shell (Sidebar, Header, Footer) with Error Overlay
> - Updated `@graphwrite/cli` with file listing and switching capabilities
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 2 Streams (Frontend vs CLI)
> **Critical Path**: CLI Update → WebSocket Protocol → Frontend Integration

---

## Context

### Architecture: Viewer-CLI Bridge

1.  **Frontend**: Connects to WS. Request `file-list`.
2.  **CLI**: Scans directory. Returns `['overview.tsx', 'main.tsx']`.
3.  **Frontend**: User clicks 'main.tsx'. Sends `switch-file`.
4.  **CLI**: Stops watcher, switches entry point, recompiles, sends `graph-update`.
5.  **Frontend**: Updates React Flow nodes/edges.

### Design Decisions

- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge` (Manual Shadcn-like implementation to avoid heavy dependency).
- **Icons**: `lucide-react`.
- **State**: `zustand` for global graph state and UI state.
- **Mock Mode**: Frontend should have a "Mock Mode" for testing without CLI.

---

## Work Objectives

### Core Objective

Deliver a polished, read-only graph viewer that feels like a professional tool.

### Concrete Deliverables

- `apps/client/src/store/graph.ts`: Zustand store.
- `apps/client/src/components/Canvas/`: React Flow setup.
- `apps/client/src/components/UI/`: Shell components.
- `libs/cli/src/commands/dev.ts`: Updated logic for file switching.

### Definition of Done

- [ ] Sidebar lists `.tsx` files from the project.
- [ ] Clicking a file loads its graph.
- [ ] Selection updates the footer.
- [ ] `Cmd+C` copies JSON.
- [ ] Error Overlay appears on syntax error.

---

## Verification Strategy

### Test Decision

- **Strategy**:
  - **Unit Tests**: Store logic, UI components (rendering).
  - **E2E**: Manual verification required for WS integration.
  - **Mock Mode**: Ensure client works with hardcoded data for development.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation):
├── Task 1: CLI Update - File Navigation Protocol
└── Task 2: Client Setup & Store Implementation

Wave 2 (Canvas & Nodes):
├── Task 3: React Flow Integration
├── Task 4: Implement Custom Nodes (Sticky, Shape)
└── Task 5: Implement Edge & Group Logic

Wave 3 (UI & Polish):
├── Task 6: UI Shell (Sidebar, Header, Footer)
└── Task 7: Error Overlay & Interactions
```

### Agent Dispatch Summary

| Wave | Tasks   | Recommended Agents                                                           |
| ---- | ------- | ---------------------------------------------------------------------------- |
| 1    | 1       | delegate_task(category="architect", load_skills=[])                          |
| 1    | 2       | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |
| 2    | 3, 4, 5 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |
| 3    | 6, 7    | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"]) |

---

## TODOs

- [ ] 1. CLI Update - File Navigation Protocol

  **What to do**:
  - Update `libs/cli/src/commands/dev.ts`.
  - Add logic to scan directory (`fast-glob`).
  - Handle WS messages:
    - `{ type: 'get-files' }` -> Respond with `{ type: 'file-list', payload: string[] }`.
    - `{ type: 'switch-file', payload: filename }` -> Update entry point, trigger run.

  **Recommended Agent Profile**:
  - **Category**: `architect`

  **Acceptance Criteria**:
  - [ ] CLI responds to `get-files`.
  - [ ] CLI switches file and broadcasts new graph.

  **Commit**: YES
  - Message: `feat(cli): add file navigation and switching protocol`

- [ ] 2. Client Setup & Store Implementation

  **What to do**:
  - Install dependencies: `reactflow`, `lucide-react`, `zustand`, `clsx`, `tailwind-merge`.
  - Create `apps/client/src/store/useGraphStore.ts`.
  - Actions: `setNodes`, `setEdges`, `setFiles`, `selectNode`, `setError`.
  - Hook up WebSocket in `apps/client/src/hooks/useSocket.ts`.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`

  **Acceptance Criteria**:
  - [ ] Store updates when WS message received.
  - [ ] Connection status tracked.

  **Commit**: YES
  - Message: `feat(client): setup store and websocket connection`

- [ ] 3. React Flow Integration

  **What to do**:
  - Create `apps/client/src/components/Canvas/GraphCanvas.tsx`.
  - Setup `<ReactFlow>` with `nodes`, `edges` from store.
  - Config: `nodesDraggable={false}`, `nodesConnectable={false}`, `zoomOnScroll={true}`.
  - Handle selection events (`onSelectionChange` -> update store).

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Acceptance Criteria**:
  - [ ] Graph renders data from store.
  - [ ] Selection works.

  **Commit**: YES
  - Message: `feat(client): integrate react flow canvas`

- [ ] 4. Implement Custom Nodes (Sticky, Shape)

  **What to do**:
  - Create `apps/client/src/components/Canvas/nodes/StickyNode.tsx`.
  - Create `apps/client/src/components/Canvas/nodes/ShapeNode.tsx`.
  - Register in `nodeTypes`.
  - Style with Tailwind to match design (shadows, rounded corners).

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Acceptance Criteria**:
  - [ ] Sticky renders with text and color.
  - [ ] Shape renders SVG shapes.

  **Commit**: YES
  - Message: `feat(client): implement custom sticky and shape nodes`

- [ ] 5. Implement Edge & Group Logic

  **What to do**:
  - Configure edge types (default bezier or straight).
  - Handle Groups (sub-flows) if needed (React Flow handles this mostly via `parentId`, just need z-index handling).

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Acceptance Criteria**:
  - [ ] Edges connect correctly.
  - [ ] Grouped nodes move together (if dragging enabled, but it's read-only so mostly just rendering).

  **Commit**: YES
  - Message: `feat(client): configure edges and grouping`

- [ ] 6. UI Shell (Sidebar, Header, Footer)

  **What to do**:
  - Create `Sidebar.tsx`: List files from store. Click -> `socket.send('switch-file')`.
  - Create `Header.tsx`: Show status (Synced/Error).
  - Create `Footer.tsx`: Show selected node count.
  - Layout: Flex/Grid layout matching the ASCII art.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Acceptance Criteria**:
  - [ ] Layout matches UX doc.
  - [ ] File switching works.

  **Commit**: YES
  - Message: `feat(client): implement ui shell`

- [ ] 7. Error Overlay & Interactions

  **What to do**:
  - Create `ErrorOverlay.tsx`: Absolute positioned, red background/border.
  - Show error message from store.
  - Implement Copy (Cmd+C) listener in `GraphCanvas`.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Acceptance Criteria**:
  - [ ] Error shows on top of canvas.
  - [ ] Copy puts JSON in clipboard.

  **Commit**: YES
  - Message: `feat(client): add error overlay and copy interaction`

---

## Success Criteria

### Final Checklist

- [ ] Viewer connects to CLI.
- [ ] Can navigate between `.tsx` files.
- [ ] Graph renders correctly.
- [ ] Error state is visible.
