import { Canvas, MindMap, Node, Markdown } from '@graphwrite/core';

/**
 * Node Links 예제
 * 
 * node: 스킴을 사용하여 다른 노드로 이동할 수 있습니다.
 * 
 * 문법: [링크 텍스트](node:/mindmapId/nodeId)
 */
export default function NodeLinks() {
    return (
        <Canvas>
            <MindMap id="main" layout="bidirectional">
                <Node id="title">
                    <Markdown>{`
# 노드 링크 내비게이션

마인드맵에서 순차적으로 탐색하기

[시작하기 →](node:/main/intro)
          `}</Markdown>
                </Node>

                <Node id="intro" from="title">
                    <Markdown>{`
## 1. 소개

GraphWrite로 인터랙티브한 문서를 만들어보세요.

**다음 단계:**
- [핵심 개념 보기](node:/main/concepts)
- [예제 보기](node:/main/examples)
          `}</Markdown>
                </Node>

                <Node id="concepts" from="intro">
                    <Markdown>{`
## 2. 핵심 개념

- **Canvas**: 무한 캔버스
- **MindMap**: 노드 자동 배치
- **Node**: 콘텐츠 컨테이너

[← 이전](node:/main/intro) | [예제 →](node:/main/examples)
          `}</Markdown>
                </Node>

                <Node id="examples" from="concepts">
                    <Markdown>{`
## 3. 예제

마크다운에서 링크 사용:
\`\`\`markdown
[다음 섹션](node:/main/nodeId)
\`\`\`

[← 이전](node:/main/concepts) | [마무리 →](node:/main/conclusion)
          `}</Markdown>
                </Node>

                <Node id="conclusion" from="title">
                    <Markdown>{`
## 4. 마무리

노드 링크로 순차적 탐색이 가능합니다!

[처음으로 돌아가기](node:/main/title)
          `}</Markdown>
                </Node>
            </MindMap>
        </Canvas>
    );
}
