# CLAUDE.md

React component library and custom reconciler for GraphWrite. Components are NOT DOM elements — they are processed by a custom React Reconciler that builds a graph AST (tree data structure).

## Custom React Reconciler

### Data Structures (`reconciler/hostConfig.ts`)

```typescript
Container = { type: 'root', children: Instance[] }
Instance  = { type: string, props: Record<string, any>, children: Instance[] }
```

The reconciler supports mutation (`supportsMutation = true`), not persistence.

### Auto-Injection Behaviors

The reconciler automatically modifies props during tree construction:

1. **Edge `from` injection** — When an `Edge` child is appended to a parent with an `id`, the parent's id is auto-injected as `from` (if not already set). This is why `<Shape id="a"><Edge to="b" /></Shape>` works without explicit `from="a"`.

2. **Group children `parentId`/`extent`** — All children appended to a `graph-group` get `parentId` set to the group's id and `extent` set to `'parent'`. This drives ReactFlow's group containment.

## Components (13 total)

| Component | AST Type | Required Props | Notable Behavior |
|-----------|----------|---------------|-----------------|
| Canvas | Fragment | — | Just a React Fragment wrapper, produces no instance |
| Node | graph-node | id | `from` connects to parent in MindMap. Used only inside MindMap |
| MindMap | graph-mindmap | — | Container for auto-layout. `layout`: tree/bidirectional/radial. `spacing` default 50 |
| Sticky | graph-sticky | id, x, y | Throws GraphwriteError if any required prop missing |
| Shape | graph-shape | id, (x,y OR anchor) | Supports `type`: rectangle/circle/triangle |
| Text | graph-text | — | Optional id. Supports coordinate and anchor positioning |
| Edge | graph-edge | to | `from` auto-injected when nested. Both from/to scoped by useNodeId |
| Group | graph-group | — | Auto-injects parentId/extent on children |
| EdgePort | graph-port | id | Custom connection points on shapes |
| Link | graph-link | to | Internal navigation. Path normalized to start with `/` |
| Markdown | graph-markdown | children (string) | Content string, supports `variant`: default/minimal |
| Code | graph-code | children (string) | `language` prop, default 'text' |
| Table | graph-table | data (array) | Array of Record<string, any> |

## EmbedScope / useNodeId Scoping System

`EmbedScope` provides hierarchical ID namespacing to prevent collisions when reusing component trees.

```tsx
<EmbedScope id="auth">
  <Shape id="lb" />        {/* → id becomes "auth.lb" */}
  <Shape id="app" />       {/* → id becomes "auth.app" */}
</EmbedScope>
```

**useNodeId(id)** hook logic:
- No scope active → returns id unchanged
- Scope active + id has no dot → returns `${scope}.${id}`
- Id already contains dot → returned as-is (treated as cross-boundary reference)

Nested EmbedScopes chain: `parent.child.grandchild`.

Applies to: Node, MindMap, Edge (from/to), Shape, Group, Sticky, Text.
Does NOT apply to: Canvas, Table, Code, Link, Markdown, EdgePort.

## Anchor Resolution (`reconciler/resolveTreeAnchors.ts`)

Two-phase post-reconciliation pass:
1. **Collect** all node IDs into a Set
2. **Resolve** anchor props: for each node with `anchor` + `id`, extract scope from id, construct scoped candidate `${scope}.${anchor}`, use it if it exists in the ID set

This allows `anchor="app"` inside an EmbedScope to resolve to `auth.app` automatically, while cross-scope references are preserved.

## Error Handling

Two error systems:

**GraphwriteError** (`errors.ts`) — Thrown synchronously during render for validation:
- Types: `syntax`, `props`, `reference`, `structure`, `import`, `unknown`
- Has optional `suggestion` field for user-friendly tips
- Used by Shape, Sticky, Text, EdgePort for missing required props

**AppError** (`result.ts`) — neverthrow-based for async flows:
- Subclasses: `RenderError`, `LayoutError`, `BuildError`
- `renderToGraph()` returns `ResultAsync<Container, RenderError | LayoutError>`

## Layout Engine

`layout/elk.ts` is **deprecated** — it's a pass-through no-op. Layout moved to the client side (`app/hooks/useElkLayout.ts`) because server can't measure rendered DOM content (images, markdown blocks).

The rendering pipeline still calls `applyLayout()` but it just returns the graph unchanged.

## Exports (`index.ts`)

- 13 component functions (Canvas through EmbedScope)
- `useEmbedScope`, `useNodeId` hooks
- `renderToGraph` — the main reconciler entry point
- `GraphwriteError`, `AppError` and neverthrow re-exports (`Result`, `ResultAsync`, `ok`, `err`)
- `Logger` singleton

## Build

tsup: CJS + ESM + DTS. External: react, react-reconciler, elkjs (peer deps).
