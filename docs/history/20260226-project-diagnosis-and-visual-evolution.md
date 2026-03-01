# 2026-02-26 - 프로젝트 구조 진단 및 시각/배치 고도화 전략

## 목적

- 현재 Magam 코드베이스 구조를 장기 관점으로 진단한다.
- 향후 필요한 기능을 이유, 구현 방식, 패턴(FP/OOP/Design Pattern)까지 포함해 정리한다.
- "예술적이면서도 가독성 높은 캔버스/마인드맵"을 지속적으로 발전시키기 위한 의사결정 프레임을 제시한다.

## 1) 현재 구조 진단 요약

### 강점

- 레이어 분리가 명확함: `app`(UI/편집) / `libs/core`(렌더 모델) / `libs/cli`(서버/채팅/MCP) / `libs/runtime`(실행) / `libs/shared`(공유 타입)
- 양방향 편집 기반이 안정적임:
  - 버전 충돌 제어(`baseVersion`)
  - AST patch 기반 수정
  - RPC + 테스트 케이스 확보
- 채팅 세션 영속화(SQLite + Drizzle)와 SSE 스트리밍 경로가 이미 동작함

### 리스크

- 도메인 타입/계약의 중복과 느슨한 타입(`any`/로컬 인터페이스) 사용 지점 존재
- `core/runtime/cli/shared`에 placeholder 성격 엔트리와 실제 구현 경계가 혼재
- 로그/오류 처리 체계가 계층별로 다르게 사용됨(`console.*` 다수)
- 기술 문서 일부가 현재 코드 구조와 어긋남

## 2) 장기적으로 필요한 기능 (우선순위)

### P0. 단일 도메인 계약(Schema Registry) 도입

- 이유: 계층 간 타입 불일치와 회귀를 줄이기 위한 기반
- 구현:
  - `@magam/shared`에 Graph/RPC/Chat 공용 Zod 스키마 + TS 타입 통합
  - `app/ws`, `libs/cli/http`, `libs/cli/mcp`, `libs/core`가 동일 계약 사용
- 패턴:
  - FP: 파서/검증/정규화 함수 순수화
  - OOP: Validation Adapter 캡슐화

### P1. Command/Event 모델 (Undo/Redo/Replay 기반)

- 이유: 편집 기능 고도화(히스토리, 충돌 해결, 추적성) 필수
- 구현:
  - `node.update/move/create/reparent`를 Command 객체로 표준화
  - 이벤트 로그 저장(SQLite) + 상태 재생 리듀서
- 패턴:
  - Command Pattern + Event Sourcing Lite + Reducer(FP)

### P1. 플러그인/확장 SDK

- 이유: 로드맵의 MCP/Obsidian/IDE 확장을 한 구조로 수용
- 구현:
  - Capability Registry(툴/리소스/훅)
  - 플러그인 매니페스트(권한, 버전, 엔트리)
- 패턴:
  - Hexagonal(Port-Adapter), Strategy, Factory

### P1. 대규모 캔버스 성능 계층

- 이유: 1000+ 노드 환경에서 레이아웃/렌더 안정성 확보
- 구현:
  - 레이아웃 계산을 워커 분리
  - 변경집합(Dirty Set) 기반 부분 재레이아웃
  - viewport 기반 우선순위 렌더
- 패턴:
  - FP: 레이아웃 계산 순수 함수
  - OOP: LayoutScheduler, WorkQueue

### P2. 실행 샌드박스 강화

- 이유: 사용자 코드 실행 경로의 보안/격리 요구
- 구현:
  - import allowlist
  - 시간/메모리 제한
  - 에러코드 표준화 및 격리 레이어 강화
- 패턴:
  - Decorator(guard), Adapter(실행 백엔드 교체)

### P2. MCP 기능 확장

- 이유: AI 자동화 범위 확대
- 구현:
  - `project.listPages`, `code.read/write`, `canvas.patch`, `context.resourceIndex` 등 확장
  - 프롬프트 템플릿/리소스 정책화
