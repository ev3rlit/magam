# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is GraphWrite?

GraphWrite is an AI-Native Programmatic Whiteboard. Users describe diagrams in natural language, AI writes React/TSX code using GraphWrite components, and the system renders it on a canvas. Think "Remotion for diagrams" — code as the source of truth for visuals.

## Development Commands

```bash
# Start full dev environment (HTTP render server + Next.js + WebSocket server)
bun run dev

# Build core library only
bun run build:core

# Build all packages
bun run build

# Run tests
bun test
```

The `bun run dev` command runs `cli.ts dev ./notes` which spawns three processes:
- **HTTP render server** (port 3002): Transpiles and executes .tsx files into graph AST
- **Next.js frontend** (port 3000): Canvas UI at `app/`
- **WebSocket server** (port 3001): File watching and real-time sync

## Monorepo Structure

Bun workspaces with four libraries under `libs/` and one app:

| Package | Path | Purpose |
|---------|------|---------|
| `@graphwrite/core` | `libs/core/` | React component library + custom reconciler (renderToGraph) |
| `@graphwrite/cli` | `libs/cli/` | HTTP server, transpiler (esbuild), executor |
| `@graphwrite/shared` | `libs/shared/` | Module resolution utilities, require shims |
| `@graphwrite/runtime` | `libs/runtime/` | Worker-based runtime execution |
| `graphwrite-app` | `app/` | Next.js 15 frontend (ReactFlow canvas) |

Path aliases are defined in `tsconfig.base.json` — use `@graphwrite/core`, `@graphwrite/shared`, etc.

## Rendering Pipeline

This is the core architecture to understand:

```
User .tsx file
  → esbuild transpile (libs/cli/src/core/transpiler.ts)
  → Node require() execute (libs/cli/src/core/executor.ts)
  → Call default export function → React element
  → Custom React Reconciler (libs/core/src/renderer.ts) → Graph AST
  → JSON response to client
  → ELK auto-layout on client (app/hooks/useElkLayout.ts)
  → ReactFlow renders on canvas (app/components/GraphCanvas.tsx)
```

The HTTP server at `libs/cli/src/server/http.ts` orchestrates the server-side portion. The Next.js API routes at `app/app/api/` proxy requests to this HTTP server.

## Core Component Library (`@graphwrite/core`)

Components users write in .tsx files: `Canvas`, `MindMap`, `Node`, `Shape`, `Sticky`, `Text`, `Edge`, `EdgePort`, `Link`, `Group`, `Markdown`, `Code`, `Table`.

These are not DOM components — they're processed by a custom React Reconciler (`libs/core/src/reconciler/hostConfig.ts`) that builds a tree data structure (graph AST), not a DOM.

## Key Patterns

- **Error handling**: Uses `neverthrow` (Result/ResultAsync monads) throughout `@graphwrite/core`. Functions return `Result<T, E>` instead of throwing.
- **Build**: Each lib uses `tsup` for bundling (CJS + ESM + DTS). Config files are at each lib root.
- **State management**: Zustand store at `app/store/graph.ts`.
- **Layout**: ELK engine for auto-layout. MindMap supports `direction` prop (down/right/left/up/radial). Anchor-based positioning for relative placement.
- **WebSocket sync**: `app/hooks/useFileSync.ts` watches for file changes via JSON-RPC 2.0 over WebSocket (`app/ws/rpc.ts`).

## Folder-level CLAUDE.md Files

Each major folder has its own CLAUDE.md with deeper architectural context:

| Folder | Focus |
|--------|-------|
| `app/CLAUDE.md` | Next.js frontend: state, hooks, node types, layout pipeline, semantic zoom |
| `libs/core/CLAUDE.md` | Custom reconciler, 13 components, EmbedScope scoping, anchor resolution, error handling |
| `libs/cli/CLAUDE.md` | HTTP server, transpiler, executor, WebSocket server, dev command |
| `libs/shared/CLAUDE.md` | Module resolution strategies, require shim generation |
| `libs/runtime/CLAUDE.md` | Worker-based executor with isolation and timeout |
| `examples/CLAUDE.md` | Example file format, positioning approaches, component usage patterns |

## Writing Example Files

Example .tsx files (in `examples/` or user directories) must:
1. Default-export a function returning a `<Canvas>` element
2. Import components from `@graphwrite/core`
3. Use Tailwind class names for styling (processed as strings, not actual CSS)

```tsx
import { Canvas, MindMap, Node } from "@graphwrite/core";
export default function MyDiagram() {
  return (
    <Canvas>
      <MindMap id="map" root="root" direction="right">
        <Node id="root" label="Root" />
        <Node id="child" label="Child" from="root" />
      </MindMap>
    </Canvas>
  );
}
```
