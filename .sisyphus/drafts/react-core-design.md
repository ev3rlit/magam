# Draft: GraphWrite React Core Architecture

## Requirements (Confirmed from Technical Design)

- **Nature**: Programmatic Whiteboard (Code-as-UI).
- **Architecture**: Monorepo (`cli`, `core`).
- **Data Flow**: Code -> Transpiler -> **Canvas Engine** -> JSON -> Viewer.
- **Core Components**:
  - `Canvas`: Root.
  - `Sticky`, `Shape`, `Text`: Absolute nodes.
  - `Group`: Local coordinate container.
  - `MindMap` + `Node`: Auto-layout.
  - `Edge`: Connection (Child = implicit source, Standalone = explicit source).

## Critical Architectural Decisions (Confirmed)

1.  **Execution Model**: Server-Side Graph Generation.
    - The server executes the React code.
    - Components do NOT render DOM. They build a data structure.
    - **Technical Choice**: Use `react-reconciler` to create a custom renderer. This converts JSX `<Sticky>` directly into a `GraphNode` object, bypassing the DOM entirely. This is the most robust "React-to-Data" pattern.
2.  **Layout Engine**: `elkjs`.
    - Applied during the generation phase for `MindMap` containers.
3.  **Edge Logic**:
    - Child Edge: Inherits `parentId` as `source`.
    - Registry: A flat map of nodes is constructed during reconciliation.

## Test Strategy

- **Unit Tests**: Critical for the Reconciler (JSX -> JSON verification).
- **Integration Tests**: CLI runner tests.
- **Framework**: (Pending User Decision).
