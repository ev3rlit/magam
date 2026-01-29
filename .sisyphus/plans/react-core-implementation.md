# Plan: Implement @graphwrite/core (React Core)

## TL;DR

> **Quick Summary**: Create the `@graphwrite/core` library using `react-reconciler` to generate graph data (JSON) from React components on the server-side.
>
> **Deliverables**:
>
> - `@graphwrite/core` package (published library)
> - Custom React Reconciler (JSX -> Node/Edge Object Tree)
> - Async Layout Engine (elkjs integration)
> - Core Components: `Canvas`, `Sticky`, `Shape`, `Text`, `Edge`, `MindMap`, `Node`
>
> **Estimated Effort**: Large (Complex Architecture)
> **Parallel Execution**: YES - 3 Waves
> **Critical Path**: Reconciler Config → Base Components → Async Layout Pipeline

---

## Context

### Architecture: Two-Pass Rendering

To handle synchronous React rendering and asynchronous `elkjs` layout:

1.  **Pass 1 (Sync)**: `react-reconciler` converts the React Component Tree into a "Logical Scene Graph" (plain JavaScript objects).
2.  **Pass 2 (Async)**: The `render()` entry point awaits the logical graph, passes it to `elkjs` for layout (if needed), and returns the final `GraphJSON`.

### Design Decisions

- **Execution**: Server-Side Node.js (Headless).
- **Effects**: `useEffect`/`useLayoutEffect` are **NOT** supported (pure generation).
- **Layout**: `elkjs` (Promise-based).
- **Testing**: TDD (Jest/Vitest) is mandatory for the reconciler.

---

## Work Objectives

### Core Objective

Build a headless React renderer that outputs a JSON structure compatible with React Flow, supporting automatic layout.

### Concrete Deliverables

- `libs/core/src/reconciler/hostConfig.ts`: The Reconciler implementation.
- `libs/core/src/renderer.ts`: The async entry point (`renderToGraph`).
- `libs/core/src/components/*`: Typed React components.
- `libs/core/src/layout/elk.ts`: ELK integration.

### Definition of Done

- [ ] `nx test core` passes (100% coverage for reconciler).
- [ ] `renderToGraph(<Canvas><Sticky /></Canvas>)` returns valid JSON with coordinates.

### Must Have

- Type-safe Components.
- Valid JSON output matching React Flow schema.
- Automatic layout for `MindMap` container.

### Must NOT Have

- DOM dependencies (window, document).
- Client-side rendering logic in `core` (it is a data generator).

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (Nx Monorepo).
- **User wants tests**: YES (TDD).
- **Framework**: Vitest (default for Nx React) or Jest.

### TDD Workflow (RED-GREEN-REFACTOR)

1.  **RED**: Write a test case in `libs/core/src/__tests__/*.spec.ts` expecting a specific JSON output.
2.  **GREEN**: Implement the minimal Reconciler/Component logic to pass.
3.  **REFACTOR**: Clean up Host Config and types.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation):
├── Task 1: Initialize Library & Deps
└── Task 2: Reconciler Host Config Skeleton

Wave 2 (Implementation):
├── Task 3: Base Components (Sticky, Shape, Text)
├── Task 4: Edge Implementation (Child & Standalone)
└── Task 5: Group Component

