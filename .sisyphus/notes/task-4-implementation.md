Implemented Custom Nodes (Sticky and Shape)

1.  **StickyNode**:
    - Path: `apps/client/src/app/components/Canvas/nodes/StickyNode.tsx`
    - Features: Square aspect ratio, yellow default background (customizable via `data.color`), handwriting font, subtle handles.
    - Tests: `apps/client/src/app/components/Canvas/nodes/StickyNode.spec.tsx`

2.  **ShapeNode**:
    - Path: `apps/client/src/app/components/Canvas/nodes/ShapeNode.tsx`
    - Features: Supports `rectangle`, `circle`, `triangle`. Triangle uses SVG for precise rendering. Customizable color.
    - Tests: `apps/client/src/app/components/Canvas/nodes/ShapeNode.spec.tsx`

3.  **Registration**:
    - Updated `apps/client/src/app/components/Canvas/GraphCanvas.tsx` to register `sticky` and `shape` node types.

4.  **Verification**:
    - Unit tests passed for both components.
    - Client build passed.

5.  **Commits**:
    - `feat(client): implement StickyNode component`
    - `feat(client): implement ShapeNode component`
    - `feat(client): register custom nodes in GraphCanvas`
