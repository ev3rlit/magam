# Local AI Chat 기능 PRD (Magam)

## 1. 배경

Magam는 사용자가 TSX 코드로 다이어그램을 작성하면 캔버스에 렌더링하는 "AI-Native Programmatic Whiteboard"이다. 현재 사용자가 다이어그램을 수정하려면 직접 TSX 코드를 편집해야 하며, AI 보조를 받으려면 외부 도구(터미널, 브라우저 등)를 오가야 한다.

시장의 AI 코딩 도구들(Cursor, Windsurf 등)은 자체 API 키 기반으로 동작하여 사용자에게 추가 비용을 부과하거나, 특정 모델/프롬프트 포맷에 종속된다. 반면, **Claude Code**, **Gemini CLI**, **Codex CLI** 같은 로컬 AI CLI 도구들은 사용자의 기존 구독(Claude Pro, Gemini Advanced, ChatGPT Plus 등)을 그대로 활용하며, **파일 시스템을 직접 읽고 쓰는 에이전트** 방식으로 동작한다.

이 기획은 Magam 내에 채팅 인터페이스를 도입하되, 백엔드 API 서버를 두지 않고 **사용자의 로컬 머신에 설치된 AI CLI를 직접 호출**하는 방식을 제안한다. 이를 통해:

1. **사용자 구독 활용**: 추가 API 비용 없이 사용자의 기존 AI 구독을 그대로 사용
2. **파일 I/O 기반 처리**: 텍스트 출력 포맷을 강제하지 않고, AI가 직접 파일을 읽고 수정
3. **실시간 반영**: 기존 파일 감시(chokidar) + WebSocket 파이프라인을 통해 AI의 파일 변경이 즉시 캔버스에 반영
4. **모델 자유 선택**: 사용자가 원하는 AI 도구를 자유롭게 선택 가능

---

## 2. 문제 정의

### 사용자 관점 문제

1. 다이어그램 수정을 위해 "의도 → 코드 변환"을 사용자가 직접 수행해야 한다.
2. 외부 AI 도구에 컨텍스트를 복사/붙여넣기하는 과정이 번거롭다.
3. AI가 생성한 코드를 다시 파일에 수동으로 적용해야 한다.
4. API 기반 AI 통합은 추가 비용과 API 키 관리 부담을 수반한다.

### 제품 관점 문제

1. AI 통합 없이는 "AI-Native" 비전의 핵심 가치를 전달하기 어렵다.
2. API 서버 운영 없이 AI 기능을 제공할 수 있는 차별화된 아키텍처가 필요하다.
3. 다양한 AI 모델/도구를 지원하되 특정 벤더에 종속되지 않아야 한다.

---

## 3. 핵심 컨셉: "Bring Your Own AI"

### 동작 원리

```
사용자 채팅 입력
  → Magam이 선택된 AI CLI를 자식 프로세스로 실행
  → AI CLI가 프로젝트 파일을 직접 읽고/수정
  → 기존 chokidar 파일 감시가 변경 감지
  → WebSocket으로 변경 브로드캐스트
  → 캔버스 자동 재렌더링
```

### 기존 API 기반 AI 통합과의 차이점

| 항목 | API 기반 (일반적) | Local AI CLI (본 기획) |
|------|-------------------|----------------------|
| 비용 | 서비스 제공자가 API 비용 부담 또는 사용자에게 전가 | 사용자의 기존 구독 활용 (추가 비용 없음) |
| AI 처리 방식 | 프롬프트 → 텍스트 응답 → 파싱 → 파일 적용 | AI가 파일 시스템에 직접 접근하여 읽기/쓰기 |
| 출력 포맷 의존성 | 특정 JSON/마크다운 포맷 강제 필요 | 포맷 제약 없음 — 파일 변경이 곧 결과 |
| 컨텍스트 이해 | 제한된 컨텍스트 윈도우 내 텍스트 | 전체 프로젝트 파일 시스템 접근 가능 |
| 모델 선택 | 서비스가 지정한 모델 | 사용자가 자유 선택 (Claude/Gemini/GPT 등) |
| 서버 인프라 | API 프록시 서버 필요 | 서버 불필요 — 로컬 프로세스만 사용 |
| 오프라인 지원 | 불가 | CLI 도구에 따라 부분 가능 |

---

## 4. 목표와 비목표

### 목표 (Goals)

