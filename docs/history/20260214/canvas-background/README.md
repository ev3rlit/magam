# Canvas Custom Background — 함수형 패턴

**날짜**: 2026-02-14
**범위**: `@graphwrite/core`, `graphwrite-app`

## 구현 배경 및 동기

기존 Canvas 배경은 ReactFlow 내장 프리셋(`dots`, `lines`, `solid`)만 지원했다. 사용자가 코드로 커스텀 SVG 배경 패턴을 정의할 수 있는 기능이 필요했다.

핵심 요구사항:
- 기존 프리셋 호환성 유지
- 함수형 패턴으로 SVG 타일을 코드로 정의
- 서버에서 함수 실행, 클라이언트에는 순수 SVG 문자열만 전달

## 핵심 설계 결정

### 서버 사이드 함수 실행 → SVG 문자열 직렬화

함수를 클라이언트에 직렬화할 수 없으므로, **서버에서 함수를 실행하고 결과 SVG 문자열만 JSON으로 전달**하는 방식을 채택했다.

```
사용자 함수 ({ size }) => SVG string
  → Canvas 컴포넌트의 resolveBackground()에서 실행
  → { type: 'custom', svg: string, gap: number } 객체 생성
  → graph-canvas intrinsic element의 props로 전달
  → extractCanvasMeta()가 Container.meta로 추출
  → JSON 응답으로 클라이언트 전달
  → CustomBackground 컴포넌트가 SVG pattern으로 렌더링
```

### 3가지 API 패턴

```tsx
// 1. 프리셋 문자열 (기존)
<Canvas background="dots" />

// 2. 함수 패턴 (gap=24 기본값)
<Canvas background={({ size }) => `
  <circle cx="${size/2}" cy="${size/2}" r="1" fill="#cbd5e1" />
`} />

// 3. 설정 객체 (gap 커스텀)
<Canvas background={{
  gap: 32,
  pattern: ({ size }) => `
    <line x1="0" y1="${size}" x2="${size}" y2="${size}" stroke="#e2e8f0" stroke-width="0.5" />
    <line x1="${size}" y1="0" x2="${size}" y2="${size}" stroke="#e2e8f0" stroke-width="0.5" />
  `
}} />
```

### 데이터 플로우

```
[Server]
Canvas.tsx resolveBackground()
  → 함수 실행 → { type: 'custom', svg, gap }
  → graph-canvas Instance에 background prop 저장

extractCanvasMeta.ts
  → graph-canvas Instance 찾기
  → Container.meta.background에 추출
  → graph-canvas 자식을 루트로 승격

renderer.ts
  → renderToGraph() 파이프라인에 extractCanvasMeta() 통합

[Client]
graph.ts store
  → canvasBackground: string | CustomBackgroundData

GraphCanvas.tsx
  → typeof canvasBackground로 분기
  → string → ReactFlow Background 컴포넌트
  → object { type: 'custom' } → CustomBackground 컴포넌트

CustomBackground.tsx
  → useViewport()로 pan/zoom 동기화
  → SVG <pattern>으로 타일 렌더링
```

## 변경 파일 목록

### Core Library (`@graphwrite/core`)
| 파일 | 변경 |
|------|------|
| `libs/core/src/components/Canvas.tsx` | `resolveBackground()` 함수, `BackgroundProp` 타입 추가 |
| `libs/core/src/reconciler/hostConfig.ts` | `CustomBackground` 타입, `CanvasMeta` 타입 추가 |
| `libs/core/src/reconciler/extractCanvasMeta.ts` | **신규** — meta 추출 + graph-canvas 자식 승격 |
| `libs/core/src/renderer.ts` | `extractCanvasMeta()` 파이프라인 통합 |

### App (`graphwrite-app`)
| 파일 | 변경 |
|------|------|
| `app/store/graph.ts` | `CustomBackgroundData` 타입, `canvasBackground` 유니온 확장 |
| `app/components/CustomBackground.tsx` | **신규** — SVG pattern + useViewport 동기화 |
| `app/components/GraphCanvas.tsx` | 배경 렌더링 분기 (string vs custom object) |
| `app/components/BackgroundSelector.tsx` | 타입 호환성 수정 |
| `app/components/FloatingToolbar.tsx` | BackgroundSelector 제거 |

### Examples
| 파일 | 내용 |
|------|------|
| `examples/canvas_background.tsx` | 커스텀 그리드 기본 예제 |
| `examples/background/*.tsx` | 10개 패턴 예제 (grid, dots, diagonal, honeycomb 등) |

## 주요 논의 사항

### BackgroundSelector 제거
배경이 코드에서 선언되므로 UI 셀렉터는 불필요. BackgroundSelector 컴포넌트는 유지하되 FloatingToolbar에서 제거했다. 향후 코드 편집이 아닌 UI에서 배경을 전환해야 하는 경우 다시 통합 가능.

### Canvas가 Fragment에서 Intrinsic Element로 변경
기존 Canvas는 `React.Fragment`로 구현되어 메타데이터를 전달할 수 없었다. `graph-canvas` intrinsic element를 도입하여 background props를 reconciler 트리에 포함시킨 뒤, `extractCanvasMeta()`가 후처리로 분리한다.
