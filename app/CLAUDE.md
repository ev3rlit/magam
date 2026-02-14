# CLAUDE.md

Next.js 15 App Router frontend for Magam. Renders graph AST from the HTTP render server onto a ReactFlow canvas.

## Architecture

### App Router Structure
- `app/layout.tsx` — Root layout with Inter font, no providers here
- `app/page.tsx` — Main orchestrator (client component). Fetches `/api/render`, parses graph AST into ReactFlow nodes/edges
- `app/api/render/route.ts` — POST proxy to `http://localhost:3002/render` (HTTP render server)
- `app/api/files/route.ts` — GET proxy to HTTP server `/files`
- `app/api/file-tree/route.ts` — GET proxy to HTTP server `/file-tree`

API routes are thin proxies. The actual rendering logic lives in `libs/cli/`.

### State Management

Zustand store at `store/graph.ts`. Key shape:

```typescript
interface GraphState {
  nodes: Node[]; edges: Edge[];
  files: string[]; fileTree: FileTreeNode | null;
  currentFile: string | null;
  status: 'idle' | 'loading' | 'error' | 'success' | 'connected';
  error: AppError | null;
  graphId: string;              // UUID — changes trigger re-layout
  needsAutoLayout: boolean;     // true for MindMap, false for Canvas-only
  layoutType: 'tree' | 'bidirectional' | 'radial';
  mindMapGroups: MindMapGroup[];
  selectedNodeIds: string[];
}
```

`setGraph()` is the main action — sets nodes, edges, mindMapGroups, and generates a new `graphId`.

### Context Providers (nesting order matters)

```
ReactFlowProvider
  > NavigationProvider    — navigateToNode(path) for node:/ links
    > ZoomProvider        — tracks zoom level, isBubbleMode (zoom < 0.4)
      > BubbleProvider    — stores bubble label positions for semantic zoom
        > GraphCanvasContent
```

`BubbleProvider` splits into two contexts (state + actions) for render optimization.

## Rendering Data Flow

```
File selected in Sidebar
  → POST /api/render { filePath }
  → Parse RenderNode AST → ReactFlow nodes/edges
  → setGraph() in store (new graphId)
  → Wait for nodesInitialized + all nodes measured
  → ELK layout (useElkLayout) or anchor resolution
  → fitView() + set opacity visible (prevents FOUC)
```

File updates via WebSocket trigger the same cycle through `useFileSync`.

## Key Hooks

### useElkLayout (`hooks/useElkLayout.ts`)
Multi-phase layout pipeline for multiple MindMaps:
1. **Phase 1** — Internal ELK layout per MindMap group
2. **Phase 1.5** — Resolve Canvas-level anchors for non-grouped nodes
3. **Phase 2** — Global group positioning (groups as ELK metanodes)
4. **Phase 3** — Apply global position offsets to all nodes
5. **Phase 4** — Position groups anchored to Canvas nodes

Supports bidirectional layout (left/right split of children with Y-center alignment).

### useFileSync (`hooks/useFileSync.ts`)
WebSocket client using JSON-RPC 2.0 protocol on `ws://localhost:3001`.
- Methods: `file.subscribe`, `file.unsubscribe`, `node.update`
- Notifications: `file.changed`, `files.changed`
- 5000ms request timeout

### useAnchorLayout (`hooks/useAnchorLayout.ts`)
Post-ELK second pass for MindMap groups anchored to other groups. Calls `resolveGroupAnchors()`.

## Node Types

All extend `BaseNode` which handles handles (source/target) and bubble registration.

| Type | Component | Key behavior |
|------|-----------|-------------|
| `sticky` | StickyNode | Fixed 160x160, colored background |
| `shape` | ShapeNode | Rectangle/circle/triangle, supports custom EdgePorts |
| `text` | TextNode | Lightweight label |
| `markdown` | MarkdownNode | react-markdown + remark-gfm, supports `node:/` links via NavigationContext |

## Edge Type

`FloatingEdge` — default for all edges. Auto-connects to node boundaries using intersection math (no explicit handles needed). Cubic bezier paths. Labels rendered at midpoint.

## Semantic Zoom

`BUBBLE_THRESHOLD = 0.4` in `contexts/ZoomContext.tsx`. When zoom drops below 40%:
- Node content becomes too small to read
- `BubbleOverlay` renders floating labels (first line of content, truncated to 40 chars)
- Labels positioned in screen space via viewport transform
- Only nodes with `bubble={true}` participate

## Layout Utilities

- `layoutUtils.ts` — ELK runner, root node finder, bounding box calculator, bidirectional Y-bounds
- `anchorResolver.ts` — Position calculation for anchor/position/gap/align props. Supports cardinal + diagonal positions
- `globalLayoutResolver.ts` — Converts MindMap groups to metanodes for global ELK positioning

## Middleware

`middleware.ts` runs on `/api/*` routes. Adds `X-Request-ID` header (UUID) and logs requests as JSON.

## Path Aliases

- `@/*` — App root (e.g., `@/store/graph`, `@/hooks/useElkLayout`)
- `@magam/core` — Resolves to `../libs/core/src`
