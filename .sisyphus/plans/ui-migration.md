# UI 컴포넌트 마이그레이션 작업 계획

## 현재 상황

- ✅ 컴포넌트 파일들을 `app/`으로 복사 완료
  - `app/store/graph.ts`
  - `app/components/GraphCanvas.tsx`
  - `app/components/nodes/*.tsx`
  - `app/components/ui/*.tsx`
- ✅ import 경로 수정 필요
- ✅ `page.tsx` 업데이트 필요

## 수정할 파일들

### 1. `app/components/GraphCanvas.tsx`

```typescript
// 수정 전
import { useGraphStore } from '../../store/graph';

// 수정 후
import { useGraphStore } from '@/store/graph';
```

### 2. `app/components/ui/Sidebar.tsx`

```typescript
// 수정 전
import { useGraphStore } from '../../store/graph';
import { useSocket } from '../../hooks/useSocket';

// 수정 후
import { useGraphStore } from '@/store/graph';

// useSocket 제거 (WebSocket 대신 직접 파일 선택)
const handleFileClick = (file: string) => {
  setCurrentFile(file);
  // emit('switch-file', file); 제거
};
```

### 3. `app/components/ui/Header.tsx`

- import 경로 수정 (필요시)

### 4. `app/components/ui/Footer.tsx`

- import 경로 수정 (필요시)

### 5. `app/components/ui/ErrorOverlay.tsx`

- import 경로 수정 (필요시)

### 6. `app/app/page.tsx` (메인 업데이트)

```typescript
'use client';

import { useEffect } from 'react';
import { GraphCanvas } from '@/components/GraphCanvas';
import { Sidebar } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { ErrorOverlay } from '@/components/ui/ErrorOverlay';
import { useGraphStore } from '@/store/graph';

export default function Home() {
  const { setFiles, setGraph, currentFile } = useGraphStore();

  // 파일 목록 로드
  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await fetch('/api/files');
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
        }
      } catch (error) {
        console.error('Failed to load files:', error);
      }
    }
    loadFiles();
  }, [setFiles]);

  // 파일 렌더링
  useEffect(() => {
    async function renderFile() {
      if (!currentFile) return;

      try {
        const res = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: currentFile }),
        });

        const data = await res.json();

        if (data.error) {
          console.error('Render error:', data.error);
          return;
        }

        if (data.graph) {
          const { children } = data.graph;

          // graph-sticky, graph-shape -> ReactFlow nodes
          const nodes = children
            .filter((child: any) => child.type !== 'graph-edge')
            .map((child: any, index: number) => ({
              id: child.props.id || `node-${index}`,
              type: child.type === 'graph-sticky' ? 'sticky' : 'shape',
              position: { x: child.props.x || 0, y: child.props.y || 0 },
              data: child.props,
            }));

          // graph-edge -> ReactFlow edges
          const edges = children
            .filter((child: any) => child.type === 'graph-edge')
            .map((child: any, index: number) => ({
              id: child.props.id || `edge-${index}`,
              source: child.props.from,
              target: child.props.to,
            }));

          setGraph({ nodes, edges });
        }
      } catch (error) {
        console.error('Failed to render file:', error);
      }
    }

    renderFile();
  }, [currentFile, setGraph]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        <Header />

        <main className="flex-1 relative w-full h-full overflow-hidden">
          <ErrorOverlay />
          <GraphCanvas />
        </main>

        <Footer />
      </div>
    </div>
  );
}
```

## 실행 방법

수동으로 위 파일들을 수정한 후:

```bash
bun run dev examples
open http://localhost:3000
```

## 예상 결과

1. Sidebar에 파일 목록 표시 (overview.tsx, mindmap.tsx)
2. 파일 클릭 시 렌더링
3. GraphCanvas에 노드와 엣지 표시
4. ReactFlow로 줌/팬 가능
