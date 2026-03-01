# Visual Grammar 고정 구현 계획

## 목표

- `README.md`에서 정의한 시각 문법을 코드에서 강제 가능한 수준으로 구현한다.
- AI 생성 품질을 정량 점수로 측정하고 자동 개선 루프를 만든다.

## 범위

### 포함

- 시각 문법 프로필 스키마 정의
- 배치 전략 선택기
- 품질 점수 계산기
- PR 가드레일(체크리스트/테스트)

### 제외

- 외부 플러그인 마켓 연동
- 사용자 임의 프리셋 편집 UI(초기 버전)

## 산출물

1. 문법 스키마(타입/검증)
2. 기본 프로필 3종(`editorial`, `blueprint`, `playful`)
3. 품질 점수 계산 모듈
4. AI 생성 프롬프트 계약 템플릿
5. 회귀 테스트(레이아웃 품질 임계치)

## 제안 파일 구조

```txt
libs/shared/src/lib/visual-grammar.ts
app/utils/visualGrammar/
  profile.ts
  strategySelector.ts
  qualityScore.ts
  constraints.ts
app/store/graph.ts (profile 상태 연결)
docs/features/visual-grammar/README.md
docs/features/visual-grammar/implementation-plan.md
```

## 단계별 실행

## Phase 1 - Grammar Schema (1주)

- `VisualGrammarProfile` 타입 정의
- 의미 슬롯(`role`, `state`, `emphasis`) 열거형 고정
- 노드 타입별 허용 스타일 범위 정의

수용 기준:

- 프로필 JSON이 타입/런타임 검증을 통과한다.
- 금지 규칙 위반 시 명시적 에러 코드 반환.

## Phase 2 - Strategy Selector (1주)

- 입력: 그래프 구조 메타(노드 수, 깊이, 분기수, 루프 비율)
- 출력: `tree | radial | bidirectional | sequence | canvas-anchor`
- 수동 override 허용

수용 기준:

- 동일 입력에서 동일 전략이 선택된다(결정론).
- 예외 규칙(시퀀스/루프)이 정상 반영된다.

## Phase 3 - Quality Score Engine (1~2주)

- 지표 계산:
  - edge crossing
  - node overlap
  - depth coherence
  - emphasis overuse
- 최종 점수: `readability`, `structure`, `aesthetic`, `editability`

수용 기준:

- 기준 샘플 10개에서 점수 재현성 확보(오차 허용 범위 내).
- 임계치 미달 시 리포트 항목이 명확히 출력된다.

## Phase 4 - AI Loop Integration (1주)

- 흐름: 생성 -> 점수 평가 -> 임계치 미달 시 재배치/재스타일
- 반복 제한(`maxAttempts`)과 수렴 조건 정의

수용 기준:

- 3회 이내 재시도에서 평균 점수 개선.
- 무한 루프 없음(타임아웃/시도 제한).

## Phase 5 - Governance (1주)

- PR 템플릿 항목 추가
- 시각 문법 위반 회귀 테스트 추가
- 문서와 코드 동기화 체크

수용 기준:

- 신규 기능 PR에서 문법 위반 자동 탐지.
- 릴리즈 전 품질 리포트 생성 가능.

## AI 프롬프트 계약 템플릿 (초안)

```txt
You must follow Magam Visual Grammar:
1) Classify each node as one of: concept, annotation, emphasis, relation, group.
2) Choose one layout strategy with reason.
3) Use emphasis tokens on <= 15% of nodes.
4) Prefer left-to-right causal flow.
5) Avoid overlaps and minimize edge crossings.
Return:
- chosen_strategy
- node_role_map
- style_profile
- generated_code
```

## 리스크 및 대응

- 리스크: 예술성을 이유로 규칙이 과도하게 깨질 수 있음
- 대응: "실험 모드"와 "프로덕션 모드"를 분리

- 리스크: 점수화가 경직되어 표현 다양성이 떨어짐
- 대응: 하드 임계치 + 소프트 가중치 병행

- 리스크: 문법 규칙이 커질수록 온보딩 비용 증가
- 대응: 규칙 레벨을 `Core` / `Advanced`로 분리

## 완료 정의 (Definition of Done)

- 기본 3개 프로필에서 AI 생성 결과가 문법 검증을 통과
- 품질 점수 리포트가 자동 생성
- 문서(`README`)와 구현(`profile/score/selector`)이 같은 스키마를 참조

