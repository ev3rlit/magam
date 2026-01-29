# Product Requirements Document: graphwrite

## Executive Summary

## Executive Summary

graphwrite는 **AI-Native Programmatic Whiteboard**입니다. 기존의 FigJam이 사용자의 직접적인 드래그 앤 드롭을 최우선으로 했다면, graphwrite는 **AI 에이전트를 통한 프로그래밍적 생성**을 최우선(Mobile-First가 아닌 **AI-First**)으로 합니다. 사용자가 자연어로 의도를 말하면, AI가 이를 코드로 변환하여 화면에 그림을 그립니다. Remotion이 비디오를 코드로 만드는 것처럼, graphwrite는 다이어그램을 코드로 만듭니다.

## Product Vision

지식 작업의 미래는 "그리는 것"이 아니라 "설명하는 것"입니다.
graphwrite에서 사용자는 화가(Planner)가 되고, AI 에이전트는 붓(Executor)이 됩니다.

"이 아키텍처 그려줘"라는 말 한마디가 실제 React 컴포넌트들의 조합으로 변환되어 캔버스에 나타납니다.
우리는 **명령형(Imperative) 도구**에서 **선언형(Declarative) 도구**로의 전환을 목표로 합니다.
- **Old Way**: 사각형 도구 선택 -> 드래그 -> 색상 변경 -> 텍스트 입력
- **New Way**: "파란색 데이터베이스 노드 추가해줘" (AI가 실행)

물론, 세밀한 조정이 필요할 때는 여전히 마우스로 개입할 수 있는 **하이브리드 워크플로우**를 지원합니다.

## Target Users

**Primary Persona**: 시스템 아키텍처를 문서화하고, 학습 내용을 정리하며, 프로젝트 구조를 시각화하는 개발자입니다. AI 도구(Claude Code, OpenCode CLI 등)를 이미 사용하고 있으며, 자연어 지시로 반복 작업을 자동화하고 싶어합니다.

**Secondary Persona**: 복잡한 정보를 구조화해야 하는 프로덕트 매니저와 기술 작성자입니다. 브레인스토밍 세션에서 아이디어를 빠르게 시각화하고, AI의 도움으로 구조를 정리하고 싶어합니다.

## Core Value Proposition

**1. AI 에이전트와의 실시간 협업**

MCP 프로토콜을 통해 AI 에이전트가 캔버스를 직접 조작합니다. "마인드맵 중앙에 API 서버 노드 추가해줘", "선택한 노드들을 그룹으로 묶어줘"와 같은 자연어 지시가 즉시 반영됩니다.

**2. FigJam 스타일의 직관적 편집**

브라우저에서 스티키 노트를 드래그하고, 화살표로 연결하고, 도형을 그리는 익숙한 경험을 제공합니다. AI 없이도 완전한 화이트보드 도구로 사용할 수 있습니다.

**3. 마인드맵 + 자유 캔버스의 결합**

구조화된 마인드맵과 자유로운 캔버스 요소를 하나의 공간에서 사용합니다. 마인드맵의 자동 레이아웃과 자유 배치를 필요에 따라 선택할 수 있습니다.

## Product Scope

### In Scope (Phase 1)

**캔버스 핵심 요소**
- 스티키 노트: 다양한 색상, 크기 조절, 텍스트 편집
- 기본 도형: 사각형, 원, 다이아몬드
- 텍스트: 자유 텍스트 배치
- 커넥터: 노드 간 화살표 연결, 방향 설정(단방향/양방향/무방향)

**마인드맵 기능**
- 계층 구조 노드 생성
- 자동 레이아웃 (Tree 레이아웃)
- 노드 접기/펼치기

**AI 연동**
- MCP 서버 내장
- 캔버스 조회/조작 도구(Tools) 제공
- 실시간 상태 동기화

**기본 인터랙션**
- 드래그로 요소 이동
- 클릭으로 선택 (다중 선택 포함)
- 줌/팬 네비게이션
- Undo/Redo

### Out of Scope

- 실시간 다중 사용자 협업
- 클라우드 저장 및 계정 시스템
- 드로잉 도구 (펜, 형광펜)
- 이미지/파일 첨부
- 내보내기 (PNG, PDF)
- 템플릿 시스템

## System Architecture

### 통합 애플리케이션 구조

```
┌─────────────────────────────────────────────────────────────┐
│                     graphwrite App                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   NestJS Server                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │ MCP Module  │  │  WebSocket  │  │    Canvas    │  │  │
│  │  │   (stdio)   │  │   Gateway   │  │    State     │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  │  │
│  │         │                │                │          │  │
│  │         └────────────────┴────────────────┘          │  │
│  │                          │                           │  │
│  └──────────────────────────┼───────────────────────────┘  │
│                             │                              │
└─────────────────────────────┼──────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  AI Agent   │    │   Browser   │    │    File     │
   │  (OpenCode) │    │   Client    │    │   System    │
   └─────────────┘    └─────────────┘    └─────────────┘
```

