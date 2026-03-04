# Contract: Focused Bidirectional Editing RPC

## 목적

기존 WS JSON-RPC 편집 경로에서 "최소 변경 + 이벤트 단위 커밋 + 전역 ID 유일성 보장"을 강제한다.

## Producer / Consumer

- Producer: `useFileSync` (`app/hooks/useFileSync.ts`)
- Transport: JSON-RPC 2.0 WebSocket (`app/ws/server.ts`)
- Consumer: `app/ws/methods.ts`, `app/ws/filePatcher.ts`

## 공통 요청 계약

| Field | Required | Type | Description |
|------|----------|------|-------------|
| `filePath` | Yes | string | 대상 TSX 파일 |
| `baseVersion` | Yes | string | optimistic concurrency 기준 버전 |
| `originId` | Yes | string | 클라이언트 식별자 |
| `commandId` | Yes | string | 커밋/이벤트 매핑 키 |

## 메서드 계약

### 1) `node.move`

- Request fields: `nodeId: string`, `x: number`, `y: number`
- Allowed mutation: 대상 JSX element의 `x`, `y` 속성만 변경
- Forbidden mutation: `id/from/to/anchor/content/children/structure` 변경

### 2) `node.update` (텍스트/마크다운)

- Request fields: `nodeId: string`, `props: { content: string }`
- Allowed mutation:
  - Markdown child가 존재하면 해당 Markdown 템플릿 문자열만 갱신
  - 일반 텍스트 child면 텍스트 child만 갱신
- Forbidden mutation: 대상 외 노드 변경, 선택되지 않은 텍스트 노드 변경

### 3) `node.update` (attach 상대 이동)

- Washi attach: `props.at.offset`만 변경
- Sticker anchor: `props.gap`만 변경
- Forbidden mutation: `target/anchor/placement/span/align` 변경, 절대 좌표 강제 저장
- Server merge rule:
  - `props.at`이 partial payload여도 기존 `at` object와 merge하여 `offset` 외 필드는 보존
  - `props.gap` 갱신 시 `anchor/position/align`은 유지

## Validation Contract

서버는 patch 수행 전 다음 검증을 순서대로 수행한다.

1. `baseVersion` 일치 여부 검증
2. 전역 ID 유일성 검증 (`GlobalIdentifierIndex`)
3. 대상 노드 존재 및 파라미터 타입 검증
4. patch 실행

## Error Contract

| Error | Code | Condition | UX Action |
|------|------|-----------|-----------|
| `INVALID_PARAMS` | `40001` | 필수 필드 누락/타입 오류 | 입력 재시도 안내 |
| `NODE_NOT_FOUND` | `40401` | 대상 노드 식별 실패 | 최신 상태 재동기화 안내 |
| `VERSION_CONFLICT` | `40901` | `baseVersion` 불일치 | 저장 거부 + 재로드 안내 |
| `ID_COLLISION` | `40903` (new) | 렌더 결과 전역 ID 중복 감지 | 저장 거부 + 중복 해결 안내 |
| `PATCH_FAILED` | `50001` | AST patch 실패 | 반영 실패 안내 |

## Notification Contract

성공한 커밋만 `file.changed` notification을 전파한다.

```json
{
  "method": "file.changed",
  "params": {
    "filePath": "...",
    "version": "sha256:...",
    "originId": "client-...",
    "commandId": "uuid-...",
    "timestamp": 0
  }
}
```

## Compatibility

- 기존 `node.create`, `node.reparent` 계약은 유지한다(이번 기능 범위 밖).
- 기존 `VERSION_CONFLICT`/self-event suppression 동작(`originId + commandId`)은 그대로 유지한다.
- ID 충돌 검증은 편집 커밋에만 강제하며, 충돌 상태 자동 수정은 수행하지 않는다(Option A).
