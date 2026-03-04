# Quickstart: Focused Bidirectional Editing for Existing Objects

## 목적

`004-improve-bidirectional-editing` 기능을 구현/검증하기 위한 최소 실행 절차.

## 작업 문서 링크

- 스펙: `specs/004-improve-bidirectional-editing/spec.md`
- 플랜: `specs/004-improve-bidirectional-editing/plan.md`
- 태스크: `specs/004-improve-bidirectional-editing/tasks.md`
- RPC 계약: `specs/004-improve-bidirectional-editing/contracts/bidirectional-editing-rpc-contract.md`
- UI 이벤트 계약: `specs/004-improve-bidirectional-editing/contracts/bidirectional-editing-ui-event-contract.md`

## 1) 준비

```bash
cd /Users/danghamo/Documents/gituhb/magam-bidirectional-editing-improvement
git checkout 004-improve-bidirectional-editing
bun install
```

## 2) 구현 순서

1. 서버 검증 계층 추가 (`app/ws/methods.ts`, `app/ws/rpc.ts`, `app/ws/filePatcher.ts`)
   - 전역 ID 인덱스 검사
   - `ID_COLLISION` 오류 코드 추가
   - 충돌 시 patch 미수행 + 안내 데이터 반환
2. 절대 좌표 이동 최소 patch 보강 (`app/components/GraphCanvas.tsx`, `app/hooks/useFileSync.ts`)
   - 드래그 완료 시점만 커밋
   - `x`,`y` 외 변경 금지 검증 테스트 추가
3. 텍스트/Markdown 단일 선택 편집 + WYSIWYG (`app/components/nodes/MarkdownNode.tsx`, `app/store/graph.ts`, `app/components/editor/WorkspaceClient.tsx`)
   - `activeTextEditNodeId` 기반 편집 세션
   - 저장 시 `content`만 patch
   - preview/저장 렌더 일치 검증
4. attach 장식 상대 편집 (`app/components/GraphCanvas.tsx`, `app/utils/anchorResolver.ts` 연계)
   - Washi attach: `at.offset`만 갱신 (`align/span/placement` 유지)
   - Sticker anchor: `gap`만 갱신 (`align/position` 유지)
5. 이벤트 기반 undo/redo (`app/store/graph.ts` 또는 편집 전용 history 모듈)
   - 편집 완료 이벤트 3종 기록
   - undo/redo 1회 = 이벤트 1건 inverse/replay

## 3) 체크포인트

- Checkpoint A: 절대 좌표 노드 이동 후 코드 diff가 `x`,`y`만 변경
- Checkpoint B: Markdown/텍스트 다중 노드 환경에서 선택 노드만 편집됨
- Checkpoint C: Markdown 편집 중 WYSIWYG 표시와 저장 후 렌더가 일치
- Checkpoint D: attach Sticker/Washi 이동이 상대 파라미터만 변경하고 관계 유지
- Checkpoint E: ID 충돌 상태에서 편집 반영이 거부되고 중복 해결 안내 노출
- Checkpoint F: undo/redo 1회가 편집 완료 이벤트 1건만 반영

## 4) 테스트

```bash
# WS mutation + patcher contracts
bun test app/ws/filePatcher.test.ts app/ws/methods.test.ts

# Render/anchor consistency (attach 상대 재현)
bun test app/features/render/parseRenderGraph.test.ts app/utils/anchorResolver.test.ts

# UI editing behavior (drag/text/wysiwyg/selection)
bun test app/components/GraphCanvas.test.tsx app/components/nodes/MarkdownNode.test.tsx app/components/editor/WorkspaceClient.test.tsx

# Relative attachment mapping
bun test app/utils/relativeAttachmentMapping.test.ts

# Store/history + file sync guard
bun test app/store/graph.test.ts app/hooks/useFileSync.test.ts

# Full regression
bun test
```

### 실행 노트

- `bun test` 전체 실행에는 Playwright E2E 스펙이 포함되어, `bun test` 환경에서는 `test.describe()/beforeEach()` 호출 오류로 실패할 수 있다.
- E2E는 별도 명령(`bun run test:e2e`)으로 실행한다.

## 5) 수동 검증 시나리오

1. 절대 좌표 노드를 이동하고 파일 diff에서 `x`,`y`만 변경되는지 확인한다.
2. Markdown 노드 2개를 만든 뒤 하나만 선택해 편집하고 비선택 노드가 변경되지 않는지 확인한다.
3. Markdown 편집 중 화면 표시와 저장 후 화면 표시가 동일한지 확인한다.
4. attach된 Washi/Sticker를 이동한 뒤 `Washi: at.offset`, `Sticker: gap`만 바뀌고 `target/anchor`는 유지되는지 확인한다.
5. 의도적으로 중복 `id`를 만든 뒤 편집을 시도해 저장 거부와 안내 메시지를 확인한다.
6. 편집 3종 각각에서 undo/redo를 1회씩 실행해 이벤트 단위 복원이 되는지 확인한다.

## 6) 정량 검증 기준

- SC-001: 절대 좌표 이동 회귀의 95%+에서 `x`,`y`만 변경
- SC-002: 텍스트 편집 회귀의 95%+에서 대상 children만 변경
- SC-003: attach 이동 회귀의 95%+에서 상대값만 변경 + 관계 유지
- SC-005: 충돌/유효성 실패의 100%에서 부분 반영 없음
- SC-006: Markdown WYSIWYG 일치율 95%+
- SC-007: 다중 텍스트/마크다운에서 비선택 변경률 1% 미만(정확도 99%+)
- SC-008: undo 1회 이벤트 단위 정확도 99%+
- SC-009: ID 충돌 차단율 100%
- SC-010: redo 1회 이벤트 단위 정확도 99%+
- SC-011: 전역 유일성 위반 탐지율 100%

## 7) 최종 회귀 스냅샷 (2026-03-03)

- `bun test app/ws/filePatcher.test.ts app/ws/methods.test.ts app/store/graph.test.ts app/hooks/useFileSync.test.ts app/components/GraphCanvas.test.tsx app/components/editor/WorkspaceClient.test.tsx app/components/nodes/MarkdownNode.test.tsx app/utils/relativeAttachmentMapping.test.ts`
  - 결과: **PASS** (60 pass / 0 fail)
- `bun test`
  - 결과: **FAIL (기능 외 기존 이슈)**  
  - 실패 요약:
    - `e2e/*.spec.ts` Playwright 스펙이 `bun test` 러너에서 직접 실행되어 오류
    - `libs/runtime/src/lib/runtime.spec.ts` 기존 unlink mock 기대 실패
  - 본 기능 변경 영역(ws patch, graph history, UI 편집/매핑) 회귀는 위 scoped 테스트에서 PASS 확인
