# Tasks: Focused Bidirectional Editing for Existing Objects

**Input**: Design documents from `/specs/004-improve-bidirectional-editing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: 포함됨. 본 스펙은 독립 테스트 시나리오와 정량 성공 기준(SC-001~SC-011)을 명시하므로, 스토리별 테스트 태스크를 생성한다.

**Organization**: 태스크는 사용자 스토리별로 분리되어 각 스토리를 독립 구현/검증 가능하게 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 수행 가능(서로 다른 파일, 선행 미완료 의존 없음)
- **[Story]**: 사용자 스토리 라벨 (US1, US2, US3)
- 각 태스크는 정확한 파일 경로를 포함

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 기능 개발에 필요한 공통 골격과 피처 전용 테스트 뼈대 준비

- [X] T001 Add feature-specific test fixture TSX scenarios for move/text/attach in app/ws/__fixtures__/bidirectional-editing.tsx
- [X] T002 [P] Add shared test helpers for minimal-diff assertions in app/ws/testUtils.ts
- [X] T003 [P] Add feature task entry links and execution notes in specs/004-improve-bidirectional-editing/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리 구현 전에 반드시 필요한 공통 기반

**⚠️ CRITICAL**: 이 단계 완료 전에는 사용자 스토리 구현 시작 금지

- [X] T004 Add `ID_COLLISION` RPC error contract in app/ws/rpc.ts
- [X] T005 Implement global identifier collision detector in app/ws/filePatcher.ts
- [X] T006 Wire collision guard into `node.move` and `node.update` handlers in app/ws/methods.ts
- [X] T007 [P] Add foundational RPC tests for `VERSION_CONFLICT` and `ID_COLLISION` in app/ws/methods.test.ts
- [X] T008 Introduce shared edit completion event model and history stacks in app/store/graph.ts
- [X] T009 Add shared undo/redo command plumbing for event inverse/replay in app/hooks/useFileSync.ts
- [X] T010 Add common failure-to-toast mapping helper for edit flows in app/components/editor/WorkspaceClient.tsx

**Checkpoint**: 공통 기반 완료 - 사용자 스토리 구현 시작 가능

---

## Phase 3: User Story 1 - Move Absolute Nodes Safely (Priority: P1) 🎯 MVP

**Goal**: 절대 좌표 노드 이동을 `x`,`y` 변경으로만 안전 반영하고 이벤트 단위 undo/redo를 보장

**Independent Test**: 드래그 이동 후 코드 diff가 `x`,`y`만 바뀌고, undo/redo 1회가 이동 이벤트 1건만 반영되는지 확인

### Tests for User Story 1

- [X] T011 [P] [US1] Add regression test for `patchNodePosition` x/y-only mutation in app/ws/filePatcher.test.ts
- [X] T012 [P] [US1] Add drag-stop single-commit behavior test in app/components/GraphCanvas.test.tsx
- [X] T013 [P] [US1] Add move event undo/redo one-step test in app/store/graph.test.ts

### Implementation for User Story 1

- [X] T014 [US1] Enforce one-commit-per-drag-stop flow in app/components/GraphCanvas.tsx
- [X] T015 [US1] Ensure move mutation path updates only `x`,`y` and rejects non-target writes in app/ws/filePatcher.ts
- [X] T016 [US1] Emit `ABSOLUTE_MOVE_COMMITTED` event on successful move commit in app/store/graph.ts
- [X] T017 [US1] Implement inverse/replay handling for move event in app/hooks/useFileSync.ts
- [X] T018 [US1] Surface move conflict rejection guidance (`VERSION_CONFLICT`/`ID_COLLISION`) in app/components/GraphCanvas.tsx

**Checkpoint**: US1 단독으로 기능/테스트 통과 가능 (MVP)

---

## Phase 4: User Story 2 - Edit Textual Children in Place (Priority: P2)

**Goal**: 텍스트/Markdown 편집을 선택 노드 1개에 한정하고 WYSIWYG 일치성을 보장

**Independent Test**: 다중 텍스트/마크다운 노드에서 선택된 노드만 편집되며 저장 diff가 해당 children 변경만 반영되는지 확인

### Tests for User Story 2

- [X] T019 [P] [US2] Add content-only patch regression tests for text/markdown nodes in app/ws/filePatcher.test.ts
- [X] T020 [P] [US2] Add selection-isolation tests for multi-text editing in app/components/editor/WorkspaceClient.test.tsx
- [X] T021 [P] [US2] Add WYSIWYG parity tests (edit preview equals saved render) in app/components/nodes/MarkdownNode.test.tsx

### Implementation for User Story 2

- [X] T022 [US2] Implement selected-node WYSIWYG editing UI in app/components/nodes/MarkdownNode.tsx
- [X] T023 [US2] Add text edit session state (`activeTextEditNodeId`, draft lifecycle) in app/store/graph.ts
- [X] T024 [US2] Wire commit/cancel flow to send `node.update({ content })` only for active node in app/components/editor/WorkspaceClient.tsx
- [X] T025 [US2] Emit `TEXT_EDIT_COMMITTED` event for successful text saves in app/store/graph.ts
- [X] T026 [US2] Implement undo/redo inverse/replay for text edit events in app/hooks/useFileSync.ts
- [X] T027 [US2] Add explicit rejection messaging for text save failures in app/components/editor/WorkspaceClient.tsx

**Checkpoint**: US2 단독으로 기능/테스트 통과 가능 (US1 회귀 없음)

---

## Phase 5: User Story 3 - Reposition Attached Sticker and Washi Tape Relatively (Priority: P3)

**Goal**: attach 장식 이동을 상대값만 반영(`Washi: at.offset`, `Sticker: gap`)하고 attach 관계를 유지

**Independent Test**: attach 장식 이동 후 코드 diff가 `at.offset` 또는 `gap`만 변경되고 `target/anchor/align/span/placement`이 유지되는지 확인

### Tests for User Story 3

- [X] T028 [P] [US3] Add patch regression tests for `Washi: at.offset only` and `Sticker: gap only` in app/ws/filePatcher.test.ts
- [X] T029 [P] [US3] Add relative mapping unit tests for offset/gap math in app/utils/relativeAttachmentMapping.test.ts
- [X] T030 [P] [US3] Add invalid attach-target rejection tests in app/components/editor/WorkspaceClient.test.tsx

### Implementation for User Story 3

- [X] T031 [US3] Implement relative drag mapping utility returning `at.offset`/`gap` deltas in app/utils/relativeAttachmentMapping.ts
- [X] T032 [US3] Integrate attach drag-stop branch to call `node.update` with `Washi: { at: { ...at, offset } }` and `Sticker: { gap }` in app/components/editor/WorkspaceClient.tsx
- [X] T033 [US3] Preserve non-target relative fields (`align/span/placement/target/anchor`) during attach updates in app/ws/filePatcher.ts
- [X] T034 [US3] Emit `ATTACH_RELATIVE_COMMITTED` event on successful attach-relative saves in app/store/graph.ts
- [X] T035 [US3] Implement undo/redo inverse/replay for attach-relative events in app/hooks/useFileSync.ts
- [X] T036 [US3] Add attach rejection guidance for missing parent/target in app/components/editor/WorkspaceClient.tsx

**Checkpoint**: US3 단독으로 기능/테스트 통과 가능 (US1, US2 회귀 없음)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 스토리 공통 품질 보강 및 릴리스 검증

- [X] T037 [P] Update contract/data-model consistency notes for offset/gap-only attach mapping in specs/004-improve-bidirectional-editing/contracts/bidirectional-editing-rpc-contract.md
- [X] T038 [P] Add consolidated regression command notes in specs/004-improve-bidirectional-editing/quickstart.md
- [X] T039 Run full regression and record final pass/fail snapshot in specs/004-improve-bidirectional-editing/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 진행, 모든 사용자 스토리의 선행 조건
- **Phase 3~5 (User Stories)**: Phase 2 완료 후 진행
  - 기본 권장 순서: US1(P1) → US2(P2) → US3(P3)
  - 팀 여건 시 병렬 가능하나, 공통 파일 충돌 주의(`app/store/graph.ts`, `app/hooks/useFileSync.ts`)
- **Phase 6 (Polish)**: 대상 사용자 스토리 완료 후 진행

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 즉시 시작, 독립 MVP
- **US2 (P2)**: Foundational 이후 시작 가능, US1과 독립 테스트 가능
- **US3 (P3)**: Foundational 이후 시작 가능, US1/US2와 독립 테스트 가능

### Within Each User Story

- 테스트 태스크 작성/갱신 → 구현 태스크 → 스토리 체크포인트 검증 순서
- 이벤트 기록 태스크는 해당 스토리의 커밋 태스크 이후 수행
- undo/redo inverse/replay 태스크는 이벤트 정의 완료 후 수행

### Parallel Opportunities

- Setup의 `[P]` 태스크(T002, T003) 병렬 가능
- Foundational의 `[P]` 태스크(T007) 병렬 가능
- US1 테스트(T011~T013) 병렬 가능
- US2 테스트(T019~T021) 병렬 가능
- US3 테스트(T028~T030) 병렬 가능
- Polish의 `[P]` 태스크(T037, T038) 병렬 가능

---

## Parallel Example: User Story 1

```bash
# Run US1 tests in parallel workstreams
Task: "T011 [US1] patchNodePosition x/y-only regression in app/ws/filePatcher.test.ts"
Task: "T012 [US1] drag-stop single-commit test in app/components/GraphCanvas.test.tsx"
Task: "T013 [US1] move undo/redo one-step test in app/store/graph.test.ts"
```

## Parallel Example: User Story 2

```bash
# Run US2 tests in parallel workstreams
Task: "T019 [US2] content-only patch tests in app/ws/filePatcher.test.ts"
Task: "T020 [US2] selection isolation tests in app/components/editor/WorkspaceClient.test.tsx"
Task: "T021 [US2] WYSIWYG parity tests in app/components/nodes/MarkdownNode.test.tsx"
```

## Parallel Example: User Story 3

```bash
# Run US3 tests in parallel workstreams
Task: "T028 [US3] attach patch regression tests in app/ws/filePatcher.test.ts"
Task: "T029 [US3] offset/gap mapping tests in app/utils/relativeAttachmentMapping.test.ts"
Task: "T030 [US3] invalid attach target rejection tests in app/components/editor/WorkspaceClient.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 완료
2. Phase 2 완료 (필수 선행)
3. Phase 3 (US1) 완료
4. US1 독립 검증 후 데모/리뷰

### Incremental Delivery

1. Foundation 완료 후 US1 배포 가능 상태 확보
2. US2 추가 후 텍스트/WYSIWYG 품질 검증
3. US3 추가 후 attach 상대 이동 완성
4. 각 단계마다 회귀 검증 및 실패 케이스 메시지 확인

### Parallel Team Strategy

1. 한 명은 WS/RPC 경계(T004~T007), 다른 한 명은 스토어/히스토리(T008~T010)
2. Foundation 이후 스토리별 담당 분리
   - A: US1
   - B: US2
   - C: US3
3. 공통 파일 병합 순서 사전 합의 (`app/store/graph.ts`, `app/hooks/useFileSync.ts`)

---

## Notes

- 모든 태스크는 체크리스트 포맷(`- [X] T### ...`)을 준수한다.
- 사용자 스토리 단계 태스크는 반드시 `[US#]` 라벨을 포함한다.
- attach 편집 범위는 플랜 합의에 따라 `Washi: at.offset`, `Sticker: gap`만 수정 대상으로 고정한다.
- 각 스토리는 독립 테스트 통과를 완료 기준으로 삼는다.
