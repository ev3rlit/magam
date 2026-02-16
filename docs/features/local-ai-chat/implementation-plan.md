# Local AI Chat 구현 계획서 (Implementation Plan)

## 1. 문서 목적

이 문서는 `/docs/features/local-ai-chat/README.md`(PRD)를 기반으로 Local AI Chat v1을 실제 개발/검증 가능한 단위로 분해한 실행 계획이다.

- 기준 문서: `/docs/features/local-ai-chat/README.md`
- 구현 대상 버전: Local AI Chat v1
- 비범위: 자체 API 키 기반 AI 호출, CLI 설치 대행, 실시간 협업 동기화

---

## 2. 목표

### 2.1 제품 목표

1. Magam 채팅 패널에서 자연어 입력으로 다이어그램을 생성/수정한다.
2. 로컬 AI CLI(Claude Code, Gemini CLI, Codex CLI)를 자동 감지하고 실행한다.
3. AI의 stdout을 실시간 스트리밍하여 채팅 UI에 표시한다.
4. AI가 수정한 파일이 기존 파이프라인을 통해 캔버스에 자동 반영된다.
5. 사용자가 추가 비용 없이 자신의 AI 구독을 활용한다.

### 2.2 측정 목표 (PRD 매핑)

1. CLI 프로세스 시작 → 첫 응답 수신 p95 ≤ 2초 (`NFR-1`)
2. stdout 청크 → UI 반영 ≤ 100ms (`NFR-2`)
3. AI 파일 변경 중 캔버스 크래시 0회 (`NFR-3`)
4. 좀비 프로세스 0개 (`NFR-4`)

---

## 3. 범위

### 3.1 In Scope

1. 채팅 사이드 패널 UI (메시지 입력, 목록, AI 선택)
2. CLI 자동 감지 (claude, gemini, codex)
3. **공식 SDK 우선** 어댑터 기반 실행 (Claude Agent SDK, Codex SDK, Gemini 직접 spawn)
4. JSONL/stdout 실시간 스트리밍
5. 시스템 프롬프트 자동 구성 (파일 컨텍스트, Magam API)
6. 파일 변경 → 캔버스 자동 반영 (기존 파이프라인 활용)
7. 채팅 히스토리 (메모리 기반, 세션 내)
8. 실행 중단 기능
9. 에러 핸들링 및 미설치 안내 UI

### 3.2 Out of Scope

1. 자체 LLM API 호출 (API 키 기반)
2. 채팅 히스토리 영속 저장 (파일/DB)
3. 실시간 협업 환경 채팅 동기화
4. CLI 도구 설치 자동화
5. 모바일/태블릿 UI 최적화

---

## 4. 아키텍처 개요

### 4.1 컴포넌트/모듈 책임

#### Backend (`libs/cli/src/chat/`)

1. **`detector.ts`** — CLI 감지 모듈
   - SDK import 가능 여부 확인 (Claude, Codex)
   - `which`/`where` 명령으로 CLI 존재 확인 (Gemini, 폴백)
   - `--version` 실행으로 설치 검증
   - 감지 결과 캐시 (앱 시작 시 1회 + 수동 재탐색)

2. **`adapters/`** — CLI 어댑터 (SDK 우선 설계)
   - `base.ts`: `CLIAdapter` 공통 인터페이스 정의
   - `claude.ts`: **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) 래퍼
     - SDK의 `query()` → async iterator로 JSONL 메시지 수신
     - SDK가 subprocess spawn, JSONL 파싱, 세션 관리를 캡슐화
   - `codex.ts`: **Codex SDK** (`@openai/codex-sdk`) 래퍼
     - SDK의 `Thread.runStreamed()` → async generator로 JSONL 이벤트 수신
     - SDK가 subprocess spawn, JSONL 파싱, 스레드 관리를 캡슐화
   - `gemini.ts`: **직접 spawn** (`child_process.spawn`)
     - Gemini CLI 공식 SDK 미제공, 직접 프로세스 관리 필요
     - stdout NDJSON 파싱 또는 raw text 폴백

3. **`prompt-builder.ts`** — 시스템 프롬프트 구성기
   - 현재 파일 내용 수집
   - Magam 컴포넌트 API 요약 템플릿
   - 프로젝트 파일 구조 수집
   - 토큰 예산 내 컨텍스트 크기 조절

4. **`session.ts`** — 세션 관리
   - 세션 ID 생성/관리
   - 메시지 히스토리 보관 (메모리)
   - SDK 세션 resume 기능 연동 (Claude: `--resume`, Codex: `resumeThread()`)

5. **`handler.ts`** — 채팅 핸들러 (엔드포인트 로직)
   - 메시지 수신 → 어댑터 선택 → SDK/프로세스 실행 → 응답 스트리밍
   - SDK가 프로세스 라이프사이클을 관리 (Claude, Codex), Gemini만 직접 관리

#### Frontend (`app/`)

6. **`app/store/chat.ts`** — 채팅 전용 Zustand 스토어
   - 메시지 목록, 활성 AI 도구, 사용 가능 도구 목록
   - 채팅 상태 (idle/thinking/streaming/error)
   - 세션 ID, 패널 열림 상태

7. **`app/components/chat/`** — 채팅 UI 컴포넌트
   - `ChatPanel.tsx`: 전체 패널 레이아웃 + 토글
   - `MessageList.tsx`: 메시지 목록 + 자동 스크롤
   - `ChatMessage.tsx`: 개별 메시지 (사용자/AI/시스템)
   - `ChatInput.tsx`: 입력 영역 + 전송/중단 버튼
   - `AISelector.tsx`: AI 도구 드롭다운
   - `SetupGuide.tsx`: CLI 미설치 안내 UI

