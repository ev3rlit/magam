# Contract: Paper Material RPC Editing

## 목적

WebSocket JSON-RPC 편집 경로(`app/ws/methods.ts`, `app/ws/filePatcher.ts`)에서 Sticky/Washi 소재 props를 생성/수정할 때의 입력 및 동작 계약을 정의한다.

## Methods

### `node.create`

- 공통 envelope(`filePath`, `baseVersion`, `originId`, `commandId`)는 기존 계약 유지.
- `sticker`(현재 Sticky 생성 경로) 및 `washi-tape` 타입 모두 `pattern`/`at` props를 허용한다.

#### Node Payload

| Field | Required | Type | Description |
|------|----------|------|-------------|
| `node.id` | Yes | string | 생성 노드 ID |
| `node.type` | Yes | `'shape' \| 'text' \| 'markdown' \| 'mindmap' \| 'sticker' \| 'washi-tape'` | 노드 타입 |
| `node.props.pattern` | No | `PaperMaterial` | 소재 정의 |
| `node.props.at` | No | `AtDef` | 위치 정의 |
| `node.props.color` | No | string | 하위호환 입력 |

#### Behavior

1. `sticker` 생성 시 file patcher는 `<Sticky ... />` JSX를 생성하고 `pattern`/`at`를 유지한다.
2. `washi-tape` 생성 시 `<WashiTape ... />` JSX를 생성한다.
3. `baseVersion` 충돌 시 `VERSION_CONFLICT`.
4. 성공 시 `{ success: true, newVersion, commandId }` 반환 + `file.changed` 이벤트 발행.

### `node.update`

- 부분 업데이트를 유지하며 `pattern`, `at`, `color`, `width`, `height`, `shape` 필드를 patch 가능해야 한다.
- `pattern` 업데이트는 기존 소재를 완전히 대체한다(merge 아님).

### `node.move`

- 좌표 이동 계약은 기존과 동일.
- 단, `at` 기반 노드에서 위치 충돌이 발생하면 렌더 단계에서 `at` 우선 규칙이 적용된다.

## Error Contract

| Error | Condition |
|------|-----------|
| `INVALID_PARAMS` | 필수 필드 누락, 타입 불일치 |
| `VERSION_CONFLICT` | `baseVersion` 불일치 |
| `PATCH_FAILED` | AST patch 실패 |
| `NODE_NOT_FOUND` | update/move 대상 미존재 |

## Material/Fallback Rules

- 무효 `pattern`은 저장을 차단하지 않고 런타임 fallback으로 처리한다.
- fallback 발생 시 클라이언트는 `fallbackApplied`와 `debugReason`를 제공해야 한다.
- unknown preset ID는 기본 preset으로 대체한다.

## Compatibility Notes

- 기존 `sticker` 흐름(Sticky)과 `washi-tape` 흐름 모두 회귀 없이 동작해야 한다.
- 과거 문서의 `color`/`anchor` 중심 노드도 update/create 경로에서 손실 없이 round-trip 되어야 한다.
- 자기 반영 차단(`originId + commandId`) 규칙은 기존과 동일하게 유지한다.