1. Magam 내 채팅 UI에서 자연어로 다이어그램 생성/수정을 요청한다.
2. 로컬에 설치된 AI CLI(Claude Code, Gemini CLI, Codex CLI)를 자동 감지하고 실행한다.
3. AI CLI의 stdout/stderr를 실시간 스트리밍하여 채팅 UI에 표시한다.
4. AI가 수정한 파일 변경사항이 기존 파이프라인을 통해 캔버스에 자동 반영된다.
5. 채팅 세션 히스토리를 유지하여 대화 맥락을 보존한다.
6. 사용자가 AI 도구를 자유롭게 전환할 수 있다.

### 비목표 (Non-Goals)

1. Magam 자체 API 키 기반 AI 호출 (자체 LLM 서비스 운영)
2. AI CLI 설치/구독 관리 대행
3. AI CLI의 내부 동작 커스터마이징 (프롬프트 엔지니어링 수준만 제공)
4. 실시간 협업 환경에서의 동시 AI 세션 동기화
5. 모바일/태블릿 지원 (데스크톱 CLI 도구 의존)

---

## 5. 지원 AI CLI 도구

### 5.1 1차 지원 대상

| CLI 도구 | 실행 명령어 | 주요 특징 | 필요 구독 |
|----------|------------|----------|----------|
| **Claude Code** | `claude` | 파일 읽기/쓰기, 터미널 명령 실행, 프로젝트 이해 | Claude Pro/Max/Team |
| **Gemini CLI** | `gemini` | Google AI 기반, 파일 편집, 코드 생성 | Gemini Advanced 또는 API 키 |
| **Codex CLI** | `codex` | OpenAI 기반, 코드 생성/수정, 파일 조작 | ChatGPT Plus/Pro 또는 API 키 |

### 5.2 CLI 감지 전략

1. `which` / `where` 명령으로 실행 파일 존재 여부 확인
2. `--version` 또는 `--help` 실행으로 설치 상태 검증
3. 감지 결과를 캐시하여 반복 확인 방지
4. 미설치 도구는 UI에서 비활성 표시 + 설치 안내 링크 제공

### 5.3 확장 가능성

플러그인/어댑터 패턴으로 설계하여 향후 추가 CLI 도구 지원이 용이하도록 한다:
- Aider
- Continue CLI
- Cline CLI
- 기타 MCP 호환 도구

---

## 6. 사용자 시나리오

### 시나리오 A: 새 다이어그램 생성

1. 사용자가 빈 파일(`architecture.tsx`)을 열고 채팅 패널을 연다.
2. AI 도구로 "Claude Code"를 선택한다.
3. 채팅에 "마이크로서비스 아키텍처 다이어그램을 그려줘. API Gateway, Auth Service, User Service, Order Service를 포함해줘"라고 입력한다.
4. Magam이 `claude --print` 명령에 프로젝트 컨텍스트와 함께 프롬프트를 전달한다.
5. Claude Code가 `architecture.tsx` 파일을 직접 수정한다.
6. 파일 변경이 감지되어 캔버스에 마이크로서비스 다이어그램이 자동으로 나타난다.
7. 채팅에 AI의 응답(작업 내용 설명)이 스트리밍된다.

### 시나리오 B: 기존 다이어그램 수정

1. 사용자가 기존 마인드맵을 보며 채팅에 "marketing 노드 아래에 'Social Media', 'Email Campaign', 'SEO' 하위 노드를 추가해줘"라고 입력한다.
2. AI가 현재 파일을 읽고 해당 위치에 노드를 추가한다.
3. 캔버스가 실시간으로 업데이트되어 새 노드가 나타난다.

### 시나리오 C: AI 도구 전환

1. 사용자가 Claude Code로 작업하다가 Gemini CLI로 전환하고 싶다.
2. 채팅 상단의 AI 선택 드롭다운에서 "Gemini CLI"를 선택한다.
3. 이전 대화 히스토리는 유지되지만, 이후 요청은 Gemini CLI로 전달된다.
4. (선택적) 새 세션 시작을 권장하는 안내 표시.

### 시나리오 D: AI 미설치 상태

1. 사용자가 채팅 패널을 연다.
2. 시스템이 로컬 CLI 도구를 탐색하지만 하나도 발견하지 못한다.
3. "설치된 AI CLI 도구가 없습니다"라는 안내와 함께 각 도구의 설치 가이드 링크를 표시한다.
4. 사용자가 도구를 설치한 후 "다시 확인" 버튼으로 재탐색한다.

