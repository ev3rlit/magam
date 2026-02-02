# Graphwrite Obsidian Plugin Roadmap

이 문서는 **"Code as Knowledge"** 철학을 실현하기 위한 Graphwrite 옵시디언 플러그인 개발 로드맵입니다.
작은 기능 단위(MVP)부터 시작하여 양방향 동기화(Bi-directional Sync)까지 단계별로 확장해 나가는 계획을 담고 있습니다.

## 🌟 전체 비전 (Vision)
사용자가 옵시디언 내에서 리액트 기반의 그래프 코드를 작성하면,
1.  **즉시 렌더링**되어 시각적인 다이어그램으로 변환되고
2.  다이어그램을 조작하면 **코드가 자동으로 업데이트**되는
3.  **"살아있는 지식 관리 도구"**를 만든다.

---

## 🎯 Phase 0: 개발 환경 및 기초 (Development Environment & Basics)
> **Goal:** "코드를 한 줄 작성하기 전에 환경을 갖춘다."

옵시디언 플러그인 개발이 처음이라면 반드시 이 단계를 먼저 완료해야 합니다.

*   **0.1. 옵시디언 플러그인 구조 이해**
    *   [ ] 옵시디언 플러그인의 **필수 파일** 이해:
        *   `manifest.json` - 플러그인 메타데이터 (이름, 버전, 최소 옵시디언 버전 등)
        *   `main.js` - 빌드된 플러그인 코드 (진입점)
        *   `styles.css` - 플러그인 전용 스타일 (선택)
    *   [ ] 옵시디언 API 핵심 클래스 학습:
        *   `Plugin` - 플러그인의 기본 클래스 (생명주기 관리)
        *   `ItemView` - 별도 패널/탭을 만들 때 사용
        *   `MarkdownView` - 마크다운 편집기에 접근할 때 사용
        *   `Workspace` - 열린 파일, 패널 관리
        *   `Vault` - 파일 시스템 접근

*   **0.2. 개발 환경 설정**
    *   [ ] 테스트용 옵시디언 Vault 생성 (실제 노트와 분리)
    *   [ ] Vault 내 `.obsidian/plugins/graphwrite/` 폴더 생성
    *   [ ] **Hot Reload 플러그인** 설치 (코드 수정 시 자동 새로고침)
    *   [ ] 옵시디언 설정 → Community Plugins → "Safe Mode" 끄기

*   **0.3. 프로젝트 초기화**
    *   [ ] `obsidian-plugin-template` 또는 수동으로 프로젝트 생성
    *   [ ] TypeScript 설정 (`tsconfig.json`)
    *   [ ] `@types/obsidian` 타입 패키지 설치 (옵시디언 API 자동완성)
    *   [ ] `esbuild` 빌드 스크립트 작성 (watch 모드 포함)

*   **0.4. 디버깅 환경**
    *   [ ] 옵시디언 내 개발자 도구 열기 (`Ctrl+Shift+I` / `Cmd+Option+I`)
    *   [ ] `console.log` 출력 위치 확인
    *   [ ] 에러 스택 트레이스 읽는 법 숙지

> **✅ Definition of Done (Phase 0):**
> 옵시디언에서 "Hello Graphwrite" 알림을 띄우는 최소한의 플러그인이 로드되고, 코드 수정 시 Hot Reload가 동작한다.

---

## 📅 Phase 1: Foundation & Split View (기초 및 분할 뷰)
> **Goal:** "문서는 문서대로 작성하고, 그래프는 별도의 패널에서 본다."

Markdown Map 플러그인처럼, 좌측에는 코드(문서)를 띄우고 우측에는 그래프 뷰어를 띄우는 **Split View** 방식을 구현합니다.

*   **1.1. Plugin Scaffolding**
    *   [ ] `obsidian-plugin-template` 기반으로 새 프로젝트 생성 (`apps/plugin-obsidian`)
    *   [ ] `libs/core` 연동 및 빌드 설정 (`esbuild` 사용)
    *   [ ] **Command:** "Open Graphwrite View" 명령어 추가

*   **1.2. ItemView Implementation (별도 뷰어)**
    *   [ ] `ItemView`를 상속받는 `GraphwriteView` 클래스 생성
    *   [ ] 옵시디언 Workspace에 뷰 등록 (`registerView`)
    *   [ ] 뷰 내부에 React Root(`createRoot`) 마운트

*   **1.3. Active File Listening**
    *   [ ] 현재 활성화된 마크다운 파일(`Starting File`)을 감지
    *   [ ] 파일 내용이 변경될 때마다(`editor-change`) 이벤트를 수신하여 뷰어에 알림
    *   [ ] **결과:** 사용자가 텍스트 파일을 수정하면, 옆에 띄워둔 그래프 뷰어가 실시간으로 반응함.

