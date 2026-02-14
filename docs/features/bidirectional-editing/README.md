# Bidirectional Editing PRD (Code ↔ Canvas)

## 1. 배경

Magam는 현재 **코드 → 캔버스 렌더링** 파이프라인에 집중되어 있으며, UX 차원에서 **캔버스 편집 기능 자체를 제공하지 않습니다**.

즉, 현재 제품은 “보기(View) 중심”이며 노드 이동/구조 변경/직접 수정 같은 상호작용은 비활성 상태입니다.

현재 상태 요약:

- 캔버스 노드 드래그/직접 편집 UX는 미제공 (`nodesDraggable={false}`)
- 코드 수정은 파일 편집(에디터/AI) 경로를 통해서만 이루어짐
- 내부 코드에는 파일 패치 관련 실험/기반 로직이 있으나, 사용자 편집 UX로 연결되어 있지 않음
- MindMap은 ELK 자동 레이아웃 기반이라 일반 캔버스 방식의 좌표 저장 접근이 부적합함

이 문서의 목적은 **React 코드 기반 마인드맵 앱에 맞는 양방향 편집 설계와 단계별 구현 계획**을 정의하는 것입니다.

---

## 2. 문제 정의

사용자 관점 문제:

1. 캔버스에서 직접 편집할 수 없어 코드와 시각 편집을 오가며 작업해야 한다.
2. MindMap 구조를 시각적으로 다듬는 빠른 인터랙션(재부모화/정렬)이 불가능하다.
3. 향후 편집 기능 도입 시 필요한 충돌 제어/동기화 정책이 아직 제품화되지 않았다.

제품 관점 문제:

1. “코드가 진실 소스” 철학을 유지하면서 캔버스 편집 UX를 새로 설계해야 한다.
2. 양방향 편집 도입 시 코드 포맷 깨짐/잘못된 패치/루프 업데이트를 사전에 차단해야 한다.

---

## 3. 목표와 비목표

### 목표 (Goals)

1. 캔버스 편집 결과가 안전하게 TSX 코드로 반영된다.
2. MindMap 편집은 좌표가 아니라 **구조 변경**으로 저장된다.
3. 충돌 발생 시 데이터 유실 없이 복구 가능한 UX를 제공한다.
4. 기존 렌더 파이프라인과 호환된다.

### 비목표 (Non-Goals)

1. 실시간 다중 사용자 협업 CRDT/OT 구현
2. 모든 JSX 패턴(매우 동적 표현식)의 완전 자동 패치
3. 1차 릴리스에서 완전한 비주얼 WYSIWYG 코드 포매터 구현

---

## 4. 핵심 원칙

1. **단일 진실 소스는 TSX 파일**이다.
2. 캔버스 상태는 항상 코드에서 파생된다.
3. 캔버스 편집은 문자열 치환이 아니라 **AST 명령(Command) 패치**로 처리한다.
4. MindMap 노드는 좌표가 아니라 `parent(from)`와 형제 순서를 수정한다.

---

## 5. 사용자 시나리오

### 시나리오 A: Canvas 노드 이동

1. 사용자가 `Sticky`를 드래그해 위치 변경
2. 클라이언트가 `node.move` RPC 전송
3. 서버 AST에서 해당 JSX의 `x`, `y` 갱신
4. 파일 저장 후 변경 이벤트 브로드캐스트
5. 클라이언트가 재렌더링 후 동일 결과 확인

### 시나리오 B: MindMap 노드 부모 변경

1. 사용자가 MindMap 노드를 다른 부모 노드 위로 드롭
2. 클라이언트가 `mindmap.reparent` RPC 전송
3. 서버가 cycle 검사 후 `<Node from="...">` 업데이트
4. ELK 재레이아웃 결과가 화면에 반영

### 시나리오 C: 충돌 발생

1. 사용자가 드래그 중 다른 프로세스가 파일 수정
2. 서버가 `baseVersion` 불일치로 충돌 응답
3. 클라이언트가 최신 파일 재로딩 + 사용자에게 충돌 토스트 표시

---

## 6. 기능 요구사항

### 기능 요구사항 (Functional)

1. 캔버스 노드 이동 시 코드 좌표 동기화
2. MindMap 노드 재부모화(reparent) 동기화
3. MindMap 형제 순서 변경(reorder) 동기화
4. 명령 단위 성공/실패 응답 및 UI 롤백
5. 파일 버전 기반 충돌 제어
6. 자기 자신이 발생시킨 파일 변경 이벤트 무시(origin 제어)

