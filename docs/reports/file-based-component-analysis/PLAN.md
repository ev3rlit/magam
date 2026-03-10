# Frame API Implementation Plan

## 목표

현재의 `EmbedScope`/`MindMapEmbed` 중심 공개 API를, 사용자에게는 일반 컴포넌트 사용처럼 보이는 `frame(...)` 기반 고수준 API로 재구성한다.

이 작업의 최종 목표는 다음과 같다.

- `MindMapEmbed`와 `EmbedScope`를 저수준 primitive로 숨긴다
- Canvas와 MindMap 모두에서 동일한 `frame` 개념을 사용한다
- `frame` 안에 하위 `frame`을 중첩할 수 있게 한다
- 로컬 id, 연결, mount, source tracing은 런타임이 내부 처리한다

## 범위

이번 구현 계획의 범위는 특정 예제 파일 리팩터링이 아니다.  
대상은 코어 런타임, 공개 API, 렌더 파이프라인, 에디터 연동, 테스트 체계다.

포함:

- `@magam/core` 공개 API 재설계
- frame 메타데이터 및 런타임 mount/scoping 모델 도입
- Canvas/MindMap 공통 중첩 frame 지원
- source tracing/edit routing 유지 또는 개선
- 테스트와 문서 마이그레이션

제외:

- 기존 사용자 파일의 일괄 마이그레이션 자동화
- AI prompt-builder 최적화 구현
- component tree 전용 UI

## 핵심 원칙

- 사용자는 일반 React 컴포넌트를 정의하고 그대로 사용한다
- 로컬 `id`/`from`/`anchor`만 선언하면 된다
- namespace 확장과 충돌 회피는 런타임이 담당한다
- 중첩 frame은 1급 기능으로 설계한다
- 기존 `EmbedScope`/`MindMapEmbed`는 즉시 제거하지 않고 내부 호환 계층으로 유지한다

## 구현 전략

### 1. 공개 API 계약을 먼저 확정한다

우선 구현 전에 `frame(...)`의 사용자 관점 계약을 고정해야 한다.

목표 형태:

```tsx
const ServiceFrame = frame(function ServiceFrame({ label }: { label: string }) {
  return (
    <>
      <Shape id="lb">Load Balancer</Shape>
      <Shape id="app" anchor="lb" position="bottom">
        {label} Service
      </Shape>
    </>
  );
});

<Canvas>
  <ServiceFrame id="auth" x={120} y={120} label="Auth" />
</Canvas>
```

```tsx
const RelationalFrame = frame(function RelationalFrame() {
  return (
    <>
      <Sticky id="database" />
      <Sticky id="definition" from="database" />
    </>
  );
});

<MindMap id="storage">
  <Node id="root">Storage</Node>
  <RelationalFrame id="relational" from="root" />
</MindMap>
```

정리해야 할 계약:

- `frame(...)`가 어떤 메타데이터를 컴포넌트에 부여하는가
- frame instance props에서 공통 mount props를 어디까지 허용할 것인가
- Canvas 배치 props와 MindMap 배치 props를 어떻게 공존시킬 것인가
- 중첩 frame의 부모-자식 namespace 결합 규칙을 어떻게 정의할 것인가

예상 수정 지점:

- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/index.ts`
- 신규 `frame` helper 파일
- 공개 타입 export 경계

### 2. 내부 런타임을 frame 개념으로 통합한다

현재는 Canvas scoping과 MindMap subtree mount가 분리되어 있다.

- Canvas: `EmbedScope` + `useNodeId` + `resolveTreeAnchors`
- MindMap: `MindMapEmbed` + `useMindMapScopedProps` + `resolveMindMapEmbeds`

다음 단계에서는 둘을 직접 노출하지 않고, 내부적으로 공통 frame mount 모델로 재정리해야 한다.

핵심 작업:

- frame instance의 로컬 scope 생성 규칙 정의
- 로컬 `id`/`anchor`/`from`/`to` 재작성 시점 통일
- 중첩 frame path 결합 규칙 정의
- source file, local scope, mount parent 정보를 공통 메타로 정리

가능한 방향:

- `EmbedScope`와 `MindMapEmbed`를 유지하되 `frame(...)`의 내부 lowering target으로 사용
- 또는 frame 전용 reconciler/context를 도입하고 기존 두 primitive를 thin wrapper로 역전환

우선순위는 후자보다 전자다.  
기존 동작을 보존하면서 새 API를 세우는 편이 리스크가 낮다.

예상 수정 지점:

- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/EmbedScope.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/MindMapEmbed.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/context/EmbedScopeContext.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/context/MindMapEmbedContext.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/hooks/useNodeId.ts`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/hooks/useMindMapScopedProps.ts`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/reconciler/resolveTreeAnchors.ts`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/reconciler/resolveMindMapEmbeds.ts`

### 3. Canvas와 MindMap의 mount 규칙을 공통화한다

`frame`은 MindMap 전용 helper가 아니라 큰 Canvas 안에 배치되는 서브 캔버스 개념이어야 한다.

따라서 런타임은 다음을 모두 지원해야 한다.

- Canvas 직하 배치
- MindMap 직하 배치
- frame 안의 하위 frame 배치
- frame 내부 요소와 외부 요소 간 참조 경계 처리

구체 작업:

- Canvas mount에서 `x/y`, `anchor`, `position`, `gap` 처리 규칙 정의
- MindMap mount에서 `from` 처리 규칙 정의
- nested frame에서 `auth.cache.worker` 같은 fully-qualified id 생성 규칙 검증
- cross-frame reference 허용 범위와 금지 범위 정의

이 단계가 끝나면 공개 API 문서의 예시가 실제로 성립해야 한다.

관련 파일:

- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Shape.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Sticky.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Node.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Edge.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/Group.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/components/MindMap.tsx`

