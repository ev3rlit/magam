---
trigger: always_on
---

# 에러 핸들링 및 로깅 가이드라인 (Error Handling & Logging Guidelines)

이 문서는 **React 기반 화이트보드/캔버스 애플리케이션** 개발 시 준수해야 할 에러 처리 및 로깅 표준을 정의한다. 모든 코드는 **"에러는 예외(Exception)가 아닌 값(Value)이다"**라는 철학 하에 작성되어야 한다.

## 1. 핵심 철학 (Core Philosophy)

1. **Explicit over Implicit:** 에러 발생 가능성은 함수 시그니처(타입)에 명시되어야 한다.
2. **Context is King:** "에러가 발생했다"는 사실보다 "어떤 맥락(Node ID, 입력 코드 등)에서 발생했는가"가 더 중요하다.
3. **Fail Safely:** 개별 노드의 렌더링 실패가 전체 캔버스(화이트보드)의 붕괴로 이어져서는 안 된다.
4. **Structured Logging:** 모든 로그는 기계가 파싱 가능한 JSON 구조(Structured Log)여야 하며, 컨텍스트가 누적되어야 한다.

---

## 2. 에러 정의 (Error Definition)

모든 비즈니스/시스템 에러는 `AppError`를 확장하거나 따르는 구조체여야 한다.

### 2.1 표준 에러 인터페이스

기본 `Error` 객체만 사용하지 말고, 반드시 **구분 가능한 코드(Code)**와 **컨텍스트(Context)**를 포함해야 한다.

```typescript
type ErrorCode = 
  | 'PARSE_ERROR'       // 코드 파싱 실패
  | 'RUNTIME_ERROR'     // 실행 중 에러
  | 'VALIDATION_ERROR'  // 입력값 검증 실패
  | 'NETWORK_ERROR';    // API 호출 실패

interface ErrorContext {
  [key: string]: any;
}

class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: ErrorContext;

  constructor(message: string, code: ErrorCode, context?: ErrorContext, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    if (cause) this.cause = cause; // ES2022 cause 속성 활용
  }
}

```

---

## 3. 제어 흐름 (Control Flow)

### 3.1 Result Pattern (`neverthrow`) 사용 의무화

예상 가능한 에러(Expected Errors)에 대해 `throw` 사용을 금지한다. 대신 `neverthrow` 라이브러리의 `Result<T, E>`를 반환한다.

* **Do:**
```typescript
import { ok, err, Result } from 'neverthrow';

function parseNodeCode(code: string): Result<AST, AppError> {
  if (!code) return err(new AppError('Code empty', 'VALIDATION_ERROR'));
  // ... logic
  return ok(ast);
}

```


* **Don't:**
```typescript
function parseNodeCode(code: string): AST {
  if (!code) throw new Error('Code empty'); // 금지: 호출자가 에러를 예측할 수 없음
}

```



### 3.2 외부 라이브러리 래핑 (Wrapping Third-party)

`throw`를 유발하는 외부 라이브러리(Axios, Babel 등)는 반드시 `Result.fromThrowable` 또는 `ResultAsync.fromPromise`로 감싸서 경계를 격리한다.

```typescript
const safeTransform = Result.fromThrowable(
  Babel.transform, 
  (e) => new AppError('Babel parse failed', 'PARSE_ERROR', { originalError: e })
);

```

---

## 4. 로깅 전략 (Logging Strategy)

### 4.1 구조화된 로거 (Structured Logger)

단순 문자열 연결(`console.log("Error: " + err)`)을 금지한다. 키-값 쌍(Key-Value Pair)으로 데이터를 남겨야 한다.

### 4.2 컨텍스트 상속 (Context Inheritance)

로거는 계층적이어야 한다. 상위 스코프의 컨텍스트(UserID, SessionID)는 하위 스코프(ComponentID)로 자동 전파되어야 한다.

```typescript
// 1. 앱 진입점
const appLogger = baseLogger.child({ sessionId: 'sess-123' });

// 2. 개별 노드 처리 시
const nodeLogger = appLogger.child({ nodeId: 'node-55', nodeType: 'ReactComponent' });

// 3. 실제 로깅 (sessionId, nodeId가 모두 포함됨)
nodeLogger.info({ codeLength: 500 }, 'Compiling user code started');

```

---

## 5. UI 및 렌더링 (UI Resilience)

### 5.1 컴포넌트 격리 (Component Isolation)

화이트보드 내의 각 사용자 정의 컴포넌트(Node)는 반드시 **개별적인 Error Boundary**로 감싸져야 한다.

* **동작 방식:**
1. 특정 노드 렌더링 실패 (`RUNTIME_ERROR`).
2. Error Boundary가 에러 포착 (`componentDidCatch`).
3. `nodeLogger`를 통해 에러 원인과 컨텍스트 전송.
4. UI는 해당 노드 영역만 "에러 상태(Fallback UI)"로 표시하고, 나머지 화이트보드는 정상 작동 유지.



### 5.2 사용자 피드백

파싱/컴파일 에러 발생 시, 사용자에게 **"몇 번째 줄에서 문제가 발생했는지"** 정확한 위치 정보를 시각적으로 제공해야 한다. (로그의 `context.line`, `context.column` 활용).

---

## 6. 에이전트 체크리스트 (Agent Checklist)

코드를 생성하거나 리팩토링할 때 다음 항목을 자가 점검하라:

1. [ ] **Type Safety:** `any` 타입을 사용하지 않았는가? `try-catch`의 `error` 변수를 `AppError`로 타입 가드 처리했는가?
2. [ ] **Explicit Error:** 함수 반환 타입에 `Result<T, E>`가 명시되어 있는가?
3. [ ] **Contextual Log:** 로그 메시지에 단순히 "Error"라고만 쓰지 않고, `{ nodeId, inputData }` 등 디버깅 정보를 객체로 넘겼는가?
4. [ ] **Preserve Cause:** 에러를 다시 던지거나 래핑할 때, 원본 에러(`cause`)를 유실하지 않았는가?