8. **`app/components/ui/Header.tsx`** — 채팅 토글 버튼 추가

9. **`app/app/api/chat/`** — Next.js API 라우트
   - `providers/route.ts`: GET — 사용 가능한 AI CLI 목록
   - `send/route.ts`: POST — 메시지 전송 + 스트리밍 응답
   - `stop/route.ts`: POST — 실행 중단

### 4.2 데이터 흐름

```
1. 사용자가 ChatInput에 메시지 입력 후 Enter
2. store.sendMessage(text) 호출
   → status: 'thinking'
   → messages에 사용자 메시지 추가
3. POST /api/chat/send 호출
   → body: { message, provider, sessionId, currentFile }
4. API Route → CLI HTTP Server 프록시
   → /chat/send 엔드포인트
5. ChatHandler:
   a. PromptBuilder로 시스템 프롬프트 구성
   b. 선택된 CLIAdapter의 run() 호출
      - Claude/Codex: SDK의 query()/runStreamed() → async iterator
      - Gemini: child_process.spawn → stdout 스트림
   c. SDK/프로세스 출력을 ChatChunk로 정규화
   d. ChatChunk를 SSE(Server-Sent Events)로 스트리밍
6. Frontend: EventSource로 SSE 수신
   → status: 'streaming'
   → AI 메시지에 청크 누적 표시
7. CLI가 파일 수정 → chokidar 감지
   → WebSocket file.changed 이벤트
   → 캔버스 자동 재렌더링 (기존 파이프라인)
8. CLI 프로세스 종료
   → SSE done 이벤트
   → status: 'idle'
   → AI 메시지 완료 처리
```

### 4.3 스트리밍 프로토콜 (SSE)

```
event: chunk
data: {"type":"text","content":"네, 마인드맵에 노드를 추가하겠습니다..."}

event: chunk
data: {"type":"tool_use","content":"파일 읽기: architecture.tsx"}

event: chunk
data: {"type":"file_change","content":"architecture.tsx","metadata":{"action":"modified"}}

event: chunk
data: {"type":"text","content":"3개의 하위 노드를 추가했습니다."}

event: done
data: {"type":"done","content":"","metadata":{"duration":4200,"exitCode":0}}

event: error
data: {"type":"error","content":"CLI 프로세스가 비정상 종료되었습니다","metadata":{"exitCode":1}}
```

---

## 5. 데이터 모델

### 5.1 타입 정의

```ts
// ===== Provider (AI CLI 도구) =====

export type ProviderId = 'claude' | 'gemini' | 'codex';

export interface ProviderInfo {
  id: ProviderId;
  displayName: string;          // 'Claude Code'
  command: string;              // 'claude'
  version: string | null;       // '1.0.12'
  isInstalled: boolean;
  installUrl: string;           // 설치 가이드 URL
}

// ===== 메시지 =====

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;                   // UUID
  role: MessageRole;
  content: string;              // 마크다운 텍스트
  providerId?: ProviderId;      // AI 응답인 경우
  fileChanges?: FileChange[];   // AI가 수정한 파일 목록
  timestamp: number;
  status: 'pending' | 'streaming' | 'complete' | 'error';
  error?: string;
}

export interface FileChange {
  filePath: string;
  action: 'created' | 'modified' | 'deleted';
}

// ===== 세션 =====

export interface ChatSession {
  id: string;                   // UUID
  providerId: ProviderId;
  messages: ChatMessage[];
  createdAt: number;
  lastActiveAt: number;
}

// ===== 스토어 상태 =====

export interface ChatState {
  // 패널 UI
  isPanelOpen: boolean;

  // Provider
  providers: ProviderInfo[];
  activeProviderId: ProviderId | null;
  providersLoading: boolean;

  // 세션/메시지
  currentSession: ChatSession | null;
  status: 'idle' | 'thinking' | 'streaming' | 'error';

  // 진행 중 프로세스
  abortController: AbortController | null;
}

// ===== CLI 어댑터 (SDK 우선 설계) =====

export interface CLIAdapter {
  id: ProviderId;
  displayName: string;
  installUrl: string;

  // 감지
  detect(): Promise<ProviderInfo>;

  // 실행 — SDK 또는 직접 spawn, 내부 구현에 따라 다름
  // 공통적으로 AsyncIterable<ChatChunk>를 반환
  run(prompt: string, options: CLIRunOptions): AsyncIterable<ChatChunk>;

  // 중단
  abort(): void;
}

export interface CLIRunOptions {
  systemPrompt: string;
  workingDirectory: string;
  currentFile?: string;
  timeout?: number;             // 기본 300,000ms (5분)
  allowedTools?: string[];      // SDK의 도구 제한 옵션
}

export interface ChatChunk {
  type: 'text' | 'tool_use' | 'file_change' | 'error' | 'done';
  content: string;
  metadata?: Record<string, unknown>;
}

// ===== SDK별 내부 구현 참고 =====
//
// ClaudeAdapter: @anthropic-ai/claude-agent-sdk
//   query({ prompt, options: { systemPrompt, cwd, allowedTools } })
//   → AsyncIterable<Message> → ChatChunk로 변환
//
// CodexAdapter: @openai/codex-sdk
//   new Codex() → startThread() → runStreamed(prompt)
//   → AsyncGenerator<Event> → ChatChunk로 변환
//
// GeminiAdapter: child_process.spawn('gemini', [...args])
//   → stdout NDJSON stream → ChatChunk로 변환
```

### 5.2 시스템 프롬프트 템플릿