*   **1.4. Code Extraction & Rendering**
    *   [ ] 마크다운 파일 전체에서 ` ```graphwrite ` 블록만 추출하는 파서 구현
    *   [ ] **다중 블록 처리:** 블록이 여러 개인 경우, 뷰어 상단에 **탭(Tab) UI**로 전환 가능하게 구현
    *   [ ] 추출된 코드를 뷰어의 리액트 컴포넌트로 전달하여 렌더링

> **✅ Definition of Done (Phase 1):**
> 옵시디언에서 "Open Graphwrite View" 명령어를 실행하면 별도 패널이 열리고, 현재 문서의 ` ```graphwrite ` 블록 내용이 (하드코딩된) 그래프로 렌더링된다.


---

## 🛠 Phase 2: Runtime Compiler (런타임 컴파일러)
> **Goal:** "사용자가 작성한 코드를 진짜로 실행한다."

하드코딩을 벗어나, 사용자가 작성한 임의의 JSX 코드를 브라우저(옵시디언) 상에서 해석하고 실행합니다.

*   **2.1. In-App Transpiler Setup**
    *   [ ] `sucrase` 또는 `@babel/standalone` 라이브러리 탑재 (가볍고 빠른 것 선택)
    *   [ ] 입력받은 `String`(JSX)을 `React.createElement` 호환 Javascript 코드로 변환

*   **2.2. Dynamic Component Injection**
    *   [ ] 변환된 코드를 `new Function` 또는 `eval`을 통해 실행형 객체로 생성
    *   [ ] `Graphwrite`의 핵심 컴포넌트(`Node`, `Edge`, `Layout` 등)를 실행 컨텍스트(Scope)에 주입
    *   [ ] **결과:** 사용자가 ` ```graphwrite ` 안에 `<Node id="a" />`를 쓰면 실제로 노드가 그려짐.

*   **2.3. Security Considerations (보안 고려사항)**
    *   [ ] 사용자 코드 실행 시 `new Function`/`eval` 사용에 따른 **보안 경고** 검토
    *   [ ] 옵시디언 Community Plugin 가이드라인 준수 여부 확인
    *   [ ] 필요 시 `iframe` 기반 **샌드박스 격리** 또는 Web Worker 활용 검토

*   **2.4. Error Boundary & Feedback UI**
    *   [ ] 사용자 코드가 문법 에러(Syntax Error)를 낼 경우, 옵시디언이 멈추지 않도록 격리 (`ErrorBoundary`)
    *   [ ] 에러 발생 시, 다이어그램 영역에 "빨간 박스"로 에러 메시지와 줄 번호 표시

> **✅ Definition of Done (Phase 2):**
> 사용자가 ` ```graphwrite ` 블록 안에 임의의 JSX 코드를 작성하면, 실시간으로 파싱되어 그래프가 렌더링된다. 문법 오류 시 친절한 에러 메시지가 표시된다.

---

## 🔄 Phase 3: Bi-directional Sync (양방향 동기화)
> **Goal:** "그림을 만지면 코드가 바뀐다. (The 'Wow' Factor)"

Graphwrite의 핵심 가치입니다. 캔버스 상의 인터랙션을 감지하여 원본 마크다운 텍스트를 역으로 수정합니다.

> **Note:** Canvas는 좌표 기반, MindMap은 ELK 기반 Auto-Layout을 사용합니다. 두 경우 모두 결국 **소스 코드 파일을 수정하는 방식**이므로 Drag Sync가 가능합니다.

*   **3.1. AST Parsing & Mapping**
    *   [ ] 원본 소스 코드를 AST(Abstract Syntax Tree)로 파싱
    *   [ ] 렌더링된 각 노드(`Node Component`)와 소스 코드상의 위치(Line, Column) 매핑 정보 구축

*   **3.2. Drag & Drop Sync**
    *   [ ] 캔버스에서 노드 위치 이동 이벤트(`onNodeDrag`) 감지
    *   [ ] 변경된 `x`, `y` 좌표 값을 계산 (또는 MindMap의 경우 구조 변경)
    *   [ ] AST를 순회하여 해당 노드의 `props` 부분을 찾고, 텍스트를 새로운 좌표값으로 치환 (`string.replace`보다 정교한 AST 변환 필요)
    *   [ ] 옵시디언 `Editor` API를 호출하여 파일 내용 업데이트

*   **3.3. Text/Property Sync**
    *   [ ] 노드의 텍스트(Label) 더블 클릭 시 인라인 수정 모드 진입
    *   [ ] 수정 완료 시, 코드의 `label="..."` 속성 업데이트

*   **3.4. Selection Sync (Usability)**
    *   [ ] 다이어그램 노드 클릭 시 -> 마크다운 편집기 커서를 해당 코드 줄로 이동
    *   [ ] 마크다운 편집기에서 코드 클릭 시 -> 다이어그램의 해당 노드 하이라이트

> **✅ Definition of Done (Phase 3):**
> 뷰어에서 노드를 드래그하거나 텍스트를 수정하면, 옆에 열린 마크다운 파일의 코드가 자동으로 업데이트된다.

