---
name: graphwrite
description: This skill should be used when creating visual diagrams, mind maps, flowcharts, architecture diagrams, or any code-based visual representation using the GraphWrite library. Triggers on tasks involving diagram creation, mind map generation, visual documentation, system architecture visualization, or when users mention "graphwrite", "mindmap", "diagram", "flowchart", or "canvas".
---

# GraphWrite

## Overview

GraphWrite is a React-based library for creating visual diagrams through code. It enables AI-first diagram creation where users describe their intent in natural language, and the AI generates React/TSX code that renders as visual diagrams. The philosophy is "describing" rather than "drawing" - transforming thoughts into structured visual representations.

## When to Use This Skill

- Creating mind maps to organize ideas or knowledge
- Building system architecture diagrams
- Visualizing flowcharts and processes
- Creating overview/brainstorming diagrams with sticky notes
- Generating visual documentation from text descriptions
- Any task requiring code-based diagram generation

## Core Components

All components are imported from `@graphwrite/core`:

```tsx
import { Canvas, Shape, Sticky, MindMap, Node, Edge, Text, Markdown } from '@graphwrite/core';
```

### Canvas (Required Root)

Every GraphWrite diagram must be wrapped in a Canvas component.

```tsx
<Canvas>
  {/* All diagram elements go here */}
</Canvas>
```

### Shape

Rectangle/box element for architecture diagrams and flowcharts.

**Props:**
- `id` (required): Unique identifier
- `x`, `y`: Absolute position coordinates
- `width`, `height`: Size in pixels
- `label`: Text label (alternative to children)
- `className`: Tailwind CSS classes for styling
- `anchor`: ID of another Shape for relative positioning
- `position`: Position relative to anchor ("right", "bottom", "left", "top")
- `gap`: Distance from anchor element

**Usage Patterns:**

```tsx
{/* Absolute positioning */}
<Shape id="box1" x={100} y={100}>Content</Shape>

{/* With size */}
<Shape id="box2" x={200} y={100} width={180} height={80}>Sized Box</Shape>

{/* Relative positioning with anchor */}
<Shape id="api" anchor="users" position="right" gap={120}>
  <Text>API Server</Text>
  <Edge to="users" />
</Shape>

{/* With Tailwind styling */}
<Shape id="success" className="bg-green-50 border-green-300 text-green-700">
  Success State
</Shape>
```

### Sticky

Sticky note element, similar to Shape but styled as a sticky note.

```tsx
<Sticky id="idea" x={100} y={100}>
  My Idea
  <Edge to="target" />
</Sticky>

{/* With glass effect */}
<Sticky id="glass" className="bg-white/50 backdrop-blur-sm border-white/30">
  Glass Effect
</Sticky>
```

### MindMap

Container for hierarchical mind map structures.

**Props:**
- `id`: MindMap identifier (required for multiple MindMaps)
- `x`, `y`: Position on canvas (default: 0, 0)
- `layout`: "tree" (horizontal), "bidirectional" (left+right), or "radial" (circular)
- `spacing`: Gap between nodes

```tsx
<MindMap id="main" layout="tree" spacing={80}>
  <Node id="root">Root Topic</Node>
  <Node id="child1" from="root">Child 1</Node>
  <Node id="child2" from="root">Child 2</Node>
  <Node id="grandchild" from="child1">Grandchild</Node>
</MindMap>
```

### Node

MindMap node element. Must be used inside a MindMap.

**Props:**
- `id` (required): Unique identifier
- `from`: Parent node ID (creates connection automatically)

**Content Options:**
- Plain text: `<Node id="x">Plain text</Node>`
- With emoji: `<Node id="x">🎯 With emoji</Node>`
- Text component: `<Node id="x"><Text>Styled</Text></Node>`
- Multiple Text: `<Node id="x"><Text>Line 1</Text><Text>Line 2</Text></Node>`
- Markdown: `<Node id="x"><Markdown>{content}</Markdown></Node>`

