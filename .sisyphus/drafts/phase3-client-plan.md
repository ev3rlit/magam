# Draft: GraphWrite Client Implementation Plan

## Core Requirements

1.  **Tech Stack**: React, React Flow, Tailwind CSS, Vite.
2.  **Layout**: Sidebar (Pages), Canvas Area (React Flow), Footer (Selection), Header (Status).
3.  **Data Flow**:
    - Connect to WebSocket (`ws://localhost:3001`).
    - Listen for `graph-update` -> Update React Flow nodes/edges.
    - Listen for `error` -> Show Error Overlay.
4.  **Interaction**: Read-only canvas (no dragging/editing), zoom/pan enabled.
5.  **Features**:
    - Copy to Clipboard (JSON/Code).
    - Page Navigation (Sidebar).

## Proposed Architecture (Phase 3)

### 1. Store Management

- Use `zustand` for client state.
- Store: `nodes`, `edges`, `status` ('synced' | 'reloading' | 'error'), `errors`, `selectedNodes`.

### 2. Implementation Steps

#### A. Setup & Dependencies

- Install `reactflow`, `lucide-react` (icons), `zustand`.
- Configure Tailwind (already there, just check).

#### B. WebSocket Client

- Create `src/hooks/useSocket.ts`.
- Handle connection, reconnection, and message parsing.
- Dispatch actions to Zustand store.

#### C. React Flow Integration

- Create `src/components/Canvas/GraphCanvas.tsx`.
- Map `graph-sticky`, `graph-shape` to Custom Nodes.
- `StickyNode`: Tailwind styled div.
- `ShapeNode`: SVG shapes.
- `GroupNode`: Sub-flow.

#### D. UI Components (Layout)

- `Sidebar`: List pages (mock for now, or get from WS initial payload if we add that).
- `Header`: Status indicator.
- `Footer`: Selection info + Copy button.
- `ErrorOverlay`: Display errors over canvas.

#### E. Copy Functionality

- `navigator.clipboard.writeText`.
- Generate JSON/JSX snippet based on selection.

## Open Questions

1.  **Page Navigation**: How does the CLI tell the client about available pages?
    - _Current CLI_: Just watches `**/*.tsx`. It doesn't send a list of files yet.
    - _Workaround_: Client just renders what it gets. Maybe add `type: 'file-list'` to WS later. For now, assume single page view or manually handled by CLI sending different graphs based on... something?
    - _Decision_: Focus on single active graph first. The CLI `dev` command watches _one_ entry point mostly. Or if it watches all, it executes one.
    - _Refinement_: The Viewer UX doc shows a "Pages" list. We need the CLI to send this list.
    - _Action_: Update CLI later? Or just mock it in client for now? Let's mock the file list for UI implementation, but the graph will be real.

2.  **Custom Nodes**: `Sticky`, `Shape` styling.
    - Need nice Tailwind classes to look like a whiteboard.

## Plan Structure

1.  **Setup**: Install dependencies.
2.  **State & Socket**: Implement Zustand + WS connection.
3.  **Canvas**: Implement React Flow with Custom Nodes (`Sticky`, `Shape`).
4.  **UI Shell**: Sidebar, Header, Footer.
5.  **Error Handling**: Error Overlay component.
6.  **Interactions**: Selection & Copy logic.