```ts
interface PromptContext {
  currentFilePath: string;
  currentFileContent: string;
  projectFiles: string[];          // .tsx 파일 목록
  magamComponentDocs: string;      // @magam/core API 요약
  userMessage: string;
}
```

시스템 프롬프트 구조:

```markdown
# Context

You are working with Magam, an AI-native programmatic whiteboard.
Users describe diagrams and you write React/TSX code using Magam components.

## Current File
- Path: {currentFilePath}
- Content:
```tsx
{currentFileContent}
```

## Available Components (@magam/core)
{magamComponentDocs}

## Project Files
{projectFiles}

## Rules
1. Import components from '@magam/core'
2. Default-export a function returning a <Canvas> element
3. Use Tailwind class names for styling
4. Preserve existing content unless asked to change it

## User Request
{userMessage}
```

---

## 6. 단계별 구현 (Phase 1..6)

## Phase 1. CLI 감지 및 SDK 기반 어댑터 구축

목표: CLI 감지와 SDK 호출의 기반을 만든다. UI 없이 CLI 계층만으로 동작을 검증한다.

### 작업

1. `libs/cli/src/chat/` 디렉토리 생성
2. SDK 패키지 설치
   - `bun add @anthropic-ai/claude-agent-sdk` (Claude Agent SDK)
   - `bun add @openai/codex-sdk` (Codex SDK)
3. `detector.ts` 구현
   - `detectProvider(id: ProviderId): Promise<ProviderInfo>`
   - `detectAllProviders(): Promise<ProviderInfo[]>`
   - SDK import 시도 → `which` 명령 폴백 → `--version` 검증
   - 결과 메모리 캐시
4. `adapters/base.ts` — `CLIAdapter` 인터페이스 정의
   - `run()` → `AsyncIterable<ChatChunk>` 공통 반환 타입
   - `abort()` — 중단 인터페이스
5. `adapters/claude.ts` — Claude Agent SDK 래퍼 구현
   - `@anthropic-ai/claude-agent-sdk`의 `query()` 호출
   - SDK async iterator → `ChatChunk` 정규화
   - `systemPrompt`, `cwd`, `allowedTools` 옵션 매핑
   - SDK가 subprocess 관리를 캡슐화 (직접 spawn 불필요)
6. SDK 메시지 → ChatChunk 변환 유틸리티
   - Claude SDK Message → ChatChunk 매핑
   - 파일 변경 이벤트 추출
7. 단위 테스트
   - 감지 성공/실패 케이스
   - SDK 호출 → ChatChunk 변환 검증
   - abort() 동작 검증

### 산출물

- CLI 감지 모듈 + Claude Agent SDK 기반 어댑터 + 테스트
- `bun test` 통과

### 종료 기준

- Claude Code 설치 여부 감지가 정확히 동작
- SDK `query()` → ChatChunk 스트리밍이 안정적으로 동작
- `abort()` 호출 시 SDK 세션이 즉시 종료됨

---

## Phase 2. 시스템 프롬프트 및 서버 엔드포인트

목표: HTTP 엔드포인트를 통해 채팅 요청을 수신하고 응답을 SSE로 스트리밍한다.

### 작업

1. `prompt-builder.ts` 구현
   - 현재 파일 내용 읽기
   - Magam 컴포넌트 API 요약 텍스트 생성 (정적 템플릿)
   - 프로젝트 `.tsx` 파일 목록 수집
   - 컨텍스트 크기 제한 (상한 설정)
2. `session.ts` 구현
   - 세션 생성/조회/삭제
   - 메시지 히스토리 추가/조회
   - 활성 프로세스 참조 관리
3. `handler.ts` 구현
   - `handleSend(message, providerId, sessionId, currentFile)` → SSE 스트림
   - `handleStop(sessionId)` → 프로세스 강제 종료
   - `handleProviders()` → 감지된 CLI 목록 반환
4. HTTP 엔드포인트 추가 (`libs/cli/src/server/http.ts`)
   - `GET /chat/providers` — 사용 가능 CLI 목록
   - `POST /chat/send` — 메시지 전송 + SSE 응답
   - `POST /chat/stop` — 실행 중단
5. SSE 스트리밍 구현
   - `Content-Type: text/event-stream`
   - 청크 단위 이벤트 전송
   - 정상/에러/완료 이벤트 구분
6. 에러 핸들링
   - CLI 미설치 에러
   - 프로세스 실행 실패
   - 타임아웃
   - stdin/stdout 에러

### 산출물

- 서버 엔드포인트 3개 + PromptBuilder + SessionManager
- curl/httpie로 SSE 스트리밍 동작 확인 가능

### 종료 기준

- `curl -N POST /chat/send`로 SSE 스트리밍 응답 수신 확인
- 시스템 프롬프트에 현재 파일/컴포넌트 API가 정확히 포함됨
- 중단 요청 시 프로세스가 즉시 종료됨

---

## Phase 3. 채팅 UI 기본 구현

목표: 채팅 패널 UI를 구현하고 서버와 연결하여 기본 대화 플로우를 완성한다.

### 작업

1. `app/store/chat.ts` — Zustand 채팅 스토어 구현
   ```ts
   // 주요 액션
   togglePanel(): void;
   setActiveProvider(id: ProviderId): void;
   loadProviders(): Promise<void>;
   sendMessage(text: string): Promise<void>;
   stopGeneration(): void;
   appendChunk(chunk: ChatChunk): void;
   clearSession(): void;
   ```
2. Next.js API 라우트 프록시 구현
   - `app/app/api/chat/providers/route.ts` → GET
   - `app/app/api/chat/send/route.ts` → POST (SSE 프록시)
   - `app/app/api/chat/stop/route.ts` → POST
