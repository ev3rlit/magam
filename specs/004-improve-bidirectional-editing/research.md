# Phase 0 Research: Focused Bidirectional Editing for Existing Objects

## Decision 1: 편집 반영 경로는 기존 WS RPC + AST patcher를 유지한다

- Decision: 신규 편집 전용 백엔드를 만들지 않고 `useFileSync -> node.move/node.update -> app/ws/filePatcher.ts` 경로를 재사용한다.
- Rationale: 현재 경로가 `baseVersion/originId/commandId` 동시성 계약과 파일 버전 갱신을 이미 제공한다.
- Alternatives considered:
  - 새로운 편집 전용 API 계층 추가: 범위 대비 과도한 변경.
  - 클라이언트 로컬 diff만으로 저장: 외부 수정 충돌 처리와 일관성이 약해짐.

## Decision 2: 절대 좌표 이동은 `drag stop` 시점의 `x`,`y`만 patch한다

- Decision: `GraphCanvas`에서 드래그 완료 시점에만 `node.move`를 호출하고, 서버는 `patchNodePosition()`으로 `x`,`y` 속성만 갱신한다.
- Rationale: FR-002/FR-003/FR-013의 최소 변경 원칙을 가장 단순하게 만족한다.
- Alternatives considered:
  - 드래그 중간 프레임마다 patch: undo 이벤트 과다 생성 + ws 부하 증가.
  - `node.update`로 전체 props 갱신: 좌표 외 부수 변경 위험 증가.

## Decision 3: Markdown/텍스트 편집은 단일 선택 세션 + 완료 이벤트로 저장한다

- Decision: 편집 세션은 `activeTextEditNodeId` 1개만 유지하고, 저장은 완료 시점(blur/확정 액션) `node.update({ content })` 1회로 처리한다.
- Rationale: FR-008/FR-009(선택 대상만 편집)과 FR-016/FR-017(완료 이벤트 단위 undo)을 함께 충족한다.
- Alternatives considered:
  - 다중 동시 편집 허용: 비선택 노드 오염 가능성이 커짐.
  - 키입력마다 즉시 서버 저장: 이벤트 단위 정의가 깨지고 충돌 빈도 증가.

## Decision 4: Markdown WYSIWYG은 기존 렌더러 문법 범위를 기준으로 인라인 편집한다

- Decision: `MarkdownNode`에 선택 상태 전용 인라인 WYSIWYG 편집층을 추가하고, preview/저장 결과는 `LazyMarkdownRenderer`와 동일 렌더러 규칙으로 맞춘다.
- Rationale: Clarification에서 "현재 Markdown 렌더러 지원 범위와 1:1"이 확정되었고, 신규 문법/엔진 도입 없이 FR-007을 만족할 수 있다.
- Alternatives considered:
  - 외부 대형 에디터 도입(Tiptap/Toast UI): 의존성/스타일 통합 비용이 큼.
  - plain textarea + preview 분리: 직관적 WYSIWYG 요구에 맞지 않음.

## Decision 5: attach 장식 이동은 상대 파라미터만 갱신한다

- Decision: attach된 장식은 절대 좌표가 아닌 attach 파라미터를 갱신한다.
  - WashiTape(`data.at.type === 'attach'`): `at.offset`만 반영
  - Sticker(앵커 기반): `gap`만 반영
- Rationale: FR-010/FR-011/FR-013(상대 위치만 변경 + 관계 유지)을 최소 diff로 만족한다.
- Alternatives considered:
  - 장식 이동을 `x`,`y`로 직접 저장: attach 모델 재현성이 깨짐.
  - attach 모델 재설계: 이번 v1 범위 초과.

## Decision 6 (Option A): 전역 ID 충돌 탐지 시 편집 반영을 거부한다

- Decision: 편집 커밋 전 AST에서 `id` 인덱스를 구성해 렌더 결과 전역 유일성 위반을 검사한다. 충돌이 있으면 반영을 거부하고 중복 해결 안내를 반환한다.
- Rationale: FR-018/FR-020 및 사용자 합의("전역 유일성 위반 시 반영 거부")를 직접 충족한다.
- Alternatives considered:
  - 자동 rename으로 충돌 회피: 코드 의도와 참조를 암묵 변경할 위험.
  - 충돌 상태에서도 일부 편집 허용: 대상 식별 안정성이 보장되지 않음.

## Decision 7: undo/redo는 "편집 완료 이벤트 1건" 단위로만 처리한다

- Decision: `ABSOLUTE_MOVE_COMMITTED`, `TEXT_EDIT_COMMITTED`, `ATTACH_RELATIVE_COMMITTED` 3종 이벤트를 기록하고, undo/redo는 이벤트 1건의 inverse/replay RPC로 수행한다.
- Rationale: FR-016/FR-017/FR-019를 가장 명확히 검증 가능한 방식으로 충족한다.
- Alternatives considered:
  - 그래프 전체 스냅샷 기반 undo: 변경 범위가 과도하고 diff 최소화 원칙과 충돌.
  - 드래그 프레임 기반 히스토리: 사용자 체감과 요구 단위 불일치.

## Decision 8: 충돌/검증 실패는 부분 반영 없이 명시적 오류로 노출한다

- Decision: `VERSION_CONFLICT`, `ID_COLLISION`, `NODE_NOT_FOUND`, `PATCH_FAILED` 등 실패는 커밋 자체를 중단하고, UI는 재동기화/중복 해결 안내를 표시한다.
- Rationale: FR-012/SC-005/SC-009/SC-011을 만족하려면 "부분 성공" 경로가 없어야 한다.
- Alternatives considered:
  - 가능한 필드만 부분 저장: 편집 결과 예측 가능성이 무너짐.
  - 실패 원인 숨김: 사용자 수정 루프가 느려짐.

## Clarification Resolution Status

- Markdown WYSIWYG 범위: **현재 Markdown 렌더러 지원 범위와 1:1**로 고정.
- 다중 텍스트/마크다운 컴포넌트 편집: **선택된 오브젝트 단일 편집**으로 고정.
- undo/redo 단위: **편집 완료 이벤트 1건**으로 고정.
- 충돌 정책: **저장 거부 + 재동기화 안내**, **ID 충돌 시 반영 거부 + 중복 해결 안내**로 고정.
- ID 유일성 범위: **렌더 결과 전체 전역 유일**로 고정.
- 남은 NEEDS CLARIFICATION 항목 없음.