### 시나리오 E: 시스템 프롬프트를 활용한 Magam 컨텍스트 전달

1. 사용자가 채팅에 메시지를 입력한다.
2. Magam이 자동으로 시스템 프롬프트를 구성한다:
   - 현재 열린 파일 경로 및 내용
   - Magam 컴포넌트 사용법 (`@magam/core` API 요약)
   - 프로젝트 디렉토리 구조
3. AI가 Magam의 컴포넌트 시스템을 이해한 상태에서 정확한 TSX 코드를 생성한다.

---

## 7. 기능 요구사항

| ID | 요구사항 | 수용 기준 (Acceptance Criteria) |
|---|---|---|
| FR-1 | 채팅 패널 UI | 사이드바 또는 하단 패널에서 채팅 인터페이스가 열리고, 메시지 입력/표시가 동작한다. |
| FR-2 | AI CLI 자동 감지 | 앱 시작 시 `claude`, `gemini`, `codex` 설치 여부를 확인하고 UI에 표시한다. |
| FR-3 | AI 도구 선택 | 감지된 CLI 중 하나를 선택할 수 있으며, 기본값은 첫 번째 감지된 도구이다. |
| FR-4 | 메시지 전송 및 CLI 실행 | 사용자 메시지 전송 시 선택된 CLI가 자식 프로세스로 실행되고 프롬프트가 전달된다. |
| FR-5 | 실시간 응답 스트리밍 | AI CLI의 stdout을 실시간으로 읽어 채팅 UI에 점진적으로 표시한다. |
| FR-6 | 파일 변경 자동 반영 | AI가 수정한 파일이 기존 파일 감시 파이프라인을 통해 캔버스에 자동 반영된다. |
| FR-7 | 시스템 프롬프트 자동 구성 | 현재 파일, Magam 컴포넌트 API, 프로젝트 구조를 시스템 프롬프트에 자동 포함한다. |
| FR-8 | 채팅 히스토리 | 현재 세션의 대화 내역을 유지하고 스크롤하여 확인할 수 있다. |
| FR-9 | 진행 상태 표시 | AI 처리 중 로딩 상태를 표시하고, 완료/에러 상태를 명확히 구분한다. |
| FR-10 | 실행 중단 | AI 처리 중 "중단" 버튼으로 CLI 프로세스를 즉시 종료할 수 있다. |
| FR-11 | 에러 처리 | CLI 실행 실패, 타임아웃, 비정상 종료 시 사용자에게 명확한 에러 메시지를 표시한다. |
| FR-12 | 미설치 안내 | 감지된 CLI가 없을 때 설치 가이드와 재탐색 버튼을 제공한다. |

---

## 8. 비기능 요구사항

| ID | 항목 | 기준 |
|---|---|---|
| NFR-1 | 응답 시작 지연 | CLI 프로세스 시작부터 첫 stdout 수신까지 p95 2초 이하 |
| NFR-2 | 스트리밍 체감 | stdout 청크 수신 후 UI 반영까지 100ms 이하 |
| NFR-3 | 캔버스 안정성 | AI 파일 수정 중 캔버스 크래시/전체 재마운트 0회 |
| NFR-4 | 프로세스 안전성 | CLI 프로세스 비정상 종료 시 좀비 프로세스 0개 |
| NFR-5 | 메모리 안정성 | 채팅 히스토리 100개 메시지에서 메모리 증가량 50MB 이하 |
| NFR-6 | 접근성 | 채팅 입력/메시지 리스트에 적절한 ARIA 속성 제공 |
| NFR-7 | 보안 | CLI 실행 시 사용자 확인 없이 임의 명령이 실행되지 않아야 한다 |

---

## 9. UX 제안

