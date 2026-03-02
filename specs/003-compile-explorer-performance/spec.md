# Feature Specification: Compile & Explorer Performance

**Feature Branch**: `003-compile-explorer-performance`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "`docs/features/compile-explorer-performance/README.md`"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 빠른 초기 진입 (Priority: P1)

개발자는 dev 서버 실행 후 첫 화면(`/`)과 Explorer를 수 초 이내에 열어 작업을 시작할 수 있어야 한다.

**Why this priority**: 첫 진입 지연은 모든 개발 작업의 대기 시간을 누적시키며 생산성을 직접 저하시킨다.

**Independent Test**: `next dev` 실행 후 첫 `GET /`, 첫 `GET /api/file-tree` 시간을 측정해 목표 이내인지 확인하면 독립 검증이 가능하다.

**Acceptance Scenarios**:

1. **Given** 개발 서버가 막 기동된 상태에서, **When** 사용자가 `/`를 처음 요청하면, **Then** 첫 화면 진입 시간이 정의된 목표 내에 도달해야 한다.
2. **Given** 개발 서버가 막 기동된 상태에서, **When** 사용자가 Explorer 데이터를 처음 요청하면, **Then** 파일 트리 응답이 정의된 목표 내에 도달해야 한다.

---

### User Story 2 - 빠른 반복 편집 피드백 (Priority: P2)

개발자는 파일 변경 후 재컴파일/재렌더가 빠르게 끝나서 반복 편집 루프를 끊김 없이 수행할 수 있어야 한다.

**Why this priority**: 반복 루프의 지연은 기능 개발/디버깅 체감 속도에 가장 큰 영향을 준다.

**Independent Test**: `app/page.tsx` 변경 후 첫 요청, 두 번째 요청 시간과 `/render` API 반복 호출 p95를 측정해 목표 충족 여부를 확인한다.

**Acceptance Scenarios**:

1. **Given** 사용자가 주요 화면 파일을 변경한 상태에서, **When** 첫 재요청을 수행하면, **Then** 재컴파일 완료 시간이 목표 이내여야 한다.
2. **Given** 동일 파일에 대한 반복 렌더 요청에서, **When** 내용 변경이 없는 요청이 들어오면, **Then** p95 응답 시간이 목표 이내여야 한다.

---

### User Story 3 - 예측 가능한 빌드 성능 (Priority: P3)

개발자는 전체 빌드 시간을 측정 가능하게 관리하고, 병목 지점이 명확히 식별된 상태에서 개선 결과를 비교할 수 있어야 한다.

**Why this priority**: 성능 이슈를 구조적으로 해결하려면 단계별 계측과 회귀 감지가 필수다.

**Independent Test**: `bun run build`와 단계별 빌드 타임(`shared/core/runtime/cli/app`)을 baseline/개선 후 비교해 목표 달성을 검증한다.

**Acceptance Scenarios**:

1. **Given** 전체 빌드를 실행하면, **When** 결과를 수집할 때, **Then** 단계별 시간 분해 정보가 함께 기록되어야 한다.
2. **Given** 최적화 적용 후 동일 측정을 재실행하면, **When** baseline과 비교할 때, **Then** 목표 성능 지표 개선이 확인되어야 한다.

### Edge Cases

- 워크스페이스 파일 수가 커질 때 Explorer 초기 로딩 시간 급증을 어떻게 제어하는가?
- 첫 컴파일이 실패했을 때(경고/오류 혼재) 계측 데이터는 어떻게 기록/비교하는가?
- 캐시 stale 또는 파일 변경 이벤트 누락 시 성능 개선과 정확성을 어떻게 동시에 보장하는가?
- markdown/code/pdfs 같은 무거운 모듈을 지연 로딩할 때 첫 사용 지연을 어떻게 사용자에게 안내하는가?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 `bun run build` 및 단계별 빌드 시간을 동일 형식으로 반복 측정할 수 있어야 한다.
- **FR-002**: 시스템은 `next dev` 첫 요청과 변경 후 재요청 지연을 계측해 baseline과 비교할 수 있어야 한다.
- **FR-003**: 시스템은 `/render`, `/file-tree` 경로에 대해 백엔드 단독 지연과 프론트 프록시 포함 지연을 분리 측정할 수 있어야 한다.
- **FR-004**: 시스템은 `app/page.tsx`의 클라이언트 경계를 축소하는 구조로 리팩터링할 수 있어야 한다.
- **FR-005**: 시스템은 무거운 의존성(`jspdf`, markdown/code 렌더러)을 필요 시점 로딩으로 전환할 수 있어야 한다.
- **FR-006**: 시스템은 dev 기동 직후 워밍업 요청을 선택적으로 수행해 첫 사용자 요청 지연을 줄일 수 있어야 한다.
- **FR-007**: 시스템은 성능 개선 항목별 리스크와 검증 지표를 문서로 유지해야 한다.
- **FR-008**: 시스템은 기존 렌더 결과 정확성과 Explorer 결과 정확성을 유지하면서 성능 개선을 적용해야 한다.
- **FR-009**: 시스템은 성능 회귀를 감지할 수 있도록 baseline/개선 결과를 동일 문서 내에 기록해야 한다.

### Key Entities *(include if feature involves data)*

- **BuildTimingSample**: 전체/단계별 빌드 측정값(`cold/warm`, `real/user/sys`)을 담는 측정 단위.
- **RouteCompileTimingSample**: `next dev` 라우트 컴파일 및 요청 지연 측정값.
- **ApiTimingSample**: `/render`, `/file-tree`의 cold/warm/p95 지연 측정값.
- **OptimizationItem**: 개선 항목(경계 축소, 동적 로딩, 워밍업)의 실행 상태/리스크/검증 지표.
- **PerformanceBaselineReport**: 기준선과 개선 후 결과를 비교하는 문서 레코드.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `POST /render` p95 응답 시간이 2.0초 이하로 유지된다.
- **SC-002**: 내용 변경 없는 동일 파일 재렌더 p95가 500ms 이하를 달성한다.
- **SC-003**: Explorer 초기 로딩(`GET /file-tree`) p95가 700ms 이하를 달성한다.
- **SC-004**: Explorer 수동 새로고침 p95가 400ms 이하를 달성한다.
- **SC-005**: `next dev` 기준 첫 `GET /` 시간이 baseline(15.4s) 대비 유의미하게 감소한다.
- **SC-006**: 전체 빌드 시간(`bun run build`)이 baseline 대비 개선되며, 병목 단계(`build:app`)의 감소 폭이 명확히 확인된다.