Wave 3 (Advanced):
├── Task 6: Async Layout Pipeline (elkjs)
└── Task 7: MindMap & Node Components
```

### Agent Dispatch Summary

| Wave | Tasks   | Recommended Agents                                                               |
| ---- | ------- | -------------------------------------------------------------------------------- |
| 1    | 1, 2    | delegate_task(category="architect", load_skills=["vercel-react-best-practices"]) |
| 2    | 3, 4, 5 | delegate_task(category="executor", load_skills=[])                               |
| 3    | 6, 7    | delegate_task(category="ultrabrain", load_skills=[])                             |

---

## TODOs

- [x] 1. Initialize @graphwrite/core Library

  **What to do**:
  - Generate new Nx library `libs/core`.
  - Install dependencies: `react-reconciler`, `elkjs`.
  - Install devDependencies: `@types/react-reconciler`, `@types/elkjs`.
  - Configure `tsup` or `vite` for building the library.

  **Recommended Agent Profile**:
  - **Category**: `architect`
  - **Skills**: `vercel-react-best-practices`

  **Acceptance Criteria**:
  - [ ] `libs/core/package.json` contains `react-reconciler` and `elkjs`
  - [ ] `nx test core` runs (even if empty)

  **Commit**: YES
  - Message: `feat(core): initialize library and dependencies`

- [x] 2. Implement Reconciler Host Config (TDD)

  **What to do**:
  - Create `libs/core/src/reconciler/hostConfig.ts`.
  - Implement basic methods: `createInstance`, `appendInitialChild`, `finalizeInitialChildren`, `getRootHostContext`, `getChildHostContext`, `prepareUpdate`, `commitUpdate`.
  - The "Host Instance" should be a plain JS object: `{ type: string, props: any, children: [] }`.
  - Export `render` function in `libs/core/src/renderer.ts`.

  **Recommended Agent Profile**:
  - **Category**: `architect`
  - **Skills**: `vercel-react-best-practices`

  **Acceptance Criteria**:
  - [ ] Test `libs/core/src/__tests__/renderer.spec.tsx`:
    ```typescript
    test('renders simple tree to JSON', async () => {
      const result = await renderToGraph(
        <canvas>
          <sticky id="1" />
        </canvas>
      )
      expect(result.nodes).toHaveLength(1)
      expect(result.nodes[0].id).toBe("1")
    })
    ```
  - [ ] `nx test core` passes

  **Commit**: YES
  - Message: `feat(core): implement basic react-reconciler host config`

- [x] 3. Implement Base Components (Sticky, Shape, Text)

  **What to do**:
  - Create typed components in `libs/core/src/components/`.
  - `Sticky`, `Shape`, `Text` should return valid JSX elements (that the reconciler recognizes).
  - Use `string` tags for host components (e.g., `'graph-sticky'`, `'graph-shape'`) to distinguish them in the reconciler.

  **Recommended Agent Profile**:
  - **Category**: `executor`

  **Acceptance Criteria**:
  - [ ] Test verifies correct `type` property in JSON output for each component.
  - [ ] `Sticky` outputs `{ type: 'sticky', ... }`
  - [ ] `Shape` outputs `{ type: 'shape', ... }`

  **Commit**: YES
  - Message: `feat(core): add Sticky, Shape, Text components`

- [x] 4. Implement Edge Component (TDD)

  **What to do**:
  - Support two modes:
    1. **Standalone**: `<Edge from="a" to="b" />` -> Output `{ id, source: 'a', target: 'b' }`.
    2. **Child**: `<Sticky id="a"><Edge to="b" /></Sticky>` -> Output `{ id, source: 'a', target: 'b' }`.
  - Reconciler must handle `appendInitialChild` to inject `parentId` into Edge instances when nested.

  **Recommended Agent Profile**:
  - **Category**: `executor`

  **Acceptance Criteria**:
  - [ ] Test verifies `source` is inferred correctly when nested.
  - [ ] Test verifies `from` is required when standalone.

  **Commit**: YES
  - Message: `feat(core): implement Edge component with implicit source`

- [x] 5. Implement Group Component

  **What to do**:
  - `<Group id="g" x={10} y={10}>...</Group>`.
  - Reconciler needs to handle relative coordinates.
  - Output should reflect parent-child relationship in React Flow (using `parentId` field in node object).

  **Recommended Agent Profile**:
  - **Category**: `executor`

  **Acceptance Criteria**:
  - [ ] Output JSON nodes have correct `parentId` field pointing to the group ID.
  - [ ] `extent: 'parent'` is set for children.

  **Commit**: YES
  - Message: `feat(core): add Group component`

- [x] 6. Implement Async Layout Pipeline (elkjs)

  **What to do**:
  - Create `libs/core/src/layout/elk.ts`.
  - Implement `applyLayout(graph: GraphJSON): Promise<GraphJSON>`.
  - Integrate into `renderToGraph` function:
    1. Reconcile (Sync) -> `graph`
    2. `await applyLayout(graph)`
    3. Return result.

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`

  **Acceptance Criteria**:
  - [ ] Test rendering a `MindMap` with `layout="tree"`.
  - [ ] Assert that output nodes have `x` and `y` values (not null/undefined) generated by ELK.
  - [ ] Assert `elkjs` is called.

  **Commit**: YES
  - Message: `feat(core): integrate elkjs for async layout`

- [x] 7. Implement MindMap & Node Components

  **What to do**:
  - `<MindMap>` acts as a layout boundary.
  - `<Node>` is a child of MindMap.
  - The `applyLayout` function should specifically look for `MindMap` nodes and apply ELK layout only to their children.

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`

  **Acceptance Criteria**:
  - [ ] Test complex tree structure.
  - [ ] Verify `MindMap` container exists.
  - [ ] Verify children have relative positions calculated.

  **Commit**: YES
  - Message: `feat(core): add MindMap and Node components`

---

## Success Criteria

### Final Checklist

- [x] `nx test core` passes with 100% coverage.
- [x] `renderToGraph` generates valid JSON for all example cases in design doc.
- [x] Async layout works correctly for `MindMap`.
