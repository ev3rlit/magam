# Web Demo Subfeature 003: Scratch Workspace Editor

## 목적

읽기 전용 example source를 편집 가능한 메모리 scratch 문서로 복제하고, 에디터 UX를 제공한다.

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

    class F003,C3,C4,A4,A5 current;
    class F001,F002 dependency;
    class F004,F005 impact;
    class P1 current;
    class R2 impact;
    class C0,C1,C2,C5,C6,B1,B2,B3,A1,A2,A3,R1,R3,R4,P2,P3,P4,E1,E2,E3 context;
```

색상 규칙:

- 초록: 이번 단계에서 직접 작업하는 영역
- 주황: 이번 단계의 영향을 받는 후속 영역
- 파랑: 선행 의존 작업 번호
- 회색: 참고 컨텍스트

## 핵심 책임

- `ScratchWorkspace` 계약 기준 메모리 문서 수명주기 정의
- `CodeEditorPort` 계약 기준 editor mount/lifecycle 정의
- `Edit in Scratch`, `Reset`, `Copy` UX 정의

## 작업량 판단

- 중요도: 높음
- 작업량: 중간 이상
- 성격: 의존성 구현 + 사용자 가시 기능

## 선행/후행 관계

- 선행:
  - `001-demo-app-boundary`
  - `002-example-registry-explorer`
- 후행:
  - `004-browser-render-engine`
  - `005-preview-shell-vercel`

## 완료 기준

- scratch 문서가 메모리에서 생성, 수정, 리셋된다.
- 원본 example source는 항상 읽기 전용으로 유지된다.
- scratch 문서는 한 번에 하나만 유지된다.
- 새로고침 시 `sessionStorage` 범위 내에서 복원된다.

## 이번 단계 작업 / 영향 / 의존

- 작업 대상: `F003`, `ScratchWorkspace`, `CodeEditorPort`, `scratch workspace`, `editor adapter`, `preview state`
- 영향 대상: `F004`, `F005`, `render engine`
- 선행 의존 번호: `F001`, `F002`

## 구현 결정

- scratch는 메모리 기반이 기본이지만, 새로고침 복구를 위해 `sessionStorage`까지 허용한다.
- editor는 `CodeMirror`로 고정한다.
- scratch 문서는 한 번에 하나만 연다.
- dirty indicator는 제공하지 않는다.
