# Tasks: Frame API Implementation

**Input**: Design documents from `/Users/danghamo/Documents/gituhb/notes/docs/reports/file-based-component-analysis/`
**Prerequisites**: `PLAN.md` (required), `README.md`, `ANALYSIS.md`

**Tests**: 포함한다. 이번 작업은 공개 API와 런타임 경계를 바꾸므로 회귀 테스트와 신규 시나리오 테스트가 필수다.

**Organization**: `spec.md`가 없는 대신 `PLAN.md`의 단계별 산출물을 기준으로 독립 구현 가능한 작업 흐름으로 정리한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: Which implementation stream this task belongs to (`US1`-`US4`)
- 모든 task는 실제 수정 대상 파일 경로를 포함한다

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 구현 범위와 공개 API 경계를 코드 기준으로 고정한다.

- [ ] T001 정리된 구현 기준과 공개 API 목표를 `/Users/danghamo/Documents/gituhb/notes/docs/reports/file-based-component-analysis/PLAN.md`와 `/Users/danghamo/Documents/gituhb/notes/docs/reports/file-based-component-analysis/README.md`에 맞춰 재검증한다
- [ ] T002 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/index.ts`의 현재 공개 export 목록과 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/publicApiBoundary.spec.ts`의 경계를 비교해 변경 포인트를 목록화한다
- [ ] T003 [P] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/MindMapEmbed.tsx`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/EmbedScope.tsx`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/hooks/useMindMapScopedProps.ts`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/hooks/useNodeId.ts`의 역할 분담을 정리한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 새 `frame(...)` 공개 API를 수용할 기반 타입과 내부 메타 모델을 먼저 만든다.

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 개별 사용자 스토리 구현을 시작하지 않는다.

- [ ] T004 신규 `frame` helper와 관련 타입을 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/frame.tsx`에 정의한다
- [ ] T005 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/index.ts`에서 `frame(...)`와 필요한 타입만 공개 export 하도록 추가하고 저수준 primitive export 축소 전략을 반영한다
- [ ] T006 [P] frame definition과 frame instance를 구분하는 내부 메타 타입을 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/lib/core.ts` 또는 적절한 공통 타입 파일에 추가한다
- [ ] T007 [P] frame instance의 local scope, mount parent, source file을 담는 공통 메타 전달 규칙을 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/context/EmbedScopeContext.tsx`와 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/context/MindMapEmbedContext.tsx` 기준으로 설계 반영한다
- [ ] T008 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/publicApiBoundary.spec.ts`에 `frame(...)` 공개 경계 테스트를 추가한다

**Checkpoint**: `frame(...)`를 도입할 최소한의 공개 API와 내부 메타 모델이 준비된다.

---

## Phase 3: User Story 1 - Frame Public API (Priority: P1) 🎯 MVP

**Goal**: 사용자가 일반 React 컴포넌트를 `frame(...)`으로 정의하고 Canvas/MindMap에서 일반 컴포넌트처럼 사용할 수 있게 만든다.

**Independent Test**: `frame(...)`으로 정의한 동일 컴포넌트를 Canvas와 MindMap에서 각각 한 번씩 렌더했을 때 기본 `id`/`from`/`anchor` 해석이 정상 동작한다.

### Tests for User Story 1

- [ ] T009 [P] [US1] `frame(...)` 공개 API 사용 시나리오 테스트를 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/publicApiBoundary.spec.ts`에 추가한다
- [ ] T010 [P] [US1] Canvas에서 `frame(...)` 정의 컴포넌트 단일 배치 렌더 테스트를 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/embedScope.spec.tsx`에 추가한다
- [ ] T011 [P] [US1] MindMap에서 `frame(...)` 정의 컴포넌트 단일 배치 렌더 테스트를 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/renderer.spec.tsx`에 추가한다

### Implementation for User Story 1

- [ ] T012 [US1] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/frame.tsx`에 definition-time helper 동작과 frame 메타 부착 로직을 구현한다
- [ ] T013 [US1] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Canvas.tsx`와 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/MindMap.tsx`에서 frame instance props를 수용할 수 있게 연결한다
- [ ] T014 [US1] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Shape.tsx`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Sticky.tsx`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Node.tsx`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Edge.tsx`에서 frame local id 규칙과 mount props를 해석하도록 반영한다
- [ ] T015 [US1] `/Users/danghamo/Documents/gituhb/notes/examples/frame_canvas.tsx`와 `/Users/danghamo/Documents/gituhb/notes/examples/frame_mindmap.tsx` 예제를 추가해 새 공개 API를 문서화 가능한 상태로 만든다

**Checkpoint**: `frame(...)` 기반 단일 재사용 시나리오가 Canvas/MindMap에서 모두 동작한다.

---

## Phase 4: User Story 2 - Unified Runtime Mounting (Priority: P1)

