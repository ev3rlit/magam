import { Canvas, MindMap, Node, Markdown } from '@graphwrite/core';

export default function NodejsWorkerMindmap() {
    return (
        <Canvas>
            <MindMap id="worker-main" layout="bidirectional" spacing={60}>
                <Node id="root">
                    <Markdown>{`
# Node.js Worker in Next.js (SSR)
왜 서버에서 Web Worker를 쓰기 힘들까?
          `}</Markdown>
                </Node>

                {/* 1. Environment Differences */}
                <Node id="env" from="root">
                    <Markdown>{`### 1. 근본적인 환경 차이`}</Markdown>
                </Node>
                <Node id="env-browser" from="env">
                    <Markdown>{`**Browser**: \`window.Worker\` (표준 API)`}</Markdown>
                </Node>
                <Node id="env-node" from="env">
                    <Markdown>{`**Node.js**: \`worker_threads\` (브라우저와 다름)`}</Markdown>
                </Node>
                <Node id="env-issue" from="env" className="bg-red-50 border-red-200">
                    <Markdown>{`**Error**: "Worker is not defined" 발생`}</Markdown>
                </Node>

                {/* 2. DOM Absence */}
                <Node id="dom" from="root">
                    <Markdown>{`### 2. DOM의 부재 (측정 불가)`}</Markdown>
                </Node>
                <Node id="dom-browser" from="dom">
                    <Markdown>{`Canvas/DOM을 통해 **픽셀 단위 텍스트 측정** 가능`}</Markdown>
                </Node>
                <Node id="dom-server" from="dom">
                    <Markdown>{`화면(View)이 없어 정교한 레이아웃 좌표 계산 어려움`}</Markdown>
                </Node>

                {/* 3. SSR Conflict */}
                <Node id="ssr" from="root">
                    <Markdown>{`### 3. SSR과 비동기의 충돌`}</Markdown>
                </Node>
                <Node id="ssr-goal" from="ssr">
                    <Markdown>{`**SSR**: HTML을 즉시 생성하여 빠른 응답`}</Markdown>
                </Node>
                <Node id="worker-async" from="ssr">
                    <Markdown>{`**Worker**: \`postMessage\` 기반의 비동기 방식`}</Markdown>
                </Node>
                <Node id="ssr-wait" from="ssr" className="bg-yellow-50 border-yellow-200">
                    <Markdown>{`계산을 기다리느라 SSR의 장점이 퇴색됨`}</Markdown>
                </Node>

                {/* Summary Table */}
                <Node id="summary" from="root">
                    <Markdown>{`
### 비교 요약

| 특징 | 브라우저 (Client) | 서버 (SSR/Node) |
| :--- | :--- | :--- |
| **API** | \`new Worker()\` | \`worker_threads\` |
| **DOM** | 가능 (측정 가능) | **불가능** |
| **목적** | UI 블로킹 방지 | 빠른 HTML 생성 |
          `}</Markdown>
                </Node>

                {/* 4. Solutions */}
                <Node id="sol" from="root">
                    <Markdown>{`### ✨ 현실적인 해결책`}</Markdown>
                </Node>
                <Node id="sol-useeffect" from="sol">
                    <Markdown>{`
**useEffect**
브라우저 마운트 직후에 Worker를 생성하여 계산을 위임합니다.

\`\`\`javascript
useEffect(() => {
  const worker = new Worker(new URL('./layout.worker.js', import.meta.url));
  worker.postMessage({ nodes, edges });
  worker.onmessage = (e) => setLayout(e.data);
  return () => worker.terminate();
}, []);
\`\`\`
          `}</Markdown>
                </Node>
                <Node id="sol-dynamic" from="sol">
                    <Markdown>{`
**next/dynamic**
해당 컴포넌트 자체를 SSR에서 제외시켜 에러를 원천 차단합니다.

\`\`\`javascript
import dynamic from 'next/dynamic';
const GraphNoSSR = dynamic(
  () => import('./GraphComponent'),
  { ssr: false }
);
\`\`\`
          `}</Markdown>
                </Node>
            </MindMap>
        </Canvas>
    );
}
