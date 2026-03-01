# Phase 0 Research: Paper Material (Post-it)

## Decision 1: 소재 계약은 `@magam/core/material` 단일 모듈을 확장해 Sticky/Washi 공용으로 사용

- Decision: `PaperMaterial`, `MaterialPresetId`, `MATERIAL_PRESET_REGISTRY`, `preset/svg/image/solid`를 신규 모듈로 분리하지 않고 기존 `libs/core/src/material/*`를 확장한다.
- Rationale: 현재 Washi 경로가 이미 이 모듈에 결합되어 있고, 중복 계약 생성 시 타입/런타임 드리프트가 발생한다.
- Alternatives considered:
  - Sticky 전용 `stickyMaterial.ts` 신설: 도메인 분리가 쉬우나 preset/검증 로직 이중화로 유지보수 비용 증가.
  - 앱 레이어(`app/types`)에서만 확장: 코어 public API와 분리되어 DX/타입 일관성이 깨짐.

## Decision 2: 프리셋 카탈로그는 11종으로 확장하되 컴포넌트 기본 preset은 분리 유지

- Decision: 레지스트리는 `postit` + 기존 5종 + 신규 5종(노트 4, 크래프트 1)을 모두 포함한다. 기본값은 Sticky=`postit`, Washi=`pastel-dots`로 유지한다.
- Rationale: 요구사항은 Sticky 기본값 고정(`postit`)을 명시하지만 Washi UX 회귀는 금지다.
- Alternatives considered:
  - 전체 기본값을 `postit`으로 통일: 기존 Washi 동작 회귀 위험.
  - 레지스트리를 Sticky/Washi로 분리: 프리셋 ID의 단일 소스 원칙 위배.

## Decision 3: `MaterialPresetMeta`/`PresetMaterialDef`를 확장해 노트 패턴과 색상 오버라이드를 수용

- Decision: `MaterialPresetMeta.backgroundSize?: string`, `PresetMaterialDef.color?: string`를 추가하고 `preset(id, opts?)` 형태로 helper를 확장한다.
- Rationale: 줄노트/격자 프리셋은 `background-size`가 필수이며, `postit` 색상 커스터마이징 요구를 타입 수준에서 지원해야 한다.
- Alternatives considered:
  - `backgroundSize`를 런타임 상수로 하드코딩: 프리셋별 스타일 정의 분산.
  - 별도 `postitColor` prop 추가: API가 파편화되고 union의 장점이 감소.

## Decision 4: 패턴 fallback 규칙은 “throw 금지 + reason 추적”으로 고정

- Decision: 기존 `resolveWashiPattern` 패턴을 확장/공용화해 invalid `solid/svg/image/preset` 입력에서 기본 preset으로 fallback하고 `fallbackApplied`, `debugReason`를 유지한다.
- Rationale: PRD의 안정성 요구(세션 중단 금지)와 기존 테스트 패턴을 그대로 재사용할 수 있다.
- Alternatives considered:
  - invalid 입력 시 예외 throw: DX가 나쁘고 편집 흐름을 중단시킴.
  - 조용한 no-op: 원인 추적 불가.

## Decision 5: `at.target` 스코프 해석은 core tree-resolver에서 처리

- Decision: `libs/core/src/reconciler/resolveTreeAnchors.ts`를 확장해 `props.anchor`뿐 아니라 `props.at.target`(및 필요 시 `props.at.anchor`)도 동일한 스코프 규칙으로 재작성한다.
- Rationale: EmbedScope는 core 렌더 단계에서 결정되므로 app 레이어에서 보정하면 시점이 늦고 중복 로직이 생긴다.
- Alternatives considered:
  - app parser(`app/app/page.tsx`)에서 target 재작성: renderer/export 경로 간 일관성 저하.
  - client runtime에서 동적 추정: 저장/재열기 결정성이 떨어짐.

## Decision 6: Sticky `at` 우선순위는 `at > x,y > 오류`로 정의하고 anchorResolver로 연결

- Decision: Sticky도 Washi와 동일하게 `at` 구조를 지원하고, `x,y`가 함께 주어져도 `at` 계산 결과를 우선 적용한다.
- Rationale: 요구사항의 단일 위치 API 목표와 기존 `anchor` 분산 props의 복잡도를 줄인다.
- Alternatives considered:
  - `x,y` 우선 유지: 새 API 도입 목적 상실.
  - Sticky는 기존 anchor만 유지: 컴포넌트 간 위치 모델 불일치.

## Decision 7: 기존 `color`/`anchor`는 하위 호환 브릿지로 유지

- Decision: 입력 정규화 단계에서 `color -> solid(color)`, `anchor/position/gap/align -> at={anchor(...)}`로 변환하되, 신규 코드 경로는 `pattern`/`at`를 표준으로 문서화한다.
- Rationale: 기존 TSX 소스 무중단 호환이 필요하며, 점진적 전환이 현실적이다.
- Alternatives considered:
  - 즉시 제거(deprecation without bridge): 기존 문서/테스트 대량 회귀.
  - 영구 병행 API 유지(동등 우선순위): 복잡도 지속 증가.

## Decision 8: 검증 전략은 “레지스트리 계약 + fallback 매트릭스 + scoping 회귀” 3축으로 구성

- Decision: 테스트는 (1) preset 레지스트리 계약, (2) fallback/debugReason 매트릭스, (3) `resolveTreeAnchors`의 `at.target` 스코프 케이스를 필수 포함한다.
- Rationale: 이번 기능의 실패 가능 지점이 타입 정의보다 경계값/회귀 포인트에 집중되어 있다.
- Alternatives considered:
  - 수동 QA 중심: 회귀 탐지 지연.
  - 통합 테스트만 추가: 원인 분리 어려움.

## Clarification Resolution Status

- Technical Context의 핵심 미확정 항목(기본 preset 정책, 프리셋 메타 확장 방식, `at.target` 스코프 처리 위치, fallback 계약)은 모두 결정됨.
- 추가 clarification 없이 Phase 1 설계 문서(`data-model.md`, `contracts/`, `quickstart.md`) 작성 가능.