### 9.1 채팅 패널 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  Header  [파일명]                    [AI: Claude Code ▼] │
├─────────────────────────────────┬───────────────────────┤
│                                 │  ┌─ Chat Panel ─────┐ │
│                                 │  │                   │ │
│         Canvas                  │  │  User: 마인드맵에  │ │
│       (ReactFlow)               │  │  새 노드 추가해줘  │ │
│                                 │  │                   │ │
│                                 │  │  AI: 네, marketing│ │
│                                 │  │  노드 아래에 3개   │ │
│                                 │  │  하위 노드를       │ │
│                                 │  │  추가하겠습니다... │ │
│                                 │  │                   │ │
│                                 │  │  ✓ 파일 수정 완료  │ │
│                                 │  │                   │ │
│                                 │  ├───────────────────┤ │
│                                 │  │ [메시지 입력...]   │ │
│                                 │  │           [전송▶] │ │
│                                 │  └───────────────────┘ │
├─────────────────────────────────┴───────────────────────┤
│  Footer / Status Bar                                     │
└─────────────────────────────────────────────────────────┘
```

### 9.2 채팅 패널 상태

| 상태 | 표현 |
|------|------|
| 초기 (AI 감지 전) | 스캔 중 스피너 |
| AI 미설치 | 설치 안내 카드 + 설치 링크 + "다시 확인" 버튼 |
| 준비 완료 | 입력 활성화 + 선택된 AI 표시 |
| AI 처리 중 | 스트리밍 텍스트 + 로딩 인디케이터 + "중단" 버튼 |
| 완료 | AI 응답 + 파일 변경 요약 배지 |
| 에러 | 에러 메시지 + 재시도 버튼 |

### 9.3 AI 도구 선택 UI

- 헤더 우측에 드롭다운: `[🤖 Claude Code ▼]`
- 감지된 도구만 선택 가능 (미설치는 회색 + 설치 링크)
- 선택 변경 시 새 세션 시작 권장 안내

### 9.4 메시지 표현

- **사용자 메시지**: 우측 정렬, 배경색 구분
- **AI 응답**: 좌측 정렬, 마크다운 렌더링 지원
- **시스템 메시지**: 중앙 정렬, 작은 폰트 (파일 변경 알림, AI 전환 등)
- **파일 변경 배지**: AI 응답 하단에 `📄 architecture.tsx 수정됨` 형태로 표시

### 9.5 단축키

| 동작 | 단축키 |
|------|--------|
| 채팅 패널 열기/닫기 | `Cmd/Ctrl + L` |
| 메시지 전송 | `Enter` (Shift+Enter로 줄바꿈) |
| AI 처리 중단 | `Cmd/Ctrl + .` 또는 `Esc` |
| 입력창 포커스 | `Cmd/Ctrl + L` (패널 열린 상태) |

---

## 10. 기술 설계 개요

### 10.1 아키텍처

```
┌─ Next.js Frontend (Port 3000) ─────────────────────────┐
│                                                          │
│  ChatPanel Component                                     │
│    ├─ AI Selector (드롭다운)                              │
│    ├─ Message List (스크롤)                               │
│    ├─ Input Area (입력 + 전송)                            │
│    └─ Status Indicator                                   │
│                                                          │
│  Zustand Store (chat slice)                              │
│    ├─ messages[]                                         │
│    ├─ activeProvider                                     │
│    ├─ availableProviders[]                               │
│    ├─ status: idle | thinking | streaming | error        │
│    └─ currentSessionId                                   │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │ API Route / WebSocket
                       ▼
┌─ CLI Server Layer (Port 3002 or 3001) ──────────────────┐
│                                                          │
│  ChatHandler                                             │
│    ├─ CLIDetector (설치 감지)                              │
│    ├─ CLIAdapter (claude | gemini | codex)                │
│    │    ├─ 프로세스 spawn                                  │
│    │    ├─ stdin에 프롬프트 전달                            │
│    │    ├─ stdout/stderr 스트리밍                          │
│    │    └─ 프로세스 라이프사이클 관리                        │
│    ├─ PromptBuilder (시스템 프롬프트 구성)                   │
│    └─ SessionManager (세션/히스토리)                        │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │ child_process.spawn()
                       ▼
┌─ Local AI CLI ──────────────────────────────────────────┐
│  claude / gemini / codex                                 │
│    ├─ 프로젝트 파일 읽기                                   │
│    ├─ 파일 수정/생성                                      │
│    └─ stdout으로 진행 상황 출력                             │
└──────────────────────┬───────────────────────────────────┘
                       │ 파일 시스템 변경
                       ▼
