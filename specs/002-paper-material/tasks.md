# Tasks: Paper Material Expansion

**Input**: Design documents from `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/specs/002-paper-material/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Includes explicit regression/contract tasks because the specification requires regression safety, fallback guarantees, and save/reopen consistency.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes at least one concrete file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared task scaffolding and compatibility boundaries before core feature edits

- [X] T001 Align shared material export surface in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/index.ts` and `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/types/washiTape.ts`
- [X] T002 [P] Add paper-material fixture constants for tests in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/__tests__/washi-tape.helpers.spec.ts` and `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapePattern.test.ts`
- [X] T003 [P] Add implementation checkpoints to `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/specs/002-paper-material/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contracts and shared normalization logic required by all user stories

**⚠️ CRITICAL**: No user story work starts before this phase is complete

- [X] T004 Expand preset catalog IDs/metadata in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/material/presets.ts`
- [X] T005 Extend material type contracts (`backgroundSize`, preset color override) in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/material/types.ts`
- [X] T006 Extend helper API `preset(id, opts?)` in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/material/helpers.ts`
- [X] T007 Refactor shared material normalization entry points in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapeDefaults.ts` and `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapePattern.ts` to support Sticky/Washi default preset split
- [X] T008 [P] Add core preset-registry contract assertions in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/material/presets.spec.ts`
- [X] T009 [P] Add shared fallback/debug-reason baseline tests in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapePattern.test.ts`

**Checkpoint**: Shared material and fallback foundations are complete

---

## Phase 3: User Story 1 - 프리셋 기반 메모 맥락 구분 (Priority: P1) 🎯 MVP

**Goal**: Sticky 기본 `postit` preset과 프리셋/모양 조합 렌더를 구현하고 저장-재열기 일관성을 확보한다.

**Independent Test**: `pattern` 없는 Sticky가 `postit`으로 렌더되고, `lined-warm/grid-standard/kraft-natural` + shape 조합이 저장/재열기 후 동일하게 유지된다.

### Tests for User Story 1

- [X] T010 [P] [US1] Add Sticky default preset render test in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/components/nodes/StickyNode.test.tsx`
- [X] T011 [P] [US1] Add Sticky preset round-trip parser test in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/app/page.test.tsx`
- [X] T012 [P] [US1] Add WS patch round-trip test for Sticky preset updates in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/ws/filePatcher.test.ts`

### Implementation for User Story 1

- [X] T013 [US1] Add `pattern` and shape normalization for `graph-sticky` parsing in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/app/page.tsx`
- [X] T014 [US1] Implement Sticky pattern-aware style resolution in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/components/nodes/StickyNode.tsx`
- [X] T015 [US1] Apply preset `backgroundSize` and text color inheritance in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/components/nodes/StickyNode.tsx`
- [X] T016 [US1] Preserve legacy `color` input via `solid(color)` bridge in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapeDefaults.ts`
- [X] T017 [US1] Ensure Sticky create/update RPC payload keeps `pattern` fields in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/ws/methods.ts` and `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/ws/filePatcher.ts`

**Checkpoint**: User Story 1 is independently functional (MVP)

---

## Phase 4: User Story 2 - 커스텀 소재 안전 적용 (Priority: P2)

**Goal**: SVG/image/solid 커스텀 소재를 안전하게 적용하고 invalid 입력에서 deterministic fallback을 제공한다.

**Independent Test**: 유효 커스텀 소재가 즉시 렌더되고, 무효 입력은 throw 없이 fallback + debug reason으로 처리된다.

### Tests for User Story 2

- [X] T018 [P] [US2] Add invalid-solid/invalid-svg/missing-svg-source fallback tests in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapePattern.test.ts`
- [X] T019 [P] [US2] Add image scale clamp and repeat-mode behavior tests in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapePattern.test.ts`
- [X] T020 [P] [US2] Add unknown preset ID fallback contract test in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapePattern.test.ts`

### Implementation for User Story 2

- [X] T021 [US2] Harden inline SVG sanitization and markup-length handling in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapePattern.ts`
- [X] T022 [US2] Enforce uniform fallback payload (`fallbackApplied`, `debugReason`) for all invalid material branches in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/washiTapePattern.ts`
- [X] T023 [US2] Ensure Sticky/Washi resolver parity for custom materials in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/components/nodes/StickyNode.tsx` and `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/components/nodes/WashiTapeNode.tsx`
- [X] T024 [US2] Preserve fallback-safe material payload through RPC update path in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/ws/methods.ts`

**Checkpoint**: User Stories 1 and 2 work independently and together

---

## Phase 5: User Story 3 - 위치/사이징 일관성 확보 (Priority: P3)

**Goal**: `at` 기반 위치와 사이징 정책(`auto`, `width-only`, `fixed frame`)을 일관되게 보장한다.

**Independent Test**: `at` 우선순위, `at.target` 스코프 해석, width/height 조합별 레이아웃/클리핑이 저장-재열기/내보내기 흐름에서 유지된다.

### Tests for User Story 3

- [X] T025 [P] [US3] Add `at > x,y` priority tests for Sticky placement in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/anchorResolver.test.ts`
- [X] T026 [P] [US3] Add `at.target` scope-resolution tests in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/reconciler/resolveTreeAnchors.spec.ts`
- [X] T027 [P] [US3] Add Sticky sizing-mode tests (auto/width-only/fixed+clip) in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/components/nodes/StickyNode.test.tsx`

