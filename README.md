# GraphWrite

> **"지식 작업의 미래는 '그리는 것'이 아니라 '설명하는 것'입니다."**

GraphWrite는 **AI 에이전트와 협업하는 프로그래머블 화이트보드**입니다.

저는 일일이 손으로 도형을 그리고 텍스트를 입력하는 반복적인 작업에서 벗어나고 싶었습니다.
"이 아키텍처를 그려줘"라는 말 한마디면, AI가 코드를 작성하고 그것이 곧바로 다이어그램이 되는 도구를 상상했습니다.

왜냐하면 코드로 정의된 다이어그램은 **사람의 손보다 빠르고, 의도가 명확하며, 영구적으로 기록하고 관리하기 쉽기 때문**입니다.
이 앱은 모바일 우선(Mobile-First)이 아닌 **AI 우선(AI-First)** 방식으로 설계되었습니다.

## 주요 특징 (Features)

### 1. AI-First Interaction (대화로 그리는 그림)
마우스로 드래그 앤 드롭하는 대신, 자연어로 의도를 설명하세요. AI 에이전트가 여러분의 말을 React 코드로 변환하여 화면에 그림을 그립니다. 우리는 이것을 "그리는 도구(Drawing Tool)"가 아닌 "설명하는 도구(Describing Tool)"라고 정의합니다.

### 2. Code-Based Archiving (투명한 기록)
모든 시각 정보는 불투명한 바이너리 파일이 아닌, 읽고 수정 가능한 **React 코드**로 저장됩니다.
- **명확성**: 다이어그램의 의미가 코드로 명시됩니다.
- **재사용성**: 작성된 컴포넌트는 언제든 다시 사용하거나 수정할 수 있습니다.
- **버전 관리**: Git을 통해 다이어그램의 변경 이력을 코드처럼 관리할 수 있습니다.

### 3. Structural Clarity (구조적 명확함)
단순한 텍스트 에디터나 자유 캔버스와 달리, GraphWrite는 생각의 구조를 명확히 잡아줍니다.
- **마크다운 지원**: 노드 안에서 익숙한 마크다운 문법으로 문서를 작성합니다.
- **자동 레이아웃**: 레이아웃 엔진(ELK)이 복잡한 관계를 자동으로 정리해줍니다. 위치를 고민하는 시간을 절약하고 논리에만 집중하세요.

---

## 사용 예시 (How it Works)

사용자가 자연어로 요청하면, AI는 아래와 같은 React 코드를 생성합니다. 사람이 직접 작성할 수도 있습니다.

![GraphWrite Example](./assets/readme.png)

```tsx
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
```

**말로 설명하고, 코드로 남기세요. 그림은 GraphWrite가 그립니다.**