3. `ChatPanel.tsx` — 전체 패널 레이아웃
   - 오른쪽 사이드바로 슬라이드 인/아웃
   - 리사이즈 가능 (드래그 핸들)
   - 헤더: AI 선택 드롭다운 + 닫기 버튼
   - 바디: 메시지 리스트
   - 풋터: 입력 영역
4. `MessageList.tsx` — 메시지 목록
   - 자동 스크롤 (새 메시지 시 하단 이동)
   - 스크롤 위치 복원 (위로 스크롤 시 자동 스크롤 중단)
   - 빈 상태 안내 문구
5. `ChatMessage.tsx` — 개별 메시지 렌더링
   - 사용자: 우측 정렬, 배경색 구분
   - AI: 좌측 정렬, 마크다운 렌더링 (react-markdown)
   - 시스템: 중앙 정렬, 작은 스타일
   - 스트리밍 중: 커서 깜빡임 애니메이션
   - 파일 변경 배지: 하단에 변경 파일 목록
6. `ChatInput.tsx` — 입력 영역
   - 텍스트 에어리어 (자동 높이 확장)
   - Enter 전송, Shift+Enter 줄바꿈
   - 전송 버튼 (idle일 때) / 중단 버튼 (streaming일 때)
   - 비활성 상태 처리 (AI 미감지 시)
7. `AISelector.tsx` — AI 도구 드롭다운
   - 감지된 도구: 선택 가능 + 버전 표시
   - 미감지 도구: 회색 + 설치 링크
   - 현재 선택 도구 표시
8. `Header.tsx` 수정 — 채팅 토글 버튼 추가
   - `💬 Chat` 버튼 또는 아이콘 버튼
   - `Cmd/Ctrl+L` 단축키 바인딩

### 산출물

- 채팅 패널 UI 전체 + Zustand 스토어 + API 라우트 프록시
- 메시지 입력 → AI 응답 스트리밍 → 표시 플로우 동작

### 종료 기준

- FR-1, FR-3, FR-4, FR-5, FR-8, FR-9 충족
- 채팅 입력 → 서버 전달 → SSE 스트리밍 → UI 표시 전체 플로우 동작
- 기본 마크다운 렌더링 동작

---

## Phase 4. 파일 변경 연동 및 캔버스 반영

목표: AI의 파일 수정이 캔버스에 자동 반영되고, 채팅 UI에 변경 사항이 표시된다.

### 작업

1. 파일 변경 감지 연동 검증
   - AI CLI가 파일 수정 → chokidar 감지 → WebSocket → 캔버스 업데이트
   - 기존 `file.changed` → `re-render` 파이프라인이 AI 변경에도 정상 동작 확인
2. 파일 변경 이벤트를 채팅에 반영
   - SSE `file_change` 이벤트 수신 시 메시지에 FileChange 배지 추가
   - 또는 WebSocket `file.changed`를 채팅 스토어에서도 구독
3. 파일 변경 배지 UI
   - AI 메시지 하단에 `📄 {filePath} 수정됨` 형태
   - 클릭 시 해당 파일로 탭 전환
4. 동시 변경 안전성
   - AI 처리 중 파일 변경 빈도 제어 (debounce 기존 100ms 활용)
   - 빠른 연속 변경 시 마지막 상태로 수렴 확인
5. 파일 백업 전략 (선택적)
   - AI 실행 전 대상 파일의 snapshot 저장
   - 에러 시 롤백 가능하도록 준비

### 산출물

- AI 파일 변경 → 캔버스 자동 업데이트 E2E 동작
- 채팅 내 파일 변경 배지 표시

### 종료 기준

- FR-6 충족
- AI가 `.tsx` 파일 수정 시 1초 이내 캔버스에 반영
- 연속 3회 파일 수정에도 캔버스 크래시 없음

---

## Phase 5. 추가 CLI 어댑터 및 UX 완성

목표: Codex SDK 어댑터, Gemini 직접 spawn 어댑터를 추가하고 UX 완성도를 높인다.

### 작업

1. `adapters/codex.ts` — **Codex SDK** 래퍼 구현
   - `@openai/codex-sdk`의 `Codex` → `Thread` → `runStreamed()` 호출
   - SDK async generator → `ChatChunk` 정규화
   - 스레드 기반 세션 관리 (`resumeThread()` 활용)
   - SDK가 subprocess 관리를 캡슐화
2. `adapters/gemini.ts` — Gemini CLI **직접 spawn** 어댑터 구현
   - `child_process.spawn('gemini', [prompt], { shell: false })` — positional arg 방식
   - stdout NDJSON 파싱 → `ChatChunk` 변환
   - raw text 폴백 (NDJSON 파싱 실패 시)
   - 프로세스 라이프사이클 직접 관리 (타임아웃, SIGTERM → SIGKILL)
   - 알려진 제약: `ShellTool` 비대화형 모드 미지원 이슈 대응
3. `SetupGuide.tsx` — CLI 미설치 안내 UI
   - 각 CLI별 설치 가이드 카드
   - "다시 확인" 버튼 (재탐색)
   - 설치 후 자동 재탐색 (선택적)
4. 채팅 히스토리 관리
   - 세션 시작/종료 로직
   - AI 도구 변경 시 새 세션 시작 안내
   - 세션 내 메시지 목록 유지
5. 실행 중단 기능 완성
   - 중단 버튼 클릭 → `POST /chat/stop` → 프로세스 SIGTERM
   - UI 상태 즉시 idle로 전환
   - 부분 응답 유지 (중단 시점까지의 텍스트)
6. 에러 재시도
   - 에러 메시지 하단에 "재시도" 버튼
   - 마지막 사용자 메시지를 재전송
