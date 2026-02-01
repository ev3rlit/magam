import { Canvas, MindMap, Node, Markdown, Text } from '@graphwrite/core';

/**
 * MindMap Markdown Example
 * 
 * Node 내부에서 Markdown 컴포넌트를 사용하여 
 * 헤더, 리스트, 테이블, 코드블럭 등을 렌더링합니다.
 */
export default function MindMapMarkdownExample() {
    return (
        <Canvas>
            <MindMap x={100} y={100} layout="tree" spacing={80}>

                {/* 루트 노드: 마크다운으로 프로젝트 소개 */}
                <Node id="intro" className="bg-white p-4 w-[300px]">
                    <Markdown>
                        {`# 프로젝트 소개

React 기반 **다이어그램** 도구입니다.

- 마인드맵 지원
- 마크다운 렌더링
- 커스텀 스타일링`}
                    </Markdown>
                </Node>

                {/* 코드 블록 예제 */}
                <Node id="code-example" from="intro" className="bg-white p-4 w-[320px]">
                    <Markdown>
                        {`## 코드 예시

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

인라인 코드도 지원합니다: \`npm install\``}
                    </Markdown>
                </Node>

                {/* 테이블 예제 */}
                <Node id="table-example" from="intro" className="bg-white p-4 w-[280px]">
                    <Markdown>
                        {`## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /users | 사용자 목록 |
| POST | /users | 사용자 생성 |
| DELETE | /users/:id | 삭제 |`}
                    </Markdown>
                </Node>

                {/* 커스텀 스타일 예제 */}
                <Node id="custom-style" from="intro" className="bg-slate-50 p-4 w-[260px]">
                    <Markdown className="prose-headings:text-blue-600 prose-a:text-blue-500">
                        {`## 커스텀 스타일

Tailwind CSS \`prose\` 수정자로 스타일을 변경할 수 있습니다.

[공식 문서 →](https://tailwindcss.com/docs/typography-plugin)`}
                    </Markdown>
                </Node>

                {/* 리스트 예제 (하위 노드) */}
                <Node id="nested-list" from="code-example" className="bg-white p-3 w-[220px]">
                    <Markdown>
                        {`### 순서 있는 리스트

1. 첫 번째
2. 두 번째
3. 세 번째`}
                    </Markdown>
                </Node>

                {/* Minimal 스타일 예제 */}
                <Node id="minimal-example" from="table-example" className="bg-white p-3 w-[200px]">
                    <Markdown variant="minimal">
                        {`### Minimal 스타일

더 간결한 스타일입니다.`}
                    </Markdown>
                </Node>

            </MindMap>
        </Canvas>
    );
}
