import { Canvas, Sticky, Markdown, Text, preset } from '@magam/core';

export default function MarkdownFeaturesDemo() {
  return (
    <Canvas>
      <Text id="title" x={360} y={20} fontSize="xl">Markdown Features</Text>

      {/* Code Blocks */}
      <Sticky id="code" x={40} y={80} pattern={preset('lined-warm')}>
        <Markdown>{`## Code Blocks

Inline: \`renderToGraph()\` returns an AST.

\`\`\`tsx
<MindMap id="map" layout="tree">
  <Node id="root">Hello</Node>
  <Node id="child" from="root">
    World
  </Node>
</MindMap>
\`\`\``}</Markdown>
      </Sticky>

      {/* Tables */}
      <Sticky id="table" x={520} y={80} pattern={preset('lined-warm')}>
        <Markdown>{`## Tables

| Component | Role       | Required |
|-----------|------------|:--------:|
| Canvas    | Root       | ✓        |
| MindMap   | Layout     | —        |
| Node      | Content    | —        |
| Shape     | Visual box | —        |
| Edge      | Connector  | —        |`}</Markdown>
      </Sticky>

      {/* Lists */}
      <Sticky id="lists" x={40} y={520} pattern={preset('lined-warm')}>
        <Markdown>{`## Lists

**Unordered**
- Canvas — root wrapper
- MindMap — tree layout
  - tree / radial / bidirectional
- Shape, Sticky, Edge

**Ordered**
1. Write TSX
2. CLI transpiles
3. Reconciler builds AST
4. ELK auto-layout
5. ReactFlow renders`}</Markdown>
      </Sticky>

      {/* Checkboxes */}
      <Sticky id="checkboxes" x={520} y={520} pattern={preset('lined-warm')}>
        <Markdown>{`## Checkboxes

**Released**
- [x] Canvas & MindMap
- [x] Markdown in nodes
- [x] Tables & code blocks
- [x] Anchor positioning

**Upcoming**
- [ ] Export to PNG / SVG
- [ ] Obsidian plugin
- [ ] Multi-user canvas`}</Markdown>
      </Sticky>
    </Canvas>
  );
}