- 패턴:
  - Tool Registry + Typed DTO + Policy Object

## 3) 예술성 + 가독성 + 자동배치 고도화를 위한 핵심 고민

## 3.1 시각 문법(Visual Grammar)을 먼저 고정할 것

- "예쁜 화면"보다 "의미가 읽히는 화면"이 우선
- 노드 타입별 시각 역할을 명확히 고정:
  - 개념(Shape), 설명(Text/Markdown), 강조(Sticker), 흐름(Edge), 군집(Group)
- 색/형/타이포를 장식이 아니라 의미 체계로 사용

## 3.2 레이아웃 목표를 미적 기준 + 인지 기준으로 이중화할 것

- 미적 기준: 리듬, 균형, 여백, 정렬, 대비
- 인지 기준: 탐색 속도, 주제 구분, 의존성 추론 속도
- 자동 레이아웃 품질은 다음 메트릭으로 관리:
  - edge crossing 수
  - 노드 겹침/충돌 수
  - 시선 흐름 끊김(역방향 엣지 비율)
  - 계층 간 거리 일관성

## 3.3 "의미 중심 배치"를 강제할 것

- 배치 알고리즘이 데이터 구조를 반영해야 함:
  - 원인→결과, 상위→하위, 시간축, 그룹 경계
- 단일 알고리즘이 아니라 상황별 전략 선택:
  - tree / bidirectional / radial / sequence / force-hybrid
- 노드 중요도에 따라 공간을 차등 할당(핵심 노드에 더 큰 여백)

## 3.4 Semantic Zoom 설계를 기본으로 둘 것

- 줌 레벨별 정보 밀도를 다르게 설계:
  - 멀리서: 구조/그룹 위주
  - 중간: 키 라벨/관계
  - 가까이: 상세 본문/주석
- 이 규칙이 있어야 "예술적이지만 읽히는" 결과가 유지됨

## 3.5 스타일 시스템은 "프리셋 + 제약"으로 운영할 것

- 사용자/AI가 무제한 스타일을 직접 만들게 하면 일관성이 무너짐
- 대신 큐레이션된 스타일 프리셋 제공:
  - editorial / blueprint / playful / minimal / technical
- 각 프리셋은 토큰 세트(색, 폰트, 라인, 배경, 그림자)로 정의

## 3.6 AI 배치 품질을 평가-개선 루프로 운영할 것

- AI 배치 제안 후 자동 점수화:
  - readability score
  - aesthetic score
  - structure fidelity score
- 점수 미달 시 자동 재배치/스타일 재시도
- 즉, "생성"보다 "평가-수정 루프"가 장기 품질의 핵심

## 3.7 사람 개입 지점을 명확히 남길 것

- 완전 자동보다 "핵심 제약 고정 + 자동 최적화"가 실전에서 강함
- 사용자가 고정할 수 있어야 하는 것:
  - 앵커 노드
  - 그룹 경계
  - 핵심 경로(critical path)
- AI는 나머지를 최적화

## 4) 실행 로드맵 제안 (간단)

### 0-3개월

- 도메인 계약 통합(Zod + shared types)
- Command/Event 기반 편집 API 정비
- 레이아웃 품질 메트릭 수집 시작

### 3-6개월

- 전략형 레이아웃 엔진(상황별 알고리즘)
- Semantic Zoom 규칙 도입
- 스타일 프리셋 시스템 도입

### 6-12개월

- 플러그인 SDK 안정화
- AI 배치 평가-재생성 루프 자동화
- 템플릿/태그/검색 인덱스 기반 지식 작업 기능 강화

## 결론

장기적으로 Magam의 경쟁력은 "그릴 수 있음"이 아니라, "의미가 읽히는 구조를 지속적으로 자동 생산하고 개선할 수 있음"에 있다.  
이를 위해서는 UI 장식보다 도메인 계약, 명령 모델, 레이아웃 평가 체계, 스타일 제약 시스템을 먼저 제품 코어로 삼아야 한다.
