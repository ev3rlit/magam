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

                {/* AI Co-Pilot Workflow */}
                <Node id="ai-edit" from="concept">
                    <Markdown>{`
**How to edit:**
1. Select Node
2. Cmd+C (Copy mindmap.mindmap-0.ai-table-demo)
3. Paste & Prompt`}</Markdown>
                </Node>

                <Node id="ai-code-demo" from="ai-edit">
                    <Markdown>{`### Code-Based
\`\`\`tsx
<Node id="ai-table-demo"> 
  <Markdown>{\`
| ID | Name |
|----|------|
| 01 | User |
  \`}</Markdown>
</Node>
\`\`\``}</Markdown>


                </Node>

                <Node id="ai-prompt-demo" from="ai-edit">
                    <Markdown>{`### Sample Prompt
"Add a new user 'Alice'
to the table in node
\`mindmap.mindmap-0.ai-table-demo\`"`}</Markdown>
                </Node>

                <Node id="ai-table-demo" from="ai-edit">
                    <Markdown>{`
| ID | Name |
|----|------|
| 01 | User |`}</Markdown>
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