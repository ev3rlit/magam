import { Canvas, MindMap, Node, Markdown } from '@graphwrite/core';

export default function GraphWriteIntro() {
    return (
        <Canvas>
            <MindMap layout="tree" spacing={80}>

                {/* Root: Philosophy */}
                <Node id="root">
                    <Markdown>
                        {`# GraphWrite
> **"The future of knowledge work is not 'drawing' but 'describing'."**

Stop drawing by hand.
**Collaborate with AI agents** to structure your thoughts.`}
                    </Markdown>
                </Node>

                {/* Motivation: Why? */}
                <Node id="why" from="root">
                    <Markdown>
                        {`### Why GraphWrite?
- **Speed**: Faster than hand-drawing
- **Clarity**: Clear intent preserved in code
- **Archiving**: Permanent text-based storage`}
                    </Markdown>
                </Node>

                {/* Core Concept: AI-First */}
                <Node id="concept" from="root">
                    <Markdown>
                        {`### AI-First
Not Mobile-First.
**Optimized for AI to understand and execute.**

1. User: "Describe intent in natural language"
2. AI: "Convert to React code"
3. GraphWrite: "Render on screen"`}
                    </Markdown>
                </Node>

                {/* Code Example */}
                <Node id="example" from="root">
                    <Markdown>
                        {`### Code-Based View
Every diagram is real **React code**.

\`\`\`tsx
<MindMap layout="tree">
  <Node id="idea">
    <Markdown># My Thought</Markdown>
  </Node>
</MindMap>
\`\`\``}
                    </Markdown>
                </Node>

            </MindMap>
        </Canvas>
    );
}