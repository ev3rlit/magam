# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Magam?

Magam is an AI-Native Programmatic Whiteboard. Users describe diagrams in natural language, AI writes React/TSX code using Magam components, and the system renders it on a canvas. Think "Remotion for diagrams" — code as the source of truth for visuals.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
## Monorepo Structure

Bun workspaces with four libraries under `libs/` and one app:

| Package | Path | Purpose |
|---------|------|---------|
| `@magam/core` | `libs/core/` | React component library + custom reconciler (renderToGraph) |
| `@magam/cli` | `libs/cli/` | HTTP server, transpiler (esbuild), executor |
| `@magam/shared` | `libs/shared/` | Module resolution utilities, require shims |
| `@magam/runtime` | `libs/runtime/` | Worker-based runtime execution |
| `magam-app` | `app/` | Next.js 15 frontend (ReactFlow canvas) |

Path aliases are defined in `tsconfig.base.json` — use `@magam/core`, `@magam/shared`, etc.

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

## Core Component Library (`@magam/core`)

Components users write in .tsx files: `Canvas`, `MindMap`, `Node`, `Shape`, `Sticky`, `Text`, `Edge`, `EdgePort`, `Link`, `Group`, `Markdown`, `Code`, `Table`.

These are not DOM components — they're processed by a custom React Reconciler (`libs/core/src/reconciler/hostConfig.ts`) that builds a tree data structure (graph AST), not a DOM.

## Key Patterns

- **Error handling**: Uses `neverthrow` (Result/ResultAsync monads) throughout `@magam/core`. Functions return `Result<T, E>` instead of throwing.
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
2. Import components from `@magam/core`
3. Use Tailwind class names for styling (processed as strings, not actual CSS)

```tsx
import { Canvas, MindMap, Node } from "@magam/core";
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
