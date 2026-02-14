# Magam (마감)

> **"The future of knowledge work is not 'drawing' but 'describing'."**

![Magam Example](./assets/readme.png)

Magam is a **programmable whiteboard for AI agent collaboration**.

### Why "마감"?

**마감**(magam) is a Korean word meaning *deadline* and *finishing*. In publishing, 마감 is the moment scattered drafts become a finished page. Magam does the same for diagrams — you describe your intent, and AI finishes it into a visual. One word, two meanings: the urgency to ship, and the craft of completion.

Diagrams defined in code are **faster than hand-drawing, clearer in intent, and easier to archive**.
This app is designed **AI-First**, not Mobile-First.

## Installation

```
Install the skill from https://github.com/ev3rlit/magam
```

## Philosophy

- **Describe, don't draw** — Tell the AI what you want; it writes React code that renders as diagrams
- **Code as archive** — All visuals are stored as readable, versionable React code
- **Auto-layout** — ELK engine handles positioning; you focus on logic

## Usage

Ask your AI agent to create diagrams:

```
"Create a mind map about microservices architecture"
"Draw a flowchart for user authentication"
"Visualize this system design as a tree diagram"
```

For detailed API and examples, ask the AI with `/magam`:

```
/magam show me the Node API
/magam create a simple mind map example
```

## Examples

| File | Description |
|------|-------------|
| `mindmap.tsx` | MindMap features: node types, markdown, layouts |
| `styling.tsx` | Styling & sizing with Tailwind CSS |
| `icons.tsx` | Using emoji icons in Shapes and MindMap |
| `anchor_positioning.tsx` | Relative positioning with anchors |
| `node_links.tsx` | Node linking and edge examples |
| `multiple_mindmaps.tsx` | Multiple MindMaps on one canvas |
| `bubble.tsx` | Semantic Zoom: Bubble Label Example |

**Describe in words, archive in code. Magam draws for you.**