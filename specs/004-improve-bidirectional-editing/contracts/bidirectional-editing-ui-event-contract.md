# Contract: Focused Bidirectional Editing UI Events

## 목적

편집 완료 동작을 이벤트 1건 단위로 기록해 undo/redo를 정확히 제어한다.

## Event Types

| Event Type | Trigger | Persist Condition |
|------------|---------|-------------------|
| `ABSOLUTE_MOVE_COMMITTED` | 노드 드래그 종료 | `node.move` RPC 성공 |
| `TEXT_EDIT_COMMITTED` | 텍스트/Markdown 편집 확정 | `node.update({content})` RPC 성공 |
| `ATTACH_RELATIVE_COMMITTED` | attach 장식 이동 확정 | `node.update({at.offset|gap})` RPC 성공 |

## Event Payload

```ts
type EditCompletionEvent = {
  eventId: string;
  type: 'ABSOLUTE_MOVE_COMMITTED' | 'TEXT_EDIT_COMMITTED' | 'ATTACH_RELATIVE_COMMITTED';
  nodeId: string;
  selectedNodeIdAtCommit: string;
  filePath: string;
  commandId: string;
  baseVersion: string;
  newVersion: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  committedAt: number;
};
```

## Selection Isolation Contract

1. 텍스트/Markdown 편집 시작 시 `activeTextEditNodeId`를 설정한다.
2. 편집 중 selection이 바뀌면 기존 세션은 `commit-or-cancel` 정책으로 종료한다.
3. `activeTextEditNodeId`와 다른 노드로의 커밋 요청은 차단한다.
4. 비선택 노드 데이터는 현재 편집 이벤트로 절대 갱신하지 않는다.

## WYSIWYG Contract (Markdown)

1. 편집 UI는 현재 markdown renderer 지원 문법 범위와 동일하게 표시한다.
2. 편집 중 표시(preview)와 저장 후 렌더 결과가 동일해야 한다.
3. 미지원 문법은 원문 보존하되 "지원 범위 밖" 표시 정책을 따른다.

## Undo/Redo Contract

- `undo` 1회: `past`의 마지막 이벤트 1건만 inverse 반영
- `redo` 1회: `future`의 마지막 이벤트 1건만 replay 반영
- inverse/replay도 RPC 성공 시에만 스택을 이동한다.
- 중간 드래그 프레임/타이핑 프레임은 히스토리에 기록하지 않는다.

## Failure Handling Contract

| Failure | Handling |
|---------|----------|
| `VERSION_CONFLICT` | 로컬 optimistic 상태 롤백 + 재동기화 안내 |
| `ID_COLLISION` | 이벤트 기록 취소 + 중복 해결 안내 |
| `PATCH_FAILED` | 이벤트 기록 취소 + 실패 토스트 |

## Telemetry / Metrics Contract

- 이벤트당 최소 로깅 필드: `eventType`, `nodeId`, `commandId`, `baseVersion`, `newVersion`, `result`
- `result`는 `committed`, `rejected`, `undone`, `redone` 중 하나
- SC-008/SC-010 검증을 위해 이벤트 순서/카운트를 회귀 테스트에서 단언 가능해야 함