**Goal**: Canvas scoping과 MindMap subtree mount를 공통 frame mount 모델로 통합해 로컬 `id`/`anchor`/`from`/`to` 재작성이 일관되게 동작하게 만든다.

**Independent Test**: 같은 frame을 동일 렌더 트리에서 두 번 배치해도 충돌 없이 fully-qualified id가 생성되고, `anchor`와 `from` 연결이 각각 올바른 대상을 가리킨다.

### Tests for User Story 2

- [ ] T016 [P] [US2] Canvas에서 동일 frame 2회 배치 시 id 충돌 방지 테스트를 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/embedScope.spec.tsx`에 추가한다
- [ ] T017 [P] [US2] MindMap에서 동일 frame 2회 배치 시 `from` 연결 재작성 테스트를 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/renderer.spec.tsx`에 추가한다
- [ ] T018 [P] [US2] `anchor` 자동 재해석 회귀 테스트를 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/reconciler/resolveTreeAnchors.spec.ts`에 추가한다

### Implementation for User Story 2

- [ ] T019 [US2] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/hooks/useNodeId.ts`와 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/hooks/useMindMapScopedProps.ts`를 frame 공통 메타 모델 기준으로 정리한다
- [ ] T020 [US2] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/reconciler/resolveTreeAnchors.ts`와 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/reconciler/resolveMindMapEmbeds.ts`를 공통 frame mount 처리 규칙에 맞게 갱신한다
- [ ] T021 [US2] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/EmbedScope.tsx`와 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/MindMapEmbed.tsx`를 내부 lowering target 또는 thin wrapper 역할로 재정의한다
- [ ] T022 [US2] `/Users/danghamo/Documents/gituhb/notes/app/features/render/parseRenderGraph.ts`에서 frame local scope 메타를 일관되게 읽도록 갱신한다

**Checkpoint**: 동일 frame 재사용과 기본 mount 재작성 규칙이 Canvas/MindMap에서 모두 일관되게 동작한다.

---

## Phase 5: User Story 3 - Nested Frame Composition (Priority: P2)

**Goal**: frame 안에 하위 frame을 중첩할 수 있고, 중첩된 로컬 id 공간이 충돌 없이 확장되도록 만든다.

**Independent Test**: 부모 frame 내부에 자식 frame을 마운트한 후 외부 Canvas에서 `auth.cache.worker` 같은 경로로 참조했을 때 일관된 fully-qualified id가 생성된다.

### Tests for User Story 3

- [ ] T023 [P] [US3] Canvas nested frame 렌더와 fully-qualified id 생성 테스트를 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/embedScope.spec.tsx`에 추가한다
- [ ] T024 [P] [US3] MindMap nested frame mount 테스트를 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/renderer.spec.tsx`에 추가한다
- [ ] T025 [P] [US3] nested frame 메타가 parse graph에 보존되는 테스트를 `/Users/danghamo/Documents/gituhb/notes/app/features/render/parseRenderGraph.test.ts`에 추가한다

### Implementation for User Story 3

- [ ] T026 [US3] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/frame.tsx`에 nested frame namespace 결합 규칙을 구현한다
- [ ] T027 [US3] `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Group.tsx`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Canvas.tsx`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/MindMap.tsx`에서 하위 frame mount를 수용하도록 갱신한다
- [ ] T028 [US3] `/Users/danghamo/Documents/gituhb/notes/examples/frame_canvas.tsx`와 `/Users/danghamo/Documents/gituhb/notes/examples/frame_mindmap.tsx`를 nested frame 예시까지 확장한다

**Checkpoint**: nested frame이 1급 기능으로 동작하고 외부 참조 규칙이 문서 예시 수준에서 검증된다.

---

## Phase 6: User Story 4 - Source Tracing and Editor Routing (Priority: P2)

**Goal**: frame definition/source metadata와 편집 라우팅을 새 API에 맞춰 유지해, 중첩 frame 내부 노드도 원본 파일로 편집 대상이 계산되게 만든다.

**Independent Test**: 외부 파일에 정의된 nested frame 내부 노드를 클릭했을 때 편집 대상이 현재 파일이 아니라 실제 frame 정의 파일로 계산된다.

### Tests for User Story 4

- [ ] T029 [P] [US4] frame-aware source metadata 주입 테스트를 `/Users/danghamo/Documents/gituhb/notes/app/features/render/parseRenderGraph.test.ts`에 추가한다
- [ ] T030 [P] [US4] nested frame 편집 라우팅 테스트를 `/Users/danghamo/Documents/gituhb/notes/app/components/editor/WorkspaceClient.test.tsx`에 추가한다

### Implementation for User Story 4