7. 단축키 연결
   - `Cmd/Ctrl+L`: 패널 열기/닫기
   - `Cmd/Ctrl+.` 또는 `Esc` (패널 포커스 시): AI 중단
   - 입력 포커스 예외 처리

### 산출물

- 3개 CLI 어댑터 + 미설치 안내 + 히스토리 + 중단/재시도

### 종료 기준

- FR-2, FR-3, FR-10, FR-11, FR-12 충족
- 3개 CLI 간 자유 전환 동작
- 미설치 상태에서 안내 UI 정상 표시

---

## Phase 6. 품질, 보안, 성능 마무리

목표: 비기능 요구사항을 충족하고 출시 품질을 확보한다.

### 작업

1. 보안 검토
   - CLI 인자 인젝션 방지 (인자 이스케이프, 사용자 입력 sanitize)
   - 프로세스 실행 권한 검증
   - 작업 디렉토리 제한 (프로젝트 루트 밖 접근 방지)
2. 프로세스 안정성
   - 좀비 프로세스 방지 검증 (장시간 실행/비정상 종료)
   - SIGTERM → 1초 대기 → SIGKILL 폴백
   - 앱 종료 시 활성 프로세스 일괄 정리
3. 스트리밍 성능 최적화
   - stdout 버퍼 크기 조정
   - SSE 청크 배치 (16ms 단위 batching)
   - UI 렌더링 최적화 (virtualized message list 검토)
4. 접근성 점검
   - 채팅 입력: `aria-label="메시지 입력"`
   - 메시지 목록: `role="log"`, `aria-live="polite"`
   - AI 선택: `role="listbox"`
   - 중단 버튼: `aria-label="AI 실행 중단"`
5. E2E 테스트
   - 시나리오 A: 새 다이어그램 생성 플로우
   - 시나리오 B: 기존 다이어그램 수정 플로우
   - 시나리오 C: AI 도구 전환
   - 시나리오 D: 미설치 상태 안내
6. 성능 측정
   - 첫 응답 지연 (p50, p95)
   - 스트리밍 청크 → UI 반영 지연
   - 캔버스 재렌더링 안정성 (프레임 드랍 측정)

### 산출물

- 보안/안정성/접근성/성능 검증 완료
- E2E 테스트 통과

### 종료 기준

- NFR-1 ~ NFR-7 전부 충족
- 보안 리뷰 체크리스트 완료
- E2E 테스트 100% 통과

---

## 7. API 설계

### 7.1 HTTP 엔드포인트

#### `GET /chat/providers`

감지된 AI CLI 목록을 반환한다.

**Response 200:**
```json
{
  "providers": [
    {
      "id": "claude",
      "displayName": "Claude Code",
      "command": "claude",
      "version": "1.0.12",
      "isInstalled": true,
      "installUrl": "https://docs.anthropic.com/en/docs/claude-code"
    },
    {
      "id": "gemini",
      "displayName": "Gemini CLI",
      "command": "gemini",
      "version": null,
      "isInstalled": false,
      "installUrl": "https://github.com/google-gemini/gemini-cli"
    }
  ]
}
```

#### `POST /chat/send`

메시지를 전송하고 SSE 응답을 스트리밍한다.

**Request:**
```json
{
  "message": "마인드맵에 새 노드를 추가해줘",
  "providerId": "claude",
  "sessionId": "uuid-session-123",
  "currentFile": "architecture.tsx",
  "workingDirectory": "/path/to/project"
}
```

**Response: `text/event-stream`**
```
event: chunk
data: {"type":"text","content":"네, 마인드맵에 노드를 추가하겠습니다."}

event: chunk
data: {"type":"file_change","content":"architecture.tsx","metadata":{"action":"modified"}}

event: done
data: {"type":"done","content":"","metadata":{"duration":3200,"exitCode":0}}
```

#### `POST /chat/stop`

진행 중인 AI 실행을 중단한다.

**Request:**
```json
{
  "sessionId": "uuid-session-123"
}
```

**Response 200:**
```json
{
  "stopped": true
}
```

### 7.2 Zustand Store 액션 계약

```ts
// Panel
togglePanel(): void;
openPanel(): void;
closePanel(): void;

// Provider
loadProviders(): Promise<void>;
setActiveProvider(id: ProviderId): void;
refreshProviders(): Promise<void>;

// Session/Message
sendMessage(text: string): Promise<void>;
appendChunk(chunk: ChatChunk): void;
completeMessage(): void;
failMessage(error: string): void;
clearSession(): void;

// Control
stopGeneration(): void;
retryLastMessage(): Promise<void>;

// Selectors
getActiveProvider(): ProviderInfo | null;
getInstalledProviders(): ProviderInfo[];
isProviderReady(): boolean;
```

### 7.3 이벤트 흐름

```
사용자 Enter
  → store.sendMessage(text)
    → 메시지 추가 (role: user, status: complete)
    → AI 메시지 추가 (role: assistant, status: pending)
    → status: 'thinking'
    → fetch('/api/chat/send', { method: 'POST', body, signal })
      → EventSource 또는 ReadableStream 파싱
        → chunk 수신: store.appendChunk(chunk)
          → status: 'streaming' (첫 chunk 시)
          → AI 메시지 content 누적
          → file_change 시 fileChanges 배열에 추가
        → done 수신: store.completeMessage()
          → AI 메시지 status: 'complete'
          → status: 'idle'
        → error 수신: store.failMessage(error)
          → AI 메시지 status: 'error'
          → status: 'error'
    → 중단 시: abortController.abort()
      → POST /api/chat/stop
      → AI 메시지 status: 'complete' (부분 응답 유지)
      → status: 'idle'
```