### 비기능 요구사항 (Non-Functional)

1. 단일 명령 처리 지연: 로컬 기준 p95 300ms 이하
2. 패치 실패 시 파일 무결성 보장(부분 쓰기 금지)
3. 잘못된 명령 요청 시 명확한 에러 코드 제공

---

## 7. 아키텍처 제안

```text
TSX File
  -> /render
  -> Graph + sourceVersion + nodeSourceMeta
  -> ReactFlow Canvas
  -> User Edit (drag/drop/reparent)
  -> WS JSON-RPC Command
  -> AST Patch + Write
  -> file.changed(version, originId)
  -> Re-render
```

핵심 설계:

1. `render` 응답에 `sourceVersion`(파일 해시) 포함
2. 각 노드 `data`에 `sourceId`, `scopeId`, `kind(canvas|mindmap)` 포함
3. RPC 요청에 `baseVersion`, `originId`, `commandId` 포함

---

## 8. RPC 설계 (v1)

기존 구조를 크게 흔들지 않기 위해 v1은 전용 메서드로 시작합니다.

| Method | 용도 | 대상 |
|---|---|---|
| `node.move` | 노드 좌표 수정 | Canvas 노드 |
| `mindmap.reparent` | 부모 변경 (`from` 갱신) | MindMap 노드 |
| `mindmap.reorder` | 형제 순서 변경 | MindMap 노드 |

### 8.1 공통 요청 필드

```json
{
  "jsonrpc": "2.0",
  "id": 101,
  "method": "node.move",
  "params": {
    "filePath": "examples/mindmap.tsx",
    "nodeId": "api-server",
    "baseVersion": "sha256:abc...",
    "originId": "client-1",
    "commandId": "cmd-uuid",
    "x": 320,
    "y": 180
  }
}
```

### 8.2 성공 응답

```json
{
  "jsonrpc": "2.0",
  "id": 101,
  "result": {
    "success": true,
    "newVersion": "sha256:def..."
  }
}
```

### 8.3 충돌 응답 예시

```json
{
  "jsonrpc": "2.0",
  "id": 101,
  "error": {
    "code": 40901,
    "message": "VERSION_CONFLICT",
    "data": {
      "latestVersion": "sha256:xyz..."
    }
  }
}
```

### 8.4 파일 변경 알림(Notification) 스키마

서버는 파일 저장 성공 후 `file.changed`를 브로드캐스트한다.

```json
{
  "jsonrpc": "2.0",
  "method": "file.changed",
  "params": {
    "filePath": "examples/mindmap.tsx",
    "version": "sha256:def...",
    "originId": "client-1",
    "commandId": "cmd-uuid",
    "timestamp": 1739439000000
  }
}
```

클라이언트 규칙:

1. `originId === myClientId`이면 재요청 루프를 막기 위해 무시
2. `originId !== myClientId`이면 최신 상태 재렌더링

### 8.5 오류 코드 표준 (v1)

| code | message | 의미 |
|---|---|---|
| `40001` | `INVALID_PARAMS` | 요청 파라미터 누락/형식 오류 |
| `40401` | `NODE_NOT_FOUND` | TSX에서 대상 `id`를 찾지 못함 |
| `40901` | `VERSION_CONFLICT` | `baseVersion` 불일치 |
| `40902` | `MINDMAP_CYCLE` | reparent 시 cycle 생성 |
| `50001` | `PATCH_FAILED` | AST 생성/저장 실패 |

### 8.6 엔드투엔드 시퀀스

```text
Client(UI)
  -> WS RPC node.move(baseVersion, originId, commandId)
Server(methods.ts)
  -> validate params
  -> patcher(filePatcher.ts): optimistic lock + AST patch + atomic write
  -> return newVersion
  -> notify file.changed(version, originId, commandId)
Client
  -> if same origin: ignore notification
  -> else: reload + render
```

---

## 9. 데이터 모델

클라이언트 노드 메타:

```ts
type NodeKind = 'canvas' | 'mindmap';

interface SourceMeta {
  sourceId: string;   // 원본 TSX id
  scopeId?: string;   // mindmap id 등 스코프
  kind: NodeKind;
}
```

스토어 확장:

```ts
interface GraphState {
  sourceVersion: string | null;
  clientId: string;
  lastAppliedCommandId?: string;
}
```

---

## 10. AST 패치 전략

### 10.0 공통 규칙

