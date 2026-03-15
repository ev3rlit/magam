# Workspace Runtime Styling Review Summary

## Supported Today

- Base runtime categories: size, basic visual styling, shadow/elevation, outline/emphasis
- Interaction/runtime variants: `hover:`, `focus:`, `dark:`, `md:`, `lg:`, `xl:`, `2xl:`
- Dedicated interaction layers: `hoverStyle` and `focusStyle` are applied separately from the base inline payload
- Eligible node surfaces currently connected through `BaseNode`: Text, Markdown, Shape, Sticky, Sticker

## Not Supported Yet

- Interaction variants beyond the current subset, including `active:` and `group-hover:`
- `WashiTapeNode` runtime `className` styling
- `ImageNode` runtime `className` styling
- `SequenceDiagramNode` runtime payload application through the store/BaseNode path

## Verification

- Focused regression suite: `bun test app/features/workspace-styling/*.test.ts app/components/nodes/BaseNode.test.tsx`
- Supporting integration suite: `bun test app/components/editor/WorkspaceClient.test.tsx app/components/GraphCanvas.test.tsx scripts/dev/app-dev.test.ts app/hooks/useFileSync.test.ts`
- Live browser smoke: `examples/runtime_interactions.tsx` on `http://localhost:3005`
  - Hover diff from baseline: `2.70%`
  - Focus diff from baseline: `2.70%`
  - Focus target became a `DIV` with `tabIndex=0`

## Review Risks

- `SequenceDiagramNode` still declares `className`-like surfaces without consuming the runtime payload path.
- `hover` and `focus` are intentionally single-interaction layers; combined tokens like `hover:focus:*` are diagnosed and ignored.