---

## 8. UI 작업 상세

### 8.1 ChatPanel 레이아웃

- 위치: 캔버스 오른쪽 사이드바
- 기본 너비: 380px
- 최소 너비: 300px, 최대 너비: 600px
- 리사이즈: 좌측 가장자리 드래그
- 열기/닫기 애니메이션: slide-in/out (200ms ease)

### 8.2 헤더

- 좌측: "Chat" 타이틀
- 중앙/우측: AI 선택 드롭다운
- 우측 끝: 닫기 버튼 (X)

### 8.3 메시지 목록

- 스크롤 영역: flex-1 (패널 높이에 맞춤)
- 자동 스크롤: 새 메시지/스트리밍 시 하단으로
- 수동 스크롤: 위로 스크롤하면 자동 스크롤 해제
- "↓ 새 메시지" 버튼: 자동 스크롤 해제 중 새 메시지 시 표시

### 8.4 메시지 스타일

| 역할 | 정렬 | 배경 | 모서리 |
|------|------|------|--------|
| user | 우측 | blue-50 / blue-900 (dark) | rounded-lg, 우측 상단 직각 |
| assistant | 좌측 | gray-50 / gray-800 (dark) | rounded-lg, 좌측 상단 직각 |
| system | 중앙 | transparent | 테두리 없음, 작은 텍스트 |

### 8.5 입력 영역

- textarea: 자동 높이 확장 (1줄~5줄)
- placeholder: "메시지를 입력하세요... (Enter로 전송)"
- 전송 버튼: `→` 아이콘 (idle 시)
- 중단 버튼: `■` 아이콘 (streaming 시, 빨간색)
- 비활성: AI 미감지 시 입력 비활성 + 안내 메시지

### 8.6 미설치 안내 (SetupGuide)

- 패널 중앙에 안내 카드 표시
- 각 CLI별 아이콘, 이름, 설치 링크
- "다시 확인" 버튼 (하단)
- 설치 완료 후 버튼 클릭 → 재탐색 → 감지 시 입력 활성화

---

## 9. 테스트 계획

### 9.1 단위 테스트

**대상: `libs/cli/src/chat/`**

1. **detector.ts**
   - CLI 설치됨 → ProviderInfo 반환 (isInstalled: true, version 포함)
   - CLI 미설치 → ProviderInfo 반환 (isInstalled: false, version: null)
   - which 명령 실패 → graceful fallback
   - 캐시 동작 검증

2. **adapters/claude.ts**
   - buildCommand 인자 구성 정확성
   - parseOutput 청크 파싱 (text, tool_use, file_change)
   - 특수 문자 포함 프롬프트 이스케이프

3. **prompt-builder.ts**
   - 파일 컨텍스트 포함 검증
   - 컴포넌트 API 요약 포함 검증
   - 컨텍스트 크기 상한 적용 검증

4. **session.ts**
   - 세션 생성/조회/삭제
   - 메시지 추가/조회

### 9.2 스토어 테스트

**대상: `app/store/chat.ts`**

1. 초기 상태 검증
2. togglePanel 상태 전이
3. loadProviders → providers 목록 세팅
4. sendMessage → 메시지 추가 + status 전이 (idle → thinking → streaming → idle)
5. appendChunk → 메시지 content 누적
6. stopGeneration → status idle 전환 + 부분 응답 유지
7. failMessage → error 상태 전이
8. setActiveProvider → 도구 변경 + 세션 초기화 안내
9. clearSession → 세션/메시지 초기화

### 9.3 컴포넌트 테스트

**대상: `app/components/chat/`**

1. ChatPanel 열기/닫기 애니메이션
2. AISelector 감지/미감지 도구 표시
3. ChatInput Enter 전송, Shift+Enter 줄바꿈
4. 전송 버튼 (idle) vs 중단 버튼 (streaming) 전환
5. MessageList 자동 스크롤 동작
6. ChatMessage 마크다운 렌더링
7. SetupGuide 재탐색 버튼 동작
8. 파일 변경 배지 표시

### 9.4 통합 테스트

1. 메시지 전송 → SSE 수신 → 메시지 표시 → 완료 전체 흐름
2. AI 파일 수정 → WebSocket 감지 → 캔버스 업데이트
3. 중단 요청 → 프로세스 종료 → UI 상태 전환
4. AI 도구 전환 → 어댑터 교체 → 정상 실행
5. 에러 발생 → 에러 메시지 표시 → 재시도 동작

### 9.5 E2E 테스트

1. 시나리오 A: 빈 파일 → 채팅으로 다이어그램 생성 → 캔버스 확인
2. 시나리오 B: 기존 다이어그램 → 채팅으로 수정 → 변경 반영 확인
3. 시나리오 C: AI 도구 전환 → 이후 요청이 변경된 도구로 실행
4. 시나리오 D: CLI 미설치 → 안내 표시 → 설치 후 재탐색

### 9.6 보안 테스트

1. CLI 인자에 셸 메타문자 포함 시 이스케이프 동작
2. 작업 디렉토리 외부 파일 접근 시도 차단
3. 프로세스 실행 권한 범위 확인

---

## 10. 성능 목표 및 측정 방법

### 10.1 목표

1. CLI 프로세스 시작 → 첫 stdout p95 ≤ 2초
2. stdout 청크 → UI 렌더링 ≤ 100ms
3. 캔버스 재렌더링 크래시/전체 재마운트 0회
4. 100개 메시지 히스토리에서 스크롤 60fps 유지

### 10.2 측정 방법