---

## 📦 Phase 4: Ecosystem & Polish (확장 및 완성)
> **Goal:** "실전에서 쓸 수 있는 도구가 된다."

*   **4.1. Import External Files** *(TBD: 실현 가능성 추후 조사)*
    *   [ ] 다른 파일에 정의된 컴포넌트 가져오기 기능 (`import { MySystem } from './components.ts'`)
    *   [ ] 로컬 파일 시스템(`Vault`) 접근 권한 및 파일 읽기 처리
    *   [ ] 옵시디언 샌드박스 정책 검토 필요

*   **4.2. Snippets & Templates**
    *   [ ] 자주 쓰는 패턴(Flowchart, Mindmap, ERD 등)을 템플릿으로 제공
    *   [ ] 슬래시 커맨드(`/`) 지원

*   **4.3. Export**
    *   [ ] 현재 렌더링된 캔버스를 `PNG`, `SVG` 이미지 파일로 저장
    *   [ ] 클립보드 복사 지원

*   **4.4. Settings Tab (설정 UI)**
    *   [ ] `PluginSettingTab`을 상속받는 설정 화면 구현
    *   [ ] 설정 항목 예시:
        *   기본 테마 (Dark/Light/System)
        *   기본 레이아웃 타입 (Canvas/Mindmap)
        *   자동 렌더링 On/Off
    *   [ ] 설정값 저장 및 불러오기 (`loadData`, `saveData`)

*   **4.5. Ribbon Icon & Hotkeys**
    *   [ ] 좌측 사이드바에 **Graphwrite 아이콘** 추가 (`addRibbonIcon`)
    *   [ ] 아이콘 클릭 시 Graphwrite View 열기
    *   [ ] 사용자 정의 단축키 등록 (`addCommand`에 `hotkeys` 옵션)

*   **4.6. 모바일 지원 검토**
    *   [ ] 옵시디언 iOS/Android 앱에서 플러그인 동작 테스트
    *   [ ] 터치 이벤트 대응 (드래그, 핀치 줌 등)
    *   [ ] 모바일에서 지원하지 않을 기능 명시 (예: 양방향 동기화는 데스크탑 전용)

> **✅ Definition of Done (Phase 4):**
> 템플릿으로 빠르게 다이어그램을 생성하고, 완성된 결과물을 이미지로 내보낼 수 있다. 설정 화면에서 플러그인 동작을 커스터마이징할 수 있다.

---

## � Phase 5: 배포 및 운영 (Deployment & Operations)
> **Goal:** "세상에 공개하고 지속적으로 개선한다."

*   **5.1. Community Plugin 등록 준비**
    *   [ ] 옵시디언 [Community Plugins 가이드라인](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines) 정독
    *   [ ] `manifest.json` 최종 검토 (버전, minAppVersion 등)
    *   [ ] `README.md` 작성 (설치 방법, 사용법, 스크린샷)
    *   [ ] `LICENSE` 파일 추가 (MIT 등)

*   **5.2. GitHub 릴리즈**
    *   [ ] GitHub Repository 생성 (공개)
    *   [ ] 릴리즈 시 필요한 파일: `main.js`, `manifest.json`, `styles.css`
    *   [ ] Git Tag 기반 버전 관리 (`v1.0.0`, `v1.0.1` 등)

*   **5.3. 릴리즈 자동화 (CI/CD)**
    *   [ ] GitHub Actions 워크플로우 작성
    *   [ ] 새 태그 푸시 시 자동 빌드 및 릴리즈 Asset 업로드
    *   [ ] 예시: `.github/workflows/release.yml`

*   **5.4. 번들 최적화**
    *   [ ] `libs/core` 전체 번들링 시 크기 측정
    *   [ ] Tree-shaking 적용 (사용하지 않는 코드 제거)
    *   [ ] 목표: `main.js` 크기 1MB 이하 권장

*   **5.5. Community Plugin 등록 (PR)**
    *   [ ] [obsidian-releases](https://github.com/obsidianmd/obsidian-releases) 레포지토리에 PR 제출
    *   [ ] `community-plugins.json`에 플러그인 정보 추가
    *   [ ] 리뷰 피드백 대응 및 머지 대기

> **✅ Definition of Done (Phase 5):**
> 옵시디언 앱 내 "Community Plugins" 탭에서 검색하여 설치할 수 있다.

---

## �📝 개발 원칙 (Development Principles)

1.  **Fail Safely**: 사용자 코드가 잘못되어도 옵시디언 전체가 죽으면 안 된다. 강력한 에러 격리가 필수.
2.  **Performance**: 텍스트를 한 글자 칠 때마다 전체가 리렌더링되면 렉이 걸린다. `Debounce`(지연 처리)와 부분 업데이트 최적화가 중요.
3.  **Native Feel**: 옵시디언의 테마(Dark/Light)와 UI 스타일을 그대로 따라가서 이질감이 없어야 한다.

