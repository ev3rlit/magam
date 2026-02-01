import { Canvas, MindMap, Node, Markdown } from '@graphwrite/core';

export default function GraphWriteIntro() {
    return (
        <Canvas>
            <MindMap layout="tree" spacing={80}>

                {/* Root: Philosophy */}
                <Node id="root" className="bg-white p-6 w-[450px]">
                    <Markdown>
                        {`# GraphWrite
> **"지식 작업의 미래는 '그리는 것'이 아니라 '설명하는 것'입니다."**

손으로 직접 그리는 수고를 덜고,
**AI 에이전트**와 협업하여 생각을 구조화하는 도구입니다.`}
                    </Markdown>
                </Node>

                {/* Motivation: Why? */}
                <Node id="why" from="root" className="bg-slate-50 p-4 w-[350px]">
                    <Markdown>
                        {`### 왜 만들었나요?
- **Speed**: 손보다 빠른 기록
- **Clarity**: 코드로 남는 명확한 의도
- **Archiving**: 텍스트(코드) 기반의 영구 보존`}
                    </Markdown>
                </Node>

                {/* Core Concept: AI-First */}
                <Node id="concept" from="root" className="bg-slate-50 p-4 w-[350px]">
                    <Markdown>
                        {`### AI-First
Mobile-First가 아닙니다.
**AI가 이해하고 실행하기 좋은 방식**을 최우선으로 합니다.

1. 사용자: "자연어로 의도 설명"
2. AI: "React 코드로 변환"
3. GraphWrite: "화면에 렌더링"`}
                    </Markdown>
                </Node>

                {/* Code Example */}
                <Node id="example" from="root" className="bg-white p-2 w-[400px]">
                    <Markdown>
                        {`### Code-Based View
모든 다이어그램은 실제 **React 코드**입니다.

\`\`\`tsx
<MindMap layout="tree">
  <Node id="idea">
    <Markdown># 내 생각</Markdown>
  </Node>
</MindMap>
\`\`\``}
                    </Markdown>
                </Node>

            </MindMap>
        </Canvas>
    );
}