1. 파서: `@babel/parser` with `plugins: ['jsx', 'typescript']`
2. 식별 기준: `id` JSX attribute가 문자열 리터럴인 노드
3. 생성 규칙: 숫자는 `JSXExpressionContainer(NumericLiteral)`로 저장 (`x={120}`)
4. 미지원 패턴: 동적 `id`, spread 내부 충돌, 런타임 계산식 기반 위치
5. 저장 규칙: 항상 **원자적 저장(atomic write)** 수행

원자적 저장 절차:

1. 파일 read
2. 현재 해시 계산 (`currentVersion`)
3. `currentVersion !== baseVersion`이면 `VERSION_CONFLICT` 반환
4. AST patch 수행
5. 코드 generate
6. `file.tmp`에 쓰기
7. `rename(file.tmp, file)`로 교체
8. 새 해시(`newVersion`) 반환

### 10.1 node.move

1. `id`로 JSX 노드 식별
2. `x`, `y` attribute 수정 또는 추가
3. 숫자 literal로 저장 (`x={120}`)

예시:

```tsx
// before
<Sticky id="api" x={100} y={120}>API</Sticky>

// after
<Sticky id="api" x={320} y={180}>API</Sticky>
```

### 10.2 mindmap.reparent

1. 대상 `<Node id="child">` 식별
2. `from` attribute를 새 부모로 교체
3. cycle 검증: 자식을 자신의 후손 아래로 이동 금지

예시:

```tsx
// before
<Node id="auth" from="backend">Auth</Node>

// after
<Node id="auth" from="gateway">Auth</Node>
```

### 10.3 mindmap.reorder

1. 동일 부모의 형제 노드 목록 AST에서 추출
2. `beforeNodeId` 또는 `index` 기준으로 JSX element 재배치

재배치 규칙:

1. 같은 부모 그룹 내에서만 허용
2. 대상 노드를 기존 위치에서 제거 후 삽입
3. 다른 속성/자식 JSX는 변경하지 않음

### 10.4 구현 단위(함수 시그니처 제안)

`app/ws/filePatcher.ts`에 아래 단위를 분리한다.

```ts
patchNodePosition(filePath, params): Promise<{ newVersion: string }>
patchMindmapReparent(filePath, params): Promise<{ newVersion: string }>
patchMindmapReorder(filePath, params): Promise<{ newVersion: string }>
```

공통 내부 유틸:

```ts
withOptimisticLock(filePath, baseVersion, mutateAst): Promise<{ newVersion: string }>
findJsxById(ast, nodeId): NodePath<t.JSXOpeningElement> | null
upsertJsxNumberAttr(openingEl, name, value): void
upsertJsxStringAttr(openingEl, name, value): void
```

---

## 11. 충돌/일관성 전략

1. 모든 수정 명령은 `baseVersion`, `originId`, `commandId`를 포함한다.
2. 서버는 패치 직전 해시를 비교해 낙관적 락(optimistic lock)을 수행한다.
3. 불일치 시 파일을 건드리지 않고 `VERSION_CONFLICT`를 반환한다.
4. 클라이언트는 충돌 시 최신 버전을 로드하고 사용자에게 재시도 안내를 표시한다.
5. 성공 시 서버는 `file.changed(version, originId, commandId)`를 전파한다.
6. 클라이언트는 동일 `originId` 알림을 무시해 update loop를 차단한다.

### 11.1 서버 의사코드

```ts
handleNodeMove(params) {
  validate(params);
  const result = withOptimisticLock(params.filePath, params.baseVersion, (ast) => {
    const target = findJsxById(ast, params.nodeId);
    if (!target) throw NODE_NOT_FOUND;
    upsertJsxNumberAttr(target, 'x', params.x);
    upsertJsxNumberAttr(target, 'y', params.y);
  });
  notifyFileChanged({ ...params, version: result.newVersion });
  return { success: true, newVersion: result.newVersion };
}
```

### 11.2 클라이언트 의사코드

```ts
onNodeDragStop(node) {
  send('node.move', { nodeId: node.id, x, y, baseVersion, originId, commandId });
}

onFileChanged(evt) {
  if (evt.originId === myClientId) return; // self-loop 방지
  reloadAndRender();
}
```

---

## 12. UX 규칙

1. 드래그 중 UI는 즉시 이동(optimistic)
2. 커밋 실패 시 원위치 롤백 + 토스트 표시
3. MindMap reparent는 의도치 않은 이동 방지를 위해 드롭 타겟 하이라이트 제공
4. 충돌 시 “파일이 외부에서 변경됨, 최신 상태로 재동기화” 메시지 노출