### Text

Standalone or inline text element.

**Props:**
- `id`: Identifier (for standalone)
- `x`, `y`: Position (for standalone)
- `className`: Tailwind CSS classes

```tsx
{/* Standalone text on canvas */}
<Text id="title" x={200} y={30}>Page Title</Text>

{/* Styled text */}
<Text className="text-xl font-bold text-blue-600">Styled Text</Text>

{/* Inside Shape */}
<Shape id="box">
  <Text className="font-bold">Title</Text>
  <Text className="text-sm text-gray-500">Subtitle</Text>
</Shape>
```

### Markdown

Rich text content with Markdown support. Typically used inside Node.

**Supported Features:**
- Headers: `# H1`, `## H2`, `### H3`
- Emphasis: `**bold**`, `*italic*`
- Lists: `- item` or `1. item`
- Code: `` `inline` `` and code blocks with ```
- Tables: `| col1 | col2 |`
- Blockquotes: `> quote`

```tsx
<Node id="docs">
  <Markdown>{`
### API Reference

| Method | Endpoint |
|--------|----------|
| GET    | /users   |
| POST   | /users   |

\`\`\`typescript
function hello() {
  return "world";
}
\`\`\`
  `}</Markdown>
</Node>
```

### Node Links (Internal Navigation)

Navigate between nodes using the `node:` scheme in Markdown links. Clicking a node link smoothly animates the viewport to the target node.

**Syntax:** `[link text](node:/mindmapId/nodeId)`

```tsx
<Node id="intro">
  <Markdown>{`
## Introduction

Learn the basics first, then move on.

[Next: Core Concepts](node:/main/concepts)
  `}</Markdown>
</Node>

<Node id="concepts" from="intro">
  <Markdown>{`
## Core Concepts

- Canvas: Infinite drawing area
- MindMap: Auto-layout container
- Node: Content container

[← Previous](node:/main/intro) | [Next →](node:/main/examples)
  `}</Markdown>
</Node>
```

**Path Formats:**
- `/mindmapId/nodeId` → navigates to `mindmapId.nodeId`
- `/nodeId` → navigates to `nodeId` (for single MindMap)

**Styling:** Node links are styled with indigo color and arrow prefix (→) to distinguish from external links.

### Edge

Connection line between elements.

**Props:**
- `from`: Source element ID
- `to`: Target element ID

```tsx
{/* Standalone edge */}
<Edge from="box1" to="box2" />

{/* Inside Shape (only 'to' needed) */}
<Shape id="api">
  <Text>API</Text>
  <Edge to="database" />
</Shape>
```

## Styling with Tailwind CSS

All components support `className` prop for Tailwind CSS styling.

### Colors and States
```tsx
<Shape className="bg-green-50 border-green-300 text-green-700">Success</Shape>
<Shape className="bg-yellow-50 border-yellow-300 text-yellow-700">Warning</Shape>
<Shape className="bg-red-50 border-red-300 text-red-700">Error</Shape>
```

### Effects
```tsx
<Shape className="bg-gradient-to-r from-blue-400 to-purple-500 text-white border-none">
  Gradient
</Shape>
<Shape className="shadow-xl">Shadow</Shape>
<Sticky className="bg-white/50 backdrop-blur-sm">Glass Effect</Sticky>
```

### Borders
```tsx
<Shape className="rounded-2xl">Rounded</Shape>
<Shape className="border-dashed border-2">Dashed</Shape>
<Shape className="border-4 border-indigo-500">Thick Border</Shape>
```

### Sizing
```tsx
<Shape width={180} height={80}>Props sizing</Shape>
<Shape className="w-[200px] h-[60px]">Tailwind sizing</Shape>
```

## Common Patterns

### Architecture Diagram

```tsx
<Canvas>
  <Text id="title" x={200} y={30}>System Architecture</Text>

  <Shape id="users" x={50} y={100}>
    <Text>👥 Users</Text>
  </Shape>

  <Shape id="api" anchor="users" position="right" gap={120}>
    <Text>🖥️ API Server</Text>
    <Edge to="users" />
  </Shape>

  <Shape id="db" anchor="api" position="right" gap={120}>
    <Text>🗄️ Database</Text>
    <Edge to="api" />
  </Shape>

  <Shape id="auth" anchor="api" position="bottom" gap={80}>
    <Text>🔐 Auth Service</Text>
    <Edge to="api" />
  </Shape>