1. `performance.now()`로 send 시점 → 첫 chunk 수신 시점 측정
2. chunk 수신 시점 → DOM 반영 시점 측정 (requestAnimationFrame)
3. React Profiler로 캔버스 컴포넌트 리렌더 횟수 측정
4. 메시지 100개 상태에서 FPS 측정 (Chrome DevTools Performance)

### 10.3 튜닝 전략

1. SSE 청크 배치 (16ms 윈도우)
2. 메시지 목록 가상화 (메시지 50개 이상 시)
3. 마크다운 렌더링 지연 처리 (스트리밍 중 간소화, 완료 후 전체 렌더)
4. stdout 버퍼 크기 64KB → 필요 시 조정

---

## 11. 보안 설계

### 11.1 위협 모델

| 위협 | 설명 | 대응 |
|------|------|------|
| CLI 인자 인젝션 | 사용자 입력이 셸 명령에 직접 삽입 | **SDK가 인자 처리를 캡슐화** (Claude, Codex), Gemini는 `spawn(shell: false)` + 인자 배열 |
| 디렉토리 탈출 | AI가 프로젝트 외부 파일 접근 | SDK의 `cwd` 옵션으로 제한, CLI의 자체 보안 정책 활용 |
| 도구 권한 과잉 | AI가 불필요한 도구(셸 명령 등) 실행 | SDK의 `allowedTools` 옵션으로 `Read`, `Write`, `Edit`만 허용 |
| 프로세스 폭주 | 무한 루프/대량 출력 | SDK timeout 옵션, Gemini는 자체 타임아웃 + stdout 버퍼 상한 |
| 민감 정보 노출 | 환경 변수/설정 파일이 프롬프트에 포함 | 시스템 프롬프트 구성 시 .env, credentials 파일 제외 |

### 11.2 원칙

1. **SDK를 통한 호출 우선**: Claude/Codex는 SDK가 프로세스 보안을 관리
2. Gemini만 `child_process.spawn`을 사용하며 반드시 `shell: false`로 실행
3. SDK의 `allowedTools` 옵션으로 AI의 도구 사용 범위를 제한
4. 작업 디렉토리는 프로젝트 루트로 고정 (SDK `cwd` 옵션)
5. 환경 변수는 최소한만 전달 (PATH 등 필수만)
6. 프롬프트에 포함할 파일은 `.tsx`만 허용 (설정 파일 제외)

---

## 12. 리스크와 대응

1. **CLI 도구 인터페이스 변경** → 리스크 **낮음** (SDK가 흡수)
   - 대응: SDK 버전 업그레이드로 대응, Gemini만 어댑터 수준에서 직접 분기

2. **프로세스 관리 복잡성** → 리스크 **낮음** (SDK가 캡슐화)
   - 대응: Claude/Codex는 SDK가 프로세스 라이프사이클 관리, Gemini만 직접 관리 (단일 활성 프로세스 정책)

3. **SDK 패키지 호환성**
   - 대응: SDK 버전 pinning, 주요 릴리스 시 호환성 테스트, peer dependency 충돌 모니터링

4. **Gemini CLI 스트리밍 파싱 불안정** (SDK 미제공)
   - 대응: NDJSON 우선, raw 텍스트 폴백, 알려진 비대화형 모드 제약 사항 문서화

5. **대용량 파일 컨텍스트**
   - 대응: 컨텍스트 크기 상한 (예: 50KB), 관련 부분만 선별, 파일 목록만 포함 옵션

6. **크로스 플랫폼 호환성**
   - 대응: SDK가 플랫폼 차이 흡수 (Claude, Codex), Gemini는 `which`/`where` 분기 + CI 다중 OS 테스트

7. **AI 응답 품질 편차**
   - 대응: 시스템 프롬프트 최적화, Magam 컴포넌트 예시 포함, 응답 검증 (TSX 파싱)

---

## 13. 완료 기준 (Definition of Done)

1. FR-1 ~ FR-12 전부 Acceptance Criteria 충족
2. NFR-1 ~ NFR-7 측정/로그 근거가 PR에 포함됨
3. 사용자 시나리오 A/B/C/D/E E2E 통과
4. Claude Code, Gemini CLI, Codex CLI 어댑터 구현 및 테스트
5. 보안 체크리스트 완료 (인자 인젝션, 디렉토리 탈출 등)
6. 접근성 기본 속성 충족 (ARIA)
7. 성능 목표 달성 (첫 응답 p95 ≤ 2초, UI 반영 ≤ 100ms)
8. 프로세스 안정성 (좀비 0, 타임아웃 동작, 강제 종료 동작)
9. 코드 리뷰 승인 및 회귀 이슈 0건

---

## 14. 작업 체크리스트

### 14.1 설계/준비

- [ ] CLI 어댑터 인터페이스 확정 (SDK 우선 설계)
- [ ] SSE 스트리밍 프로토콜 확정
- [ ] 시스템 프롬프트 템플릿 초안 작성
- [ ] Zustand 스토어 상태/액션 설계 확정
- [ ] UI 와이어프레임/목업 확정
- [ ] SDK 패키지 호환성 검증 (`@anthropic-ai/claude-agent-sdk`, `@openai/codex-sdk`)

### 14.2 Backend 구현

