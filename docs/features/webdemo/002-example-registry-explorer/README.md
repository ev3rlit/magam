# Web Demo Subfeature 002: Example Registry Explorer

## 목적

`examples/`를 읽기 전용 정적 데이터로 변환하고, 가상 파일 탐색기 UX를 제공한다.

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

    class F002,C2,B1,B2,B3,A2,A3 current;
    class F001 dependency;
    class F003,F004,F005,A4,P1,R1,R2,R3,R4,P2,P3,P4 impact;
    class C0,C1,C3,C4,C5,C6,A1,A5,E1,E2,E3 context;
```

색상 규칙:

- 초록: 이번 단계에서 직접 작업하는 영역
- 주황: 이번 단계의 영향을 받는 후속 영역
- 파랑: 선행 의존 작업 번호
- 회색: 참고 컨텍스트

## 핵심 책임

- build-time manifest 생성
- `ExampleRepository` 계약 기준 트리/소스 제공 구조 정의
- 가상 파일 탐색기와 read-only source view 연결
- 포함 파일 기준 큐레이션과 수동 override 메타데이터 반영

## 작업량 판단

- 중요도: 높음
- 작업량: 중간
- 성격: 선행 의존성 + 사용자 가시 기능

## 선행/후행 관계

- 선행:
  - `001-demo-app-boundary`
- 후행:
  - `003-scratch-workspace-editor`
  - `004-browser-render-engine`
  - `005-preview-shell-vercel`

## 완료 기준

- API 없이 예제 트리와 소스를 읽을 수 있다.
- 사용자가 파일을 선택하면 예제 코드와 렌더 대상이 바뀐다.
- 기본 예제는 `examples/readme.tsx`로 시작하고 override로 바꿀 수 있다.

## 이번 단계 작업 / 영향 / 의존

- 작업 대상: `F002`, `examples/ source`, `manifest generator`, `static example registry`, `ExampleRepository`, `virtual explorer`, `example source view`
- 영향 대상: `scratch workspace`, `preview state`, `render engine`
- 선행 의존 번호: `F001`

## 구현 결정

- manifest는 build 시에만 생성한다.
- 전체 자동 노출이 아니라 포함 파일 기준으로 명시적으로 선택한다.
- 파일명 기반 자동 메타데이터를 기본으로 하되, 수동 override 파일을 허용한다.
- 기본 진입 파일은 `examples/readme.tsx`로 시작하되 override로 교체 가능해야 한다.
