# Data Model: Focused Bidirectional Editing for Existing Objects

## 1) EditableObject

- Purpose: 캔버스에서 편집 가능한 기존 오브젝트의 공통 식별 모델.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | 렌더 결과 전역 유일 식별자 |
| `kind` | `'absolute-node' \| 'textual-node' \| 'attached-decoration'` | Yes | 편집 종류 분류 |
| `type` | string | Yes | `shape/text/markdown/sticker/washi-tape` 등 노드 타입 |
| `sourceMeta.sourceId` | string | Yes | 소스 추적용 원본 id |
| `sourceMeta.scopeId` | string \| undefined | No | MindMap scope id |

### Validation

- `id`는 `GlobalIdentifierIndex` 기준으로 정확히 1회만 출현해야 한다.
- `attached-decoration`은 attach/anchor 참조 대상이 유효해야 한다.

## 2) GlobalIdentifierIndex

- Purpose: 편집 반영 전 전역 ID 유일성 검사를 위한 파생 인덱스.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `entries` | `Map<string, IdentifierOccurrence[]>` | Yes | id별 출현 목록 |
| `hasCollision` | boolean | Yes | 중복 존재 여부 |
| `collisionIds` | string[] | Yes | 충돌 id 목록 |

```ts
type IdentifierOccurrence = {
  id: string;
  jsxTag: string;
  filePath: string;
  line?: number;
};
```

### Validation

- `collisionIds.length === 0`이어야 편집 반영 가능.
- 충돌이 있으면 RPC는 `ID_COLLISION` 오류를 반환하고 patch를 수행하지 않는다.

## 3) TextEditSession

- Purpose: 텍스트/마크다운 편집의 선택 범위와 커밋 단위를 관리.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `activeNodeId` | string \| null | Yes | 현재 편집 대상 노드 id |
| `mode` | `'text' \| 'markdown-wysiwyg'` | No | 편집 모드 |
| `draftContent` | string | Yes | 미확정 편집 내용 |
| `baseVersion` | string | Yes | 커밋 기준 소스 버전 |
| `isDirty` | boolean | Yes | 수정 여부 |

### Validation

- `activeNodeId`가 아닌 노드에는 입력 이벤트/커밋 이벤트를 전달하지 않는다.
- `mode==='markdown-wysiwyg'`일 때 렌더 preview는 저장 렌더러와 동일 파이프라인을 사용한다.

## 4) RelativeAttachmentState

- Purpose: attach 장식 이동에서 절대 좌표 대신 상대 파라미터를 저장.

### 4-1) WashiAttachState

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `at.type` | `'attach'` | Yes | attach 모드 |
| `at.target` | string | Yes | 부모/타겟 노드 id |
| `at.placement` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'center'` | No | 부착 면 |
| `at.align` | number (0..1) | No | 부착 면 내 상대 정렬(이번 편집에서는 유지) |
| `at.offset` | number | No | 타겟으로부터 상대 오프셋(이번 편집에서 갱신) |
| `at.span` | number (0.1..1) | No | 부착 길이 비율 |

### 4-2) StickerAnchorState

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `anchor` | string | Yes | 부모 노드 id |
| `position` | AnchorPosition | Yes | 부착 방향 |
| `gap` | number | No | 거리 오프셋(이번 편집에서 갱신) |
| `align` | `'start' \| 'center' \| 'end'` | No | 정렬(이번 편집에서는 유지) |

### Validation

- 상대 이동 편집은 `Washi: at.offset`, `Sticker: gap`만 변경 가능하며 `align/placement/span/anchor/target`은 유지해야 한다.
- `Washi`는 partial `at` payload를 기존 `at` object와 merge해 비대상 필드(`target/placement/span/align`)를 보존해야 한다.
- 상대 편집 성공 후 재렌더 시 동일 위치가 재현되어야 한다.

## 5) EditCompletionEvent

- Purpose: undo/redo의 최소 단위 이벤트.

```ts
type EditCompletionEvent = {
  eventId: string;
  type: 'ABSOLUTE_MOVE_COMMITTED' | 'TEXT_EDIT_COMMITTED' | 'ATTACH_RELATIVE_COMMITTED';
  nodeId: string;
  filePath: string;
  commandId: string;
  baseVersion: string;
  nextVersion: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  committedAt: number;
};
```

### Validation

- 이벤트는 서버 커밋 성공 응답 이후에만 기록한다.
- 드래그 중간 상태/입력 중간 상태는 이벤트로 기록하지 않는다.

## 6) EditHistoryState

- Purpose: 이벤트 기반 undo/redo 스택.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `past` | `EditCompletionEvent[]` | Yes | undo 가능한 이벤트 스택 |
| `future` | `EditCompletionEvent[]` | Yes | redo 가능한 이벤트 스택 |
| `maxSize` | number | Yes | 히스토리 상한 |

### Rules

- 새 커밋 이벤트 추가 시 `future`는 비운다.
- undo 1회는 `past`의 마지막 이벤트 1건만 inverse 호출 후 `future`로 이동한다.
- redo 1회는 `future`의 마지막 이벤트 1건만 replay 호출 후 `past`로 이동한다.

## 7) RpcMutationEnvelope

- Purpose: 편집 커밋 공통 동시성 계약.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `filePath` | string | Yes | 대상 파일 |
| `baseVersion` | string | Yes | optimistic concurrency 기준 |
| `originId` | string | Yes | self-event suppression 식별자 |
| `commandId` | string | Yes | idempotency/event 연결 키 |

## Relationships

- `EditableObject.id` -> `GlobalIdentifierIndex.entries` (1:1 expected)
- `TextEditSession.activeNodeId` -> `EditableObject.id` (N:1 over time)
- `RelativeAttachmentState.target/anchor` -> `EditableObject.id` (N:1)
- `EditCompletionEvent.nodeId` -> `EditableObject.id` (N:1)
- `EditHistoryState.past/future[]` -> `EditCompletionEvent` (ordered)

## State Transitions

1. `Idle` -> `Editing`
   - Trigger: 노드 선택 + 편집 시작
   - Guard: 전역 ID 충돌 없음
2. `Editing` -> `Committing`
   - Trigger: drag stop / 편집 확정 액션
   - Action: RPC 요청(`node.move` 또는 `node.update`)
3. `Committing` -> `Committed`
   - Trigger: RPC 성공 + `newVersion` 수신
   - Action: `EditCompletionEvent` 1건 push
4. `Committing` -> `Rejected`
   - Trigger: `VERSION_CONFLICT`/`ID_COLLISION`/`PATCH_FAILED`
   - Action: 롤백 + 사용자 안내(재로드 또는 중복 해결)
5. `Committed` -> `Undoing`
   - Trigger: undo 입력
   - Action: 이벤트 1건 inverse RPC
6. `Undoing` -> `Undone`
   - Trigger: inverse 성공
   - Action: 이벤트를 `past -> future` 이동
7. `Undone` -> `Redoing`
   - Trigger: redo 입력
   - Action: 이벤트 1건 replay RPC
8. `Redoing` -> `Committed`
   - Trigger: replay 성공
   - Action: 이벤트를 `future -> past` 이동
