# Web Demo Subfeature 001: Demo App Boundary

## 목적

기존 로컬 워크스페이스 앱과 web demo의 앱/패키지/네트워크 경계를 분리한다.

## 레이어 다이어그램

```mermaid
flowchart LR
    subgraph FeaturePlan["Feature Plan"]
        F001["001 Demo App Boundary"]
        F002["002 Example Registry Explorer"]
        F003["003 Scratch Workspace Editor"]
        F004["004 Browser Render Engine"]
        F005["005 Preview Shell Vercel"]
        F001 --> F002
        F001 --> F003
        F001 --> F004
        F002 --> F003
        F002 --> F004
        F003 --> F004
        F001 --> F005
        F002 --> F005
        F003 --> F005
        F004 --> F005
    end

    subgraph Contracts["Contracts Layer"]
        C0["contracts/index.ts"]
        C1["shared.ts"]
        C2["example-repository.ts"]
        C3["scratch-workspace.ts"]
        C4["code-editor-port.ts"]
        C5["import-resolver.ts"]
        C6["demo-render-engine.ts"]
        C0 --> C1
        C0 --> C2
        C0 --> C3
        C0 --> C4
        C0 --> C5
        C0 --> C6
    end

    subgraph BuildTime["Build-Time Layer"]
        B1["examples/ source"]
        B2["manifest generator"]
        B3["static example registry"]
        B1 --> B2 --> B3
    end

    subgraph Runtime["Demo Runtime Layer"]
        A1["apps/web-demo app shell"]
        A2["virtual explorer"]
        A3["example source view"]
        A4["scratch workspace"]
        A5["editor adapter"]
        A1 --> A2
        A1 --> A3
        A1 --> A4
        A4 --> A5
    end

    subgraph Engine["Browser Render Layer"]
        R1["import resolver"]
        R2["render engine"]
        R3["worker bridge"]
        R4["browser transpile evaluate"]
        R1 --> R2
        R2 --> R3 --> R4
    end

    subgraph Preview["Preview Layer"]
        P1["preview state"]
        P2["parseRenderGraph"]
        P3["GraphCanvas"]
        P4["error diagnostics panel"]
        P1 --> P2 --> P3
        P1 --> P4
    end

    subgraph Existing["Existing Local App Context"]
        E1["app WorkspaceClient"]
        E2["api render files file-tree"]
        E3["ws file sync"]
        E1 --> E2
        E1 --> E3
    end

    B3 --> A2
    B3 --> A3
    C2 --> A2
    C2 --> A3
    C3 --> A4
    C4 --> A5
    C5 --> R1
    C6 --> R2
    A3 --> P1
    A4 --> P1
    P1 --> R2
    R2 --> P1

    classDef current fill:#dcfce7,stroke:#15803d,color:#111827,stroke-width:2px;
    classDef impact fill:#ffedd5,stroke:#ea580c,color:#111827,stroke-width:1.5px;
    classDef dependency fill:#dbeafe,stroke:#1d4ed8,color:#111827,stroke-width:1.5px;
    classDef context fill:#e5e7eb,stroke:#64748b,color:#111827,stroke-width:1px;

    class F001,A1,E1,E2,E3 current;
    class F002,F003,F004,F005 impact;
    class C0,C1,C2,C3,C4,C5,C6,B1,B2,B3,A2,A3,A4,A5,R1,R2,R3,R4,P1,P2,P3,P4 context;
```

색상 규칙:

- 초록: 이번 단계에서 직접 작업하는 영역
- 주황: 이번 단계의 영향을 받는 후속 영역
- 파랑: 선행 의존 작업 번호
- 회색: 참고 컨텍스트

## 핵심 책임

- `apps/web-demo` 앱 스캐폴드 정의
- 기존 웹과 분리된 별도 Vercel 프로젝트 배포 경계 정의
- 루트 workspace 연결 지점 정의
- demo 앱에서 기존 `/api/*`, WebSocket, `WorkspaceClient` 흐름을 사용하지 않도록 차단
- demo 앱 범위에서 채팅 세션, 그룹, 메시지, provider 선택 기능을 제외

## 작업량 판단

- 중요도: 높음
- 작업량: 중간
- 성격: 선행 의존성

## 선행/후행 관계

- 선행 없음
- 후행:
  - `002-example-registry-explorer`
  - `003-scratch-workspace-editor`
  - `004-browser-render-engine`
  - `005-preview-shell-vercel`

## 완료 기준

- demo 앱의 진입 구조가 고정된다.
- 기존 `app`과 demo 앱 사이의 의존 방향 규칙이 정리된다.
- demo 앱 범위에서 chat/session/group 관련 기능이 명시적으로 제외된다.
- demo 앱이 기존 웹과 분리된 별도 Vercel 프로젝트로 배포된다는 원칙이 고정된다.

## 이번 단계 작업 / 영향 / 의존

- 작업 대상: `F001`, `apps/web-demo app shell`, 기존 로컬 앱 경계
- 영향 대상: `F002`, `F003`, `F004`, `F005`
- 선행 의존 번호: 없음

## 범위 제약

- web demo에서는 채팅 세션이 필요 없다.
- web demo는 기존 웹과 분리된 별도 Vercel 프로젝트로 배포한다.
- 따라서 아래 기능은 demo 앱 범위에서 제외한다.
  - chat panel
  - session sidebar
  - group manager
  - provider selector
  - chat persistence
- 이 제약은 이후 `005-preview-shell-vercel`의 최소 헤더 설계에도 그대로 반영한다.