### Implementation for User Story 3

- [X] T028 [US3] Extend `StickyProps` with `at` support and fallback rules in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/components/Sticky.tsx`
- [X] T029 [US3] Resolve `at.target` scoping using EmbedScope rules in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/libs/core/src/reconciler/resolveTreeAnchors.ts`
- [X] T030 [US3] Apply Sticky `at` placement resolution in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/utils/anchorResolver.ts`
- [X] T031 [US3] Implement Sticky width/height sizing and overflow clipping policy in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/components/nodes/StickyNode.tsx`
- [X] T032 [US3] Ensure parser keeps both legacy anchor props and new `at` props in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/app/app/page.tsx`

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify cross-story regression safety and finalize delivery quality

- [X] T033 [P] Update feature docs and migration notes in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/docs/features/paper-material/README.md`
- [X] T034 Run end-to-end regression command set from `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/specs/002-paper-material/quickstart.md`
- [X] T035 [P] Validate export consistency (PNG/JPEG/SVG/PDF) and capture results in `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/specs/002-paper-material/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user-story phases
- **Phase 3 (US1)**: Starts after Phase 2; MVP boundary
- **Phase 4 (US2)**: Starts after Phase 2; independent of US1 except shared files
- **Phase 5 (US3)**: Starts after Phase 2; independent validation with shared-file coordination
- **Phase 6 (Polish)**: Starts after desired user stories are complete

### User Story Dependencies

- **US1 (P1)**: No dependency on US2/US3
- **US2 (P2)**: Depends only on foundational material contracts
- **US3 (P3)**: Depends only on foundational contracts + placement utilities

### Within Each User Story

- Write or extend tests first, then implement contracts/resolvers, then parser/render integration
- Complete story acceptance checks before moving to lower-priority story

### Parallel Opportunities

- Foundational: `T008`, `T009` can run in parallel after `T004`-`T007`
- US1: `T010`, `T011`, `T012` parallel
- US2: `T018`, `T019`, `T020` parallel
- US3: `T025`, `T026`, `T027` parallel
- Polish: `T033`, `T035` parallel, then `T034`

---

## Parallel Example: User Story 1

```bash
Task: "Add Sticky default preset render test in app/components/nodes/StickyNode.test.tsx"
Task: "Add Sticky preset round-trip parser test in app/app/page.test.tsx"
Task: "Add WS patch round-trip test for Sticky preset updates in app/ws/filePatcher.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add invalid-solid/invalid-svg/missing-svg-source fallback tests in app/utils/washiTapePattern.test.ts"
Task: "Add image scale clamp and repeat-mode behavior tests in app/utils/washiTapePattern.test.ts"
Task: "Add unknown preset ID fallback contract test in app/utils/washiTapePattern.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Add at>x,y priority tests for Sticky placement in app/utils/anchorResolver.test.ts"
Task: "Add at.target scope-resolution tests in libs/core/src/reconciler/resolveTreeAnchors.spec.ts"
Task: "Add Sticky sizing-mode tests in app/components/nodes/StickyNode.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (US1)
4. Validate US1 independently (default postit + preset/shape round-trip)
5. Demo/deploy MVP increment

### Incremental Delivery

1. Setup + Foundational complete shared contracts
2. Deliver US1 for default/preset value
3. Deliver US2 for safe custom materials/fallback guarantees
4. Deliver US3 for positioning/sizing consistency
5. Finish polish and regression validation

### Parallel Team Strategy

1. Team completes Phases 1-2 together
2. Then parallelize by story:
   - Engineer A: US1
   - Engineer B: US2
   - Engineer C: US3
3. Merge with shared-file conflict sequencing (`app/app/page.tsx`, `StickyNode.tsx`, resolver files)

---

## Notes

- `[P]` tasks are safe parallel units when upstream dependencies are done
- Every story phase has independent test criteria and implementation checkpoints
- Keep diffs surgical around listed files to avoid cross-feature regressions
