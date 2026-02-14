# Canvas Background — 코드 레벨 지원

## Context

이전 단계에서 toolbar UI (BackgroundSelector, store, GraphCanvas 동적 렌더링)는 이미 구현됨.
이제 사용자가 `.tsx` 코드에서 `<Canvas background="lines">` 형태로 배경을 지정할 수 있도록 파이프라인을 확장한다.

**문제**: Canvas 컴포넌트가 현재 `React.Fragment`로 렌더링되어 props가 AST에 전달되지 않음.

## Design Decisions

- Canvas를 `graph-canvas` intrinsic 엘리먼트로 변경하여 reconciler가 Instance를 생성하게 함
- 후처리 단계(`extractCanvasMeta`)에서 `graph-canvas` Instance의 props를 Container의 `meta` 필드로 추출하고, children을 root로 승격
- **우선순위**: 코드에서 `background` 지정 시 파일 로드 시점에 store 반영. toolbar는 세션 중 오버라이드 가능. 코드에 `background` 미지정 시 현재 store 값 유지
- 기존 `<Canvas>` (background 미지정) 코드는 그대로 동작 (하위 호환)

## Data Flow

```
<Canvas background="lines">       (user .tsx code)
  → graph-canvas Instance          (reconciler creates Instance)
  → extractCanvasMeta()            (extract meta, promote children to root)
  → Container { meta: { background: 'lines' }, children: [...] }
  → HTTP JSON response             (meta field serialized automatically)
  → page.tsx reads meta.background (frontend parsing)
  → setGraph({ canvasBackground }) (store update)
  → GraphCanvas renders variant    (ReactFlow Background)
```

## Implementation Steps

### Step 1: Container 타입에 `meta` 추가

**File: `libs/core/src/reconciler/hostConfig.ts`**

```typescript
export type CanvasMeta = {
  background?: 'dots' | 'lines' | 'solid';
};

export type Container = { type: 'root'; children: Instance[]; meta?: CanvasMeta };
```

### Step 2: Canvas 컴포넌트를 `graph-canvas` 엘리먼트로 변경

**File: `libs/core/src/components/Canvas.tsx`**

```typescript
export interface CanvasProps {
  background?: 'dots' | 'lines' | 'solid';
  children?: React.ReactNode;
}

export const Canvas: React.FC<CanvasProps> = ({ background, children }) => {
  return React.createElement('graph-canvas', { background }, children);
};
```

### Step 3: `extractCanvasMeta` 함수 생성

**New File: `libs/core/src/reconciler/extractCanvasMeta.ts`**

- Container.children에서 `graph-canvas` Instance를 찾음
- props에서 `background`를 `CanvasMeta`로 추출
- `graph-canvas`의 children을 Container root로 승격 (기존 children과 합침)
- `graph-canvas` 없으면 (하위 호환) Container 그대로 반환

### Step 4: renderer 파이프라인에 통합

**File: `libs/core/src/renderer.ts`**

현재 체인: `ok(resolveTreeAnchors(container)).andThen(applyLayout)`

변경: `extractCanvasMeta` → `resolveTreeAnchors` → `applyLayout` 순서로 실행.
(extractCanvasMeta가 먼저 실행되어야 children이 root로 승격된 후 anchor 해석 가능)

```typescript
return ok(resolveTreeAnchors(extractCanvasMeta(container))).andThen(applyLayout);
```

### Step 5: Store `setGraph`에 `canvasBackground` 파라미터 추가

**File: `app/store/graph.ts`**

`setGraph` 시그니처에 `canvasBackground?: CanvasBackgroundStyle` 추가.
코드에서 값이 지정된 경우에만 store 업데이트 (미지정이면 현재 값 유지):

```typescript
setGraph: ({ ..., canvasBackground }) =>
  set({
    ...,
    ...(canvasBackground ? { canvasBackground } : {}),
  }),
```

### Step 6: 프론트엔드에서 meta.background 추출

**File: `app/app/page.tsx`**

`data.graph.meta?.background` 값을 읽어 `setGraph`에 전달:

```typescript
const canvasBackground = data.graph.meta?.background;
setGraph({ nodes, edges, needsAutoLayout: hasMindMap, layoutType, mindMapGroups, canvasBackground });
```

## Files to Modify

| File | Change |
|------|--------|
| `libs/core/src/reconciler/hostConfig.ts` | `CanvasMeta` 타입, `Container.meta` 필드 추가 |
| `libs/core/src/components/Canvas.tsx` | Fragment → `graph-canvas` 엘리먼트, `CanvasProps` 인터페이스 |
| `libs/core/src/reconciler/extractCanvasMeta.ts` | **새 파일** — meta 추출 + children 승격 |
| `libs/core/src/renderer.ts` | `extractCanvasMeta` import 및 파이프라인 연결 |
| `app/store/graph.ts` | `setGraph`에 `canvasBackground` 옵셔널 파라미터 추가 |
| `app/app/page.tsx` | `meta.background` 추출 → `setGraph` 전달 |

## Backward Compatibility

- `<Canvas>` (background 미지정): `graph-canvas` Instance 생성되지만 `meta.background`는 undefined → store 값 유지 → 기본 dots
- Canvas 없는 코드 (bare elements): `extractCanvasMeta`에서 `graph-canvas` 못 찾음 → Container 그대로 반환

## Future Extensibility

`CanvasMeta` 타입에 필드 추가로 확장 가능:

```typescript
export type CanvasMeta = {
  background?: 'dots' | 'lines' | 'solid';
  // theme?: 'light' | 'dark';
  // title?: string;
  // gridSize?: number;
};
```

## Verification

1. `bun run build:core` — 코어 라이브러리 빌드 확인
2. `bun test` — 기존 테스트 통과 확인
3. `bun run dev`로 기존 예제 파일 렌더링 — 기존 동작 유지 확인
4. 예제 파일에 `<Canvas background="lines">` 추가 → 캔버스가 line grid로 렌더링 확인
5. toolbar에서 배경 전환 → 오버라이드 동작 확인
6. `background` prop 없는 기존 파일 → 기본값 dots 유지 확인