### 레이어 구조

**Transport Layer**
- MCP Server: stdio를 통해 AI 에이전트와 JSON-RPC 통신
- WebSocket Gateway: 브라우저 클라이언트와 실시간 통신
- HTTP Controller: 초기 페이지 로드, 정적 파일 서빙

**Application Layer**
- Canvas Service: 캔버스 상태 관리의 단일 진실 공급원
- Command Handler: 모든 캔버스 조작을 Command 패턴으로 처리
- Event Emitter: 상태 변경을 구독자에게 브로드캐스트

**Domain Layer**
- Node Entity: 스티키 노트, 도형, 텍스트 등 캔버스 요소
- Edge Entity: 노드 간 연결
- Canvas Aggregate: 전체 캔버스 상태를 관리하는 루트 엔티티

**Infrastructure Layer**
- File Repository: 로컬 파일 시스템에 캔버스 저장/로드
- Layout Engine: 마인드맵 자동 레이아웃 계산

### 데이터 흐름

**AI 에이전트 → 캔버스**
```
1. AI Agent가 MCP 도구 호출 (예: canvas.addNode)
2. MCP Module이 Command 객체 생성
3. Canvas Service가 Command 실행, 상태 업데이트
4. Event Emitter가 변경 이벤트 발행
5. WebSocket Gateway가 브라우저에 브로드캐스트
6. React Flow가 리렌더링
```

**브라우저 → 캔버스**
```
1. 사용자가 노드 드래그
2. React Flow가 onChange 이벤트 발생
3. WebSocket으로 서버에 Command 전송
4. Canvas Service가 Command 실행, 상태 업데이트
5. Event Emitter가 변경 이벤트 발행
6. (AI가 구독 중이라면) MCP를 통해 상태 변경 알림
```

## MCP Interface Specification

### 제공 도구 (Tools)

**캔버스 조회**

```typescript
// 전체 캔버스 상태 조회
canvas.getState(): CanvasState

// 특정 노드 조회
canvas.getNode(nodeId: string): Node

// 선택된 요소 조회
canvas.getSelection(): string[]
```

**노드 조작**

```typescript
// 노드 추가
canvas.addNode(params: {
  type: 'sticky' | 'shape' | 'text'
  content: string
  position?: { x: number, y: number }
  style?: NodeStyle
}): Node

// 노드 수정
canvas.updateNode(nodeId: string, updates: Partial<Node>): Node

// 노드 삭제
canvas.deleteNode(nodeId: string): void

// 노드 이동
canvas.moveNode(nodeId: string, position: { x: number, y: number }): void
```

**엣지 조작**

```typescript
// 연결 추가
canvas.addEdge(params: {
  source: string
  target: string
  type?: 'arrow' | 'line'
  label?: string
}): Edge

// 연결 삭제
canvas.deleteEdge(edgeId: string): void
```

**마인드맵**

```typescript
// 자식 노드 추가
canvas.addChildNode(parentId: string, content: string): Node

// 레이아웃 재계산
canvas.applyLayout(rootId: string, algorithm: 'tree' | 'radial'): void
```

**뷰 조작**

```typescript
// 특정 노드로 포커스
canvas.focusNode(nodeId: string): void

// 뷰포트 조정
canvas.setViewport(params: { x: number, y: number, zoom: number }): void
```

### 리소스 (Resources)

```typescript
// 현재 캔버스 상태를 리소스로 노출
resource://canvas/current -> CanvasState JSON

// 선택된 요소 정보
resource://canvas/selection -> SelectionInfo JSON
```

## Technology Stack

| 영역 | 기술 | 역할 |
|------|------|------|
| 서버 런타임 | Node.js | 서버 실행 환경 |
| 서버 프레임워크 | NestJS | 모듈화된 서버 구조, WebSocket Gateway |
| MCP SDK | @modelcontextprotocol/sdk | AI 에이전트 통신 |
| 실시간 통신 | Socket.io | 브라우저-서버 양방향 통신 |
| 프론트엔드 | React | UI 컴포넌트 |
| 스타일링 | Tailwind CSS | 유틸리티 기반 스타일링 |
| 캔버스 | React Flow | 노드/엣지 기반 다이어그램 |
| 상태 관리 | Zustand | 클라이언트 상태 관리 |
| 파일 저장 | JSON | 로컬 파일 시스템에 캔버스 저장 |

## User Workflow

### 시나리오 1: AI와 함께 아키텍처 다이어그램 생성

```
1. 사용자가 graphwrite 앱 실행
   $ npm run start
   
2. 브라우저에서 http://localhost:3000 접속

3. 터미널에서 AI 에이전트 실행
   $ opencode chat
   
4. AI에게 지시
   "백엔드 아키텍처 다이어그램을 만들어줘. 
    API Gateway, Auth Service, User Service, 
    Database가 필요해"

5. AI가 MCP를 통해 캔버스에 노드와 연결 생성
   → 브라우저에 실시간으로 반영

6. 사용자가 브라우저에서 노드 위치 미세 조정
   → 드래그로 직접 이동

7. 추가 지시
   "User Service 아래에 Cache Layer 추가해줘"

8. 반복하며 다이어그램 완성
```