### 4. source tracing과 편집 라우팅을 frame 친화적으로 유지한다

현재는 `sourceMeta.filePath`와 scope 정보 덕분에 외부 파일 컴포넌트 편집 라우팅이 가능하다.

새 API에서도 다음은 반드시 유지해야 한다.

- 노드가 어느 frame 정의 파일에서 왔는지 추적 가능해야 한다
- 중첩 frame 내부 노드도 원본 파일 편집 대상으로 매핑 가능해야 한다
- frame instance와 frame definition을 구분할 메타데이터가 있어야 한다

구체 작업:

- 렌더 결과에 frame definition/source metadata 추가
- nested frame instance path를 source meta에 반영
- editor 쪽 `resolveNodeEditTarget`가 새 메타를 이해하도록 확장

관련 파일:

- `/Users/danghamo/Documents/gituhb/notes/libs/cli/src/server/http.ts`
- `/Users/danghamo/Documents/gituhb/notes/app/components/editor/workspaceEditUtils.ts`
- `/Users/danghamo/Documents/gituhb/notes/app/components/editor/WorkspaceClient.tsx`

### 5. 호환 계층과 마이그레이션 경로를 제공한다

기존 공개 API를 한 번에 없애면 예제와 사용자 파일이 깨진다.  
따라서 새 API를 먼저 추가하고, 기존 primitive는 호환 계층으로 남겨야 한다.

권장 순서:

1. `frame(...)` 추가
2. 내부적으로 기존 primitive 재사용
3. 문서와 예제를 `frame` 중심으로 전환
4. `EmbedScope`/`MindMapEmbed`에 저수준 API 경고 문구 추가
5. 추후 major 변경에서 공개 경계 축소 검토

필요 작업:

- 공개 API boundary 테스트 갱신
- 예제 파일 추가 또는 교체
- deprecation 문서화

관련 파일:

- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/publicApiBoundary.spec.ts`
- `/Users/danghamo/Documents/gituhb/notes/examples/embed_scope.tsx`
- 관련 문서 폴더

### 6. 테스트를 frame 시나리오 중심으로 재편한다

새 API의 핵심 리스크는 중첩과 참조 재작성이다.  
테스트는 단순 render snapshot보다 다음 시나리오를 우선해야 한다.

- Canvas에서 동일 frame 2회 배치 시 id 충돌이 없는지
- MindMap에서 동일 frame 2회 배치 시 `from` 연결이 올바른지
- nested frame에서 `parent.child.node` 규칙이 일관적인지
- anchor와 edge가 로컬/중첩 scope에서 올바르게 해석되는지
- source tracing/edit routing이 외부 파일과 nested frame에서도 유지되는지

관련 파일:

- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/embedScope.spec.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/__tests__/renderer.spec.tsx`
- `/Users/danghamo/Documents/gituhb/notes/libs/core/src/reconciler/resolveTreeAnchors.spec.ts`
- `/Users/danghamo/Documents/gituhb/notes/app/features/render/parseRenderGraph.test.ts`
- `/Users/danghamo/Documents/gituhb/notes/app/components/editor/WorkspaceClient.test.tsx`

## 단계별 산출물

### Phase 1. API 설계 확정

산출물:

- `frame(...)` 공개 시그니처
- frame mount prop 규약
- nested frame namespace 규칙 문서

완료 기준:

- README 예시를 타입/런타임 관점에서 모두 설명할 수 있다

### Phase 2. 코어 런타임 도입

산출물:

- `frame` helper 구현
- 내부 lowering 또는 공통 reconciler 추가
- Canvas/MindMap mount 처리 연결

완료 기준:

- `frame` 정의 컴포넌트가 실제 Canvas/MindMap에서 동작한다

### Phase 3. 에디터/메타데이터 정리

산출물:

- frame-aware source meta
- nested frame 편집 라우팅 보장

완료 기준:

- 중첩 frame 내부 노드를 눌렀을 때 편집 대상 파일이 일관되게 계산된다

### Phase 4. 호환성, 테스트, 문서 정리

산출물:

- 회귀 테스트 추가
- 공개 예제 갱신
- 기존 저수준 API의 위치 재정의

완료 기준:

- 기존 주요 시나리오가 깨지지 않고, 새 `frame` 예제가 문서와 테스트에 모두 존재한다

## 리스크와 대응

- 공개 API와 내부 모델의 경계가 불명확하면 다시 저수준 props가 새어 나올 수 있다
- nested frame 지원을 늦게 붙이면 API를 다시 바꿔야 하므로 초기에 포함해야 한다
- source tracing 메타를 충분히 설계하지 않으면 editor 연동이 후반에 깨질 수 있다
- 기존 primitive 제거를 서두르면 호환성 리스크가 커지므로 단계적 축소가 필요하다

## 권장 구현 순서

1. `frame(...)` API 계약과 타입 정의
2. 내부 frame 메타/namespace 모델 도입
3. Canvas mount 처리 연결
4. MindMap mount 처리 연결
5. nested frame 지원
6. source tracing/edit routing 보강
7. 테스트와 문서 마이그레이션

## 종료 조건

다음 조건을 만족하면 1차 구현 완료로 본다.

- 사용자는 `frame(...)`로 일반 컴포넌트를 정의할 수 있다
- 동일 frame을 Canvas와 MindMap에서 모두 재사용할 수 있다
- frame 안에 하위 frame을 둘 수 있다
- `MindMapEmbed`/`EmbedScope` 없이도 문서 예시를 구현할 수 있다
- 내부적으로는 기존 primitive를 재사용하더라도 공개 API에서는 숨겨진다