┌─ 기존 Magam 파이프라인 ────────────────────────────────────┐
│  chokidar 파일 감시 → WebSocket 브로드캐스트                 │
│    → HTTP /render 재호출 → 캔버스 자동 업데이트              │
└─────────────────────────────────────────────────────────┘
```

### 10.2 CLI 어댑터 인터페이스

```ts
interface CLIAdapter {
  name: string;                    // 'claude' | 'gemini' | 'codex'
  displayName: string;             // 'Claude Code' | 'Gemini CLI' | 'Codex CLI'
  command: string;                 // 실행 파일 경로
  isInstalled(): Promise<boolean>;
  getVersion(): Promise<string | null>;
  buildArgs(prompt: string, options: CLIRunOptions): string[];
  spawn(args: string[], cwd: string): ChildProcess;
  parseOutputStream(stream: Readable): AsyncIterable<ChatChunk>;
}

interface CLIRunOptions {
  systemPrompt?: string;
  workingDirectory: string;
  currentFile?: string;
  timeout?: number;               // 기본 300초
  allowedTools?: string[];        // CLI별 허용 도구 제한
}

interface ChatChunk {
  type: 'text' | 'tool_use' | 'file_change' | 'error' | 'done';
  content: string;
  metadata?: Record<string, unknown>;
}
```

### 10.3 CLI별 실행 전략

| CLI | 실행 방식 | 프롬프트 전달 | 출력 파싱 |
|-----|----------|-------------|----------|
| Claude Code | `claude --print -p "prompt"` 또는 `claude --json` | CLI 인자 또는 stdin pipe | stdout 텍스트 스트림 |
| Gemini CLI | `gemini -p "prompt"` | CLI 인자 | stdout 텍스트 스트림 |
| Codex CLI | `codex "prompt"` | CLI 인자 | stdout 텍스트 스트림 |

> 각 CLI의 정확한 인자 형식은 구현 시점의 최신 CLI 버전에 맞춰 조정한다.

### 10.4 시스템 프롬프트 자동 구성

AI CLI 호출 시 다음 컨텍스트를 자동으로 포함한다:

```
1. 역할 정의
   "You are working with Magam, an AI-native programmatic whiteboard."

2. 현재 파일 정보
   - 파일 경로: {currentFile}
   - 파일 내용 (전체 또는 요약)

3. Magam 컴포넌트 API 요약
   - Canvas, MindMap, Node, Shape, Sticky, Text, Edge 등
   - 기본 사용 패턴 및 필수 규칙

4. 프로젝트 구조
   - 작업 디렉토리 내 .tsx 파일 목록

5. 출력 규칙
   - @magam/core에서 import
   - default export function 형태
   - Tailwind 클래스 사용 가능