- [ ] T031 [US4] `/Users/danghamo/Documents/gituhb/notes/libs/cli/src/server/http.ts`에서 frame definition/source metadata와 nested instance path를 주입하도록 확장한다
- [ ] T032 [US4] `/Users/danghamo/Documents/gituhb/notes/app/components/editor/workspaceEditUtils.ts`에서 frame-aware edit target 계산 로직을 추가한다
- [ ] T033 [US4] `/Users/danghamo/Documents/gituhb/notes/app/components/editor/WorkspaceClient.tsx`에서 새 metadata를 사용하는 편집 흐름을 보강한다

**Checkpoint**: 새 `frame(...)` API를 사용한 외부 파일/중첩 구조에서도 편집 라우팅이 깨지지 않는다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 호환성, 문서, 예제, 회귀 안전성을 마무리한다.

- [ ] T034 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/EmbedScope.tsx`와 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/MindMapEmbed.tsx`에 저수준 API 경고 주석 또는 deprecation 안내를 추가한다
- [ ] T035 [P] `/Users/danghamo/Documents/gituhb/notes/docs/reports/file-based-component-analysis/README.md`와 `/Users/danghamo/Documents/gituhb/notes/docs/reports/file-based-component-analysis/PLAN.md`를 실제 구현 결과에 맞춰 업데이트한다
- [ ] T036 [P] `/Users/danghamo/Documents/gituhb/notes/examples/embed_scope.tsx` 또는 후속 예제 파일을 정리해 frame 중심 예제 우선순위를 반영한다
- [ ] T037 전체 관련 테스트를 실행하고 실패 시 `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/publicApiBoundary.spec.ts`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/embedScope.spec.tsx`, `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/renderer.spec.tsx`, `/Users/danghamo/Documents/gituhb/notes/app/features/render/parseRenderGraph.test.ts`, `/Users/danghamo/Documents/gituhb/notes/app/components/editor/WorkspaceClient.test.tsx`를 기준으로 수정한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작, 모든 user story를 block 한다
- **US1 (Phase 3)**: Foundational 완료 후 시작 가능한 MVP
- **US2 (Phase 4)**: US1 기본 공개 API 형태가 잡힌 뒤 진행
- **US3 (Phase 5)**: US2의 공통 mount 모델 위에서 진행
- **US4 (Phase 6)**: US2 또는 US3에서 생성된 frame 메타 모델을 전제로 진행
- **Polish (Phase 7)**: 원하는 user story 완료 후 진행

### User Story Dependencies

- **US1**: Foundational 이후 독립 진행 가능
- **US2**: US1의 공개 API와 기본 frame 메타가 준비되어야 함
- **US3**: US2의 mount/scoping 통합에 의존
- **US4**: US2의 메타 모델과 US3의 nested path 규칙에 의존

### Parallel Opportunities

- T003, T006, T007, T008은 서로 다른 파일 중심이라 병렬 진행 가능
- US1 테스트 작업 T009-T011은 구현 전 병렬 작성 가능
- US2 테스트 작업 T016-T018은 구현 전 병렬 작성 가능
- US3 테스트 작업 T023-T025는 구현 전 병렬 작성 가능
- US4 테스트 작업 T029-T030은 구현 전 병렬 작성 가능
- 문서/예제 정리 T035-T036은 구현 마감 단계에서 병렬 진행 가능

---

## Parallel Example: User Story 1

```bash
Task: "Canvas frame 단일 배치 테스트를 /Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/embedScope.spec.tsx 에 추가"
Task: "MindMap frame 단일 배치 테스트를 /Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/renderer.spec.tsx 에 추가"
Task: "공개 API boundary 테스트를 /Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/publicApiBoundary.spec.ts 에 추가"
```

## Parallel Example: User Story 3

```bash
Task: "Canvas nested frame 테스트를 /Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/embedScope.spec.tsx 에 추가"
Task: "MindMap nested frame 테스트를 /Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/renderer.spec.tsx 에 추가"
Task: "parse graph nested frame 메타 테스트를 /Users/danghamo/Documents/gituhb/notes/app/features/render/parseRenderGraph.test.ts 에 추가"
```

## Implementation Strategy

### MVP First

1. Phase 1 완료
2. Phase 2 완료
3. Phase 3 완료
4. `frame(...)` 단일 Canvas/MindMap 시나리오를 검증
5. 그 다음 US2, US3, US4 순으로 확장

### Incremental Delivery

1. `frame(...)` 공개 API 추가
2. 공통 mount/scoping 통합
3. nested frame 지원
4. source tracing/edit routing 확장
5. deprecation과 문서 마이그레이션 정리

## Notes

- `T001`-`T008`은 기반 정리 작업이다
- `US1`은 MVP 범위다
- `US2`는 런타임 통합의 핵심이다
- `US3`는 nested frame을 1차 구현 완료 조건으로 만든다
- `US4`는 editor workflow 회귀를 막기 위한 필수 후속 단계다