</Canvas>
```

### Knowledge Mind Map

```tsx
<Canvas>
  <MindMap id="knowledge" layout="tree" spacing={80}>
    <Node id="root">
      <Markdown>{`# Main Topic`}</Markdown>
    </Node>

    <Node id="category1" from="root">Category 1</Node>
    <Node id="item1a" from="category1">Item 1A</Node>
    <Node id="item1b" from="category1">Item 1B</Node>

    <Node id="category2" from="root">Category 2</Node>
    <Node id="item2a" from="category2">
      <Markdown>{`
**Detailed Item**
- Point 1
- Point 2
      `}</Markdown>
    </Node>
  </MindMap>
</Canvas>
```

### Multiple MindMaps

Place multiple independent MindMaps on a single Canvas. Each MindMap has its own ID namespace, so node IDs won't conflict.

**Key Features:**
- **Scoped IDs**: Same node ID can exist in different MindMaps
- **Positioning**: Use `x`, `y` props to position each MindMap
- **Cross-MindMap Edges**: Use dot notation `mapId.nodeId` for references

```tsx
<Canvas>
  {/* First MindMap */}
  <MindMap id="concepts" layout="bidirectional">
    <Node id="root">
      <Markdown>{`# Core Concepts`}</Markdown>
    </Node>
    <Node id="feature1" from="root">Feature A</Node>
    <Node id="feature2" from="root">Feature B</Node>
  </MindMap>

  {/* Second MindMap - positioned to the right */}
  <MindMap id="details" layout="tree" x={600} y={0}>
    <Node id="root">
      <Markdown>{`## Details`}</Markdown>
    </Node>
    <Node id="item1" from="root">Detail 1</Node>
    <Node id="item2" from="root">Detail 2</Node>
  </MindMap>

  {/* Cross-MindMap connection using dot notation */}
  <Edge from="concepts.feature1" to="details.item1" />
</Canvas>
```

### Brainstorming with Stickies

```tsx
<Canvas>
  <Text id="title" x={200} y={30}>Brainstorm</Text>

  <Sticky id="idea1" x={100} y={100}>
    Core Idea
    <Edge to="central" />
  </Sticky>

  <Sticky id="idea2" x={100} y={200}>
    Supporting Idea
    <Edge to="central" />
  </Sticky>

  <Shape id="central" x={300} y={150}>Central Concept</Shape>
</Canvas>
```

## Best Practices

1. **Always use unique IDs** for all elements with id prop
2. **Use semantic IDs** that describe the element's purpose
3. **Prefer relative positioning** with `anchor`/`position`/`gap` for maintainable layouts
4. **Use Markdown** for rich content in mind map nodes
5. **Add emojis** to visually distinguish different types of elements
6. **Group related content** using comments in JSX
7. **Use consistent styling** with Tailwind utility classes
8. **Keep node content concise** - use child nodes for detailed breakdowns

## File Structure

GraphWrite files are TypeScript/TSX files that export a React component:

```tsx
import { Canvas, MindMap, Node, Text, Markdown } from '@graphwrite/core';

export default function MyDiagram() {
  return (
    <Canvas>
      {/* Diagram content */}
    </Canvas>
  );
}
```

Files are typically placed in an `examples/` directory with descriptive names like `architecture.tsx`, `mindmap.tsx`, `overview.tsx`.