- [ ] SDK 패키지 설치 (`@anthropic-ai/claude-agent-sdk`, `@openai/codex-sdk`)
- [ ] CLI 감지 모듈 (`detector.ts`)
- [ ] CLI 어댑터 인터페이스 (`adapters/base.ts`)
- [ ] Claude Code 어댑터 — Claude Agent SDK 래퍼 (`adapters/claude.ts`)
- [ ] Codex CLI 어댑터 — Codex SDK 래퍼 (`adapters/codex.ts`)
- [ ] Gemini CLI 어댑터 — 직접 spawn (`adapters/gemini.ts`)
- [ ] SDK 메시지 → ChatChunk 변환 유틸리티
- [ ] 시스템 프롬프트 빌더 (`prompt-builder.ts`)
- [ ] 세션 관리 (`session.ts`) — SDK 세션 resume 연동
- [ ] 채팅 핸들러 (`handler.ts`)
- [ ] HTTP 엔드포인트 (`/chat/providers`, `/chat/send`, `/chat/stop`)
- [ ] SSE 스트리밍 구현
- [ ] Gemini 프로세스 라이프사이클 관리 (타임아웃, 강제종료)

### 14.3 Frontend 구현

- [ ] Zustand 채팅 스토어 (`store/chat.ts`)
- [ ] Next.js API 라우트 프록시 (`api/chat/`)
- [ ] ChatPanel 컴포넌트
- [ ] MessageList 컴포넌트
- [ ] ChatMessage 컴포넌트 (마크다운 렌더링)
- [ ] ChatInput 컴포넌트
- [ ] AISelector 컴포넌트
- [ ] SetupGuide 컴포넌트
- [ ] Header 채팅 토글 버튼
- [ ] 파일 변경 배지 UI
- [ ] 단축키 연결 (`Cmd/Ctrl+L`, `Cmd/Ctrl+.`)

### 14.4 테스트

- [ ] CLI 감지 단위 테스트
- [ ] Claude SDK 어댑터 단위 테스트 (ChatChunk 변환)
- [ ] Codex SDK 어댑터 단위 테스트 (ChatChunk 변환)
- [ ] Gemini spawn 어댑터 단위 테스트 (NDJSON 파싱)
- [ ] 프롬프트 빌더 단위 테스트
- [ ] 세션 관리 단위 테스트
- [ ] Zustand 스토어 상태 전이 테스트
- [ ] 컴포넌트 렌더/상호작용 테스트
- [ ] SSE 스트리밍 통합 테스트
- [ ] 파일 변경 → 캔버스 통합 테스트
- [ ] E2E 시나리오 테스트
- [ ] 보안 테스트 (인자 인젝션)
- [ ] 성능 측정 리포트

### 14.5 출시

- [ ] 접근성 점검 완료
- [ ] 보안 리뷰 체크리스트 완료
- [ ] 성능 목표 달성 확인
- [ ] 문서 업데이트 (사용법, 지원 CLI 목록)
- [ ] Feature flag 설정 (선택적)

---

## 15. 의존성 요약 (신규 추가)

```
# SDK 패키지 (서버 사이드 전용)
@anthropic-ai/claude-agent-sdk   # Claude Code 공식 SDK (내부적으로 CLI subprocess 관리)
@openai/codex-sdk                # Codex CLI 공식 SDK (내부적으로 CLI subprocess 관리)

# Gemini CLI는 SDK 없음 — child_process.spawn으로 직접 관리
```

## 16. 파일 구조 요약 (신규 생성 대상)

```
libs/cli/src/chat/
├── detector.ts                 # CLI 감지 모듈 (SDK import + which/where 폴백)
├── handler.ts                  # 채팅 핸들러
├── prompt-builder.ts           # 시스템 프롬프트 구성
├── session.ts                  # 세션 관리 (SDK 세션 resume 연동)
├── chunk-normalizer.ts         # SDK 메시지 → ChatChunk 변환 유틸리티
├── adapters/
│   ├── base.ts                 # CLIAdapter 인터페이스
│   ├── claude.ts               # Claude Agent SDK 래퍼 (@anthropic-ai/claude-agent-sdk)
│   ├── codex.ts                # Codex SDK 래퍼 (@openai/codex-sdk)
│   └── gemini.ts               # Gemini CLI 직접 spawn (child_process)
└── __tests__/
    ├── detector.spec.ts
    ├── prompt-builder.spec.ts
    ├── session.spec.ts
    ├── chunk-normalizer.spec.ts
    └── adapters/
        ├── claude.spec.ts
        ├── codex.spec.ts
        └── gemini.spec.ts

app/store/
└── chat.ts                     # Zustand 채팅 스토어

app/components/chat/
├── ChatPanel.tsx               # 전체 패널 레이아웃
├── MessageList.tsx             # 메시지 목록
├── ChatMessage.tsx             # 개별 메시지
├── ChatInput.tsx               # 입력 영역
├── AISelector.tsx              # AI 도구 선택
└── SetupGuide.tsx              # CLI 미설치 안내

app/app/api/chat/
├── providers/route.ts          # GET: 사용 가능 CLI 목록
├── send/route.ts               # POST: 메시지 전송 (SSE)
└── stop/route.ts               # POST: 실행 중단
```

---

## 17. 미해결 의사결정 (Open Decisions)

1. **채팅 패널 위치**: 오른쪽 사이드바 고정 vs 사용자 지정 가능 (하단/오른쪽)
2. **세션 영속성**: 메모리 전용 vs SDK 세션 resume 활용 vs 파일 시스템 저장 (`.magam/chat-history/`)
3. **멀티 파일 편집 UX**: 변경 파일 개별 확인 vs 일괄 알림
4. **CLI 동시 실행 정책**: 단일 활성 프로세스 vs 큐잉
5. **컨텍스트 크기 상한**: 고정값 vs 사용자 설정 가능
6. **SDK 버전 고정 전략**: 정확한 버전 pinning vs semver range 허용
7. **Gemini CLI SDK 전환 시점**: Gemini 공식 SDK 출시 시 어댑터 교체 기준 (자동 감지 vs 수동 업데이트)