```

### 10.5 변경 지점 요약

| 레이어 | 파일/모듈 | 변경 내용 |
|--------|----------|----------|
| Frontend | `app/store/graph.ts` | chat 상태 슬라이스 추가 (또는 별도 `chat.ts` 스토어) |
| Frontend | `app/components/chat/` | ChatPanel, MessageList, ChatInput, AISelector 컴포넌트 신규 |
| Frontend | `app/components/ui/Header.tsx` | 채팅 토글 버튼 추가 |
| Frontend | `app/app/api/chat/` | 채팅 API 라우트 (CLI 실행 프록시) |
| Backend | `libs/cli/src/chat/` | CLIDetector, CLIAdapter, PromptBuilder, SessionManager 신규 |
| Backend | `libs/cli/src/server/http.ts` | `/chat/send`, `/chat/providers`, `/chat/stop` 엔드포인트 추가 |
| Shared | `libs/shared/src/` | 채팅 관련 공용 타입 정의 |

---

## 11. 단계별 구현 계획

### Phase 1: CLI 감지 및 어댑터 기반 구축

- CLI 감지 모듈 구현 (which/where + version 확인)
- CLI 어댑터 인터페이스 정의 및 Claude Code 어댑터 구현
- 프로세스 spawn/관리 유틸리티
- 단위 테스트

완료 기준: Claude Code 설치 여부를 감지하고 프로세스를 안전하게 실행/종료할 수 있다.

### Phase 2: 시스템 프롬프트 및 서버 엔드포인트

- PromptBuilder 구현 (현재 파일, 컴포넌트 API, 프로젝트 구조 수집)
- HTTP 엔드포인트 추가 (`/chat/providers`, `/chat/send`, `/chat/stop`)
- 응답 스트리밍 (Server-Sent Events 또는 WebSocket)
- 에러 핸들링 및 타임아웃

완료 기준: HTTP 요청으로 Claude Code를 실행하고 응답을 스트리밍으로 수신할 수 있다.

### Phase 3: 채팅 UI 기본 구현

- Zustand 채팅 상태 슬라이스 추가
- ChatPanel 컴포넌트 (메시지 리스트, 입력, AI 선택)
- 메시지 전송/수신 흐름 연결
- 기본 마크다운 렌더링

완료 기준: 채팅 UI에서 메시지를 입력하면 AI 응답이 스트리밍되어 표시된다.

### Phase 4: 파일 변경 연동 및 캔버스 반영

- AI 파일 변경 → 기존 파일 감시 → 캔버스 자동 업데이트 검증
- 파일 변경 알림 배지 (채팅 내 표시)
- 동시 변경 충돌 방지 (AI 처리 중 사용자 편집 경고)

완료 기준: AI가 파일을 수정하면 캔버스가 자동 업데이트되고, 채팅에 변경 파일이 표시된다.

### Phase 5: 추가 CLI 어댑터 및 UX 완성

- Gemini CLI, Codex CLI 어댑터 추가
- 미설치 안내 UI
- 채팅 히스토리 관리 (세션별)
- 중단 기능, 에러 재시도
- 단축키 연결

완료 기준: 3개 CLI 도구를 자유롭게 전환하여 사용할 수 있다.

### Phase 6: 품질 및 성능 마무리

- 스트리밍 성능 최적화
- 프로세스 안정성 (좀비 프로세스 방지, 비정상 종료 처리)
- 접근성 점검
- 보안 검토 (CLI 인자 인젝션 방지)
- E2E 테스트

완료 기준: NFR 전체 충족, 보안 검토 완료.

---

## 12. 성공 지표

1. **채팅 사용률**: 활성 사용자 중 채팅 기능 사용 비율 50% 이상
2. **다이어그램 생성 효율**: AI 채팅을 통한 다이어그램 생성/수정 성공률 80% 이상
3. **응답 만족도**: AI 응답 후 추가 수동 편집 비율 40% 이하
4. **도구 다양성**: 2개 이상의 AI 도구가 실제로 사용되는 비율 20% 이상
5. **에러율**: 채팅 관련 오류(프로세스 실패, 파싱 에러 등) 2% 미만

---

## 13. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| CLI 도구 인터페이스 변경 | 어댑터 호환성 깨짐 | 어댑터 패턴으로 격리, 버전별 분기, CI에서 호환성 테스트 |
| CLI 프로세스 무한 대기/행 | 리소스 누수, UX 저하 | 타임아웃(기본 300초), 강제 종료, 프로세스 모니터링 |
| 사용자 CLI 미설치 | 기능 사용 불가 | 명확한 안내 UI, 설치 가이드, 대체 수단 제안 |
| AI의 잘못된 파일 수정 | 다이어그램 깨짐 | 수정 전 파일 백업, undo 기능, 변경 diff 표시 |
| 보안: CLI 인자 인젝션 | 임의 명령 실행 | 인자 이스케이프, allowlist 기반 검증, 사용자 확인 |
| stdout 파싱 불일치 | 응답 표시 오류 | CLI별 파서 분리, 폴백 raw 텍스트 표시 |
| 대용량 프로젝트 컨텍스트 | CLI 토큰 한도 초과 | 컨텍스트 크기 제한, 관련 파일만 선별, 요약 전략 |

---

## 14. 오픈 질문

1. **세션 영속성**: 채팅 히스토리를 파일 시스템에 저장할지, 메모리에서만 유지할지?
2. **멀티 파일 편집**: AI가 여러 파일을 동시에 수정할 때의 UX는? (변경 파일 목록 표시? 개별 확인?)
3. **권한 모델**: AI CLI 실행 시 사용자에게 매번 확인을 받을지, 세션 단위로 허용할지?
4. **컨텍스트 범위**: 시스템 프롬프트에 현재 파일만 포함할지, 전체 프로젝트 파일을 포함할지?
5. **CLI 동시 실행**: 이전 요청이 처리 중일 때 새 요청을 큐잉할지, 이전 요청을 중단할지?
6. **오프라인 모드**: CLI 도구가 네트워크 없이 동작하는 경우에 대한 별도 지원이 필요한지?
7. **채팅 패널 위치**: 오른쪽 사이드바 고정 vs 하단 패널 vs 사용자 선택 가능?