---

## 13. 구현 계획 (Phased)

### Phase 0: 기반 메타데이터

목표: 버전/노드 메타 전달 통로 확보

작업:

1. `/render` 응답에 `sourceVersion` 추가
2. 클라이언트 스토어에 `sourceVersion`, `clientId` 추가
3. 노드 `data`에 `sourceId`, `kind`, `scopeId` 기록

대상 파일:

- `libs/cli/src/server/http.ts`
- `app/store/graph.ts`
- `app/app/page.tsx`

### Phase 1: Canvas move 동기화

목표: 일반 노드 드래그 시 코드 좌표 반영

작업:

1. `GraphCanvas`에서 노드 드래그 활성화 및 `onNodeDragStop` 처리
2. `useFileSync`에 `node.move` 요청 함수 추가
3. WS 서버에 `node.move` 핸들러 추가
4. AST 패처에 `patchNodePosition` 구현

대상 파일:

- `app/components/GraphCanvas.tsx`
- `app/hooks/useFileSync.ts`
- `app/ws/methods.ts`
- `app/ws/filePatcher.ts`

### Phase 2: MindMap reparent/reorder

목표: 구조 편집을 코드로 저장

작업:

1. 드롭 타겟 판별 로직 추가
2. `mindmap.reparent` RPC + cycle validation
3. `mindmap.reorder` RPC + AST 노드 재배치

대상 파일:

- `app/components/GraphCanvas.tsx`
- `app/ws/methods.ts`
- `app/ws/filePatcher.ts`

### Phase 3: 안정화

목표: 충돌/오류 복구 및 테스트 강화

작업:

1. `baseVersion` 충돌 처리
2. self-origin 이벤트 무시
3. 실패 롤백 UX 정리
4. 단위/통합 테스트 보강

대상 파일:

- `app/hooks/useFileSync.ts`
- `app/ws/server.ts`
- `app/ws/methods.ts`
- `app/ws/filePatcher.ts`

---

## 14. 테스트 전략

### 단위 테스트

1. `patchNodePosition`가 정확히 `x/y`만 수정하는지 검증
2. `reparent` cycle 검증 로직 테스트
3. `reorder` AST 재배치 정확성 테스트

### 통합 테스트

1. WS RPC 요청 → 파일 변경 → 성공 응답 흐름
2. 버전 충돌 응답 처리

### 수동 시나리오 테스트

1. Canvas 노드 이동 후 파일 diff 확인
2. MindMap 부모 변경 후 렌더 구조 확인
3. 외부 파일 수정 중 동시 드래그 충돌 확인

---

## 15. 수용 기준 (Acceptance Criteria)

1. Canvas 노드 드래그 후 저장된 TSX에서 좌표 변경이 확인된다.
2. MindMap 노드 부모 변경 후 TSX의 `from`이 변경된다.
3. 충돌 발생 시 데이터 유실 없이 최신 상태로 복구된다.
4. 편집 실패 시 사용자에게 원인과 복구 결과가 명확히 표시된다.

---

## 16. 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| AST 생성 코드 포맷 흔들림 | PR/리뷰 노이즈 증가 | 필요 시 prettier 후처리 도입 |
| 복잡한 JSX 패턴 미지원 | 일부 파일 패치 실패 | 명확한 에러 + 수동 수정 가이드 |
| MindMap 드롭 오탐 | UX 혼란 | 드롭 타겟 하이라이트 + 확인 조건 강화 |
| 버전 충돌 빈발 | 편집 체감 저하 | 빠른 재동기화 + 충돌 메시지 단순화 |

---

## 17. 오픈 질문

1. MindMap reparent를 기본 드래그로 할지, modifier key(예: `Alt+Drop`)로 제한할지?
2. 동일 `id`가 여러 스코프에서 재사용될 때 source 매핑 정책은 무엇이 최선인지?
3. AST 패치 후 코드 포맷 안정화를 어떤 단계에서 강제할지?

---

## 18. 요약

양방향 편집은 “캔버스 조작을 코드 명령으로 번역”하는 기능입니다.  
이 PRD는 v1에서 가장 가치가 큰 흐름인 `node.move`와 `mindmap.reparent/reorder`를 단계적으로 도입하고, 버전 충돌 제어를 통해 안정성을 확보하는 실행 계획을 제공합니다.