### 시나리오 2: 브레인스토밍 후 AI로 구조화

```
1. 브라우저에서 자유롭게 스티키 노트 추가
   → 아이디어를 막 던져놓음

2. AI에게 지시
   "캔버스에 있는 노트들을 분석해서 
    관련된 것끼리 마인드맵으로 정리해줘"

3. AI가 현재 상태 조회 후 재구성
   → 자동 레이아웃 적용

4. 사용자가 결과 확인 후 조정 요청
   "마케팅 관련 노트들을 왼쪽으로 옮겨줘"
```

## Data Model

### Node

```typescript
interface Node {
  id: string
  type: 'sticky' | 'shape' | 'text'
  position: { x: number, y: number }
  data: {
    content: string
    width?: number
    height?: number
  }
  style: {
    backgroundColor?: string
    borderColor?: string
    fontSize?: number
  }
  parentId?: string  // 마인드맵 계층 구조용
}
```

### Edge

```typescript
interface Edge {
  id: string
  source: string
  target: string
  type: 'arrow' | 'line'
  label?: string
  style: {
    strokeColor?: string
    strokeWidth?: number
  }
}
```

### CanvasState

```typescript
interface CanvasState {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  createdAt: string
  updatedAt: string
}
```

## File Format

캔버스는 JSON 파일로 로컬에 저장됩니다.

```
~/graphwrite/
  └── canvases/
      ├── backend-architecture.json
      ├── project-brainstorm.json
      └── learning-notes.json
```

## Success Metrics

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| AI 명령 성공률 | 90% 이상 | MCP 도구 호출 성공/실패 로깅 |
| 응답 지연 시간 | 200ms 이내 | 명령 실행부터 렌더링까지 |
| 첫 다이어그램 완성 시간 | 5분 이내 | 앱 실행부터 10개 노드 다이어그램 완성 |

## Development Phases

### Phase 1: Core Foundation (4주)

**Week 1-2: 서버 기반 구축**
- NestJS 프로젝트 셋업
- Canvas 상태 관리 서비스 구현
- WebSocket Gateway 구현
- 기본 파일 저장/로드

**Week 3-4: 프론트엔드 + MCP**
- React Flow 기반 캔버스 뷰어
- 스티키 노트, 기본 도형, 커넥터
- MCP 서버 모듈 통합
- 기본 도구(addNode, deleteNode, addEdge) 구현

### Phase 2: Enhanced Features (3주)

**Week 5-6: 마인드맵 & 고급 도구**
- 계층 구조 노드
- Tree 레이아웃 알고리즘
- 접기/펼치기 기능
- **MCP 도구 확장**:
    - `add_node`: 'shape' 타입(사각형, 원, 다이아몬드) 지원 추가
    - `addChildNode`: 마인드맵 자식 노드 생성
    - `applyLayout`: 자동 레이아웃 적용

**Week 7: Polish**
- Undo/Redo
- 다중 선택
- 키보드 단축키

### Phase 3: AI Experience (2주)

**Week 8: AI 도구 확장**
- 고급 도구 (applyLayout, focusNode 등)
- AI 에이전트용 스킬 문서 작성

**Week 9: 테스트 및 안정화**
- 통합 테스트
- 에러 핸들링 강화
- 문서화

## Risk Assessment

| 리스크 | 영향 | 대응 방안 |
|--------|------|----------|
| React Flow 커스터마이징 한계 | 중간 | 초기에 필요한 기능 가능 여부 검증, 불가시 Konva로 전환 |
| MCP 프로토콜 학습 곡선 | 낮음 | 공식 SDK 사용, 단순한 도구부터 구현 |
| 상태 동기화 충돌 | 중간 | 단일 사용자 가정으로 단순화, Command 패턴으로 순서 보장 |
| AI 에이전트 호환성 | 낮음 | MCP 표준 준수, 주요 에이전트(OpenCode, Claude Code) 우선 지원 |

## Conclusion

graphwrite는 AI 에이전트와 사람이 함께 사용하는 시각적 사고 도구입니다. FigJam의 직관적인 UX와 MCP의 AI 통합 능력을 결합하여, 자연어 지시와 직접 편집을 자유롭게 오가는 새로운 워크플로우를 제안합니다.

NestJS 기반의 통합 아키텍처는 MCP 서버와 웹 서버를 하나의 프로세스에서 관리하여 상태 동기화를 단순화합니다. React Flow를 활용해 빠르게 MVP를 구축하고, 사용자 피드백을 바탕으로 기능을 확장해 나갈 수 있습니다.

초기 버전은 개인 사용자를 위한 로컬 도구로 시작하지만, MCP 기반 아키텍처는 향후 다양한 AI 에이전트와의 통합 가능성을 열어둡니다.