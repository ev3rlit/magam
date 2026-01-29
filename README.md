# graphwrite

AI 에이전트와 협업하여 아이디어를 시각화하는 **AI-Native Programmatic Whiteboard**입니다.
이 앱은 단순한 드로잉 도구가 아닙니다. **모든 시각적 요소(도형, 스티키 노트, 선 등)는 코드로 정의되어 프로그래밍 방식으로 렌더링됩니다.**

### 왜 Programmatic인가요?

이 앱의 핵심 입력 방식은 사용자의 마우스가 아닌 **AI 에이전트(Agent)**이기 때문입니다.
사용자가 자연어로 요청하면, AI 에이전트가 이를 실행 가능한 코드로 변환하여 캔버스를 조작합니다.
마치 [Remotion](https://www.remotion.dev/)이 React 코드로 영상을 만드는 것처럼, **GraphWrite는 React 코드로 화이트보드를 그립니다.**

## 특징

- 🧑‍💻 **Code-as-UI**: 모든 캔버스 요소는 React 컴포넌트로서 프로그램적으로 생성되고 제어됩니다.
- 🤖 **AI-First Interaction**: 클릭 대신 "대화"로 그림을 그립니다. AI 에이전트가 당신의 프롬프트를 캔버스 명령으로 통역합니다.
- 🎨 **React Flow 기반**: 검증된 다이어그램 라이브러리 위에서 유연한 확장성을 제공합니다.
- ⚡ **실시간 렌더링**: 코드 변경이 즉시 시각적 결과물로 반영됩니다.
- 💾 **Local & Secure**: 결과물은 순수한 데이터(JSON/Code)로 로컬에 저장됩니다.

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
# API 서버 + 클라이언트 동시 실행
npx nx run-many --target=serve --projects=api,client

# 또는 개별 실행
npx nx serve api     # http://localhost:3333
npx nx serve client  # http://localhost:4200
```

### CLI 도구로 설치 및 실행

프로젝트를 빌드하고 전역 명령어로 등록하여 사용할 수 있습니다.

```bash
# 1. 빌드
npx nx build client && npx nx build api

# 2. 전역 명령어로 등록
npm link

# 3. 실행
graphwrite
```

실행 후 `http://localhost:3333`에 접속하세요.

### 프로젝트 구조

```
apps/
├── api/              # NestJS 백엔드
│   └── src/
│       ├── domain/       # Entity (Canvas, Node, Edge)
│       ├── application/  # Services
│       ├── infra/        # FileRepository
│       └── interface/    # WebSocket, MCP
└── client/           # React 프론트엔드
    └── src/
        └── app/
            ├── components/   # Canvas, StickyNode
            ├── hooks/        # useSocket
            ├── services/     # SocketService
            └── store/        # Zustand store
```

## MCP 도구

AI 에이전트가 사용할 수 있는 도구:

| 도구 | 설명 |
|------|------|
| `get_canvas_state` | 현재 캔버스 상태 조회 |
| `add_node` | 새 노드 추가 |
| `delete_node` | 노드 삭제 |
| `add_edge` | 노드 간 연결 추가 |
| `update_node` | 노드 내용/위치 수정 |

## 테스트

```bash
npx nx test api
```

## 라이선스

MIT

