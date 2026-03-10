# File-Based Component Analysis

## 대상 질문

현재 저장소에 "파일 기반 컴포넌트" 기능이 실제로 어느 정도 구현되어 있는지, 그리고 이 기능이 대형 mindmap의 AI 토큰 사용량 절감에 실제로 도움이 되는지를 분석한다.

## 결론

현재 구현은 생각보다 많이 진행되어 있다. 다만 "하나의 기능"이 아니라 두 레이어로 나뉜다.

1. **Canvas/일반 컴포넌트 재사용**: `EmbedScope`
2. **하나의 MindMap 내부 subtree 재사용**: `MindMapEmbed`

즉 지금 저장소는 이미 **여러 `.tsx` 파일로 나눈 컴포넌트를 import해서 조합하는 구조**를 지원한다.  
문서상 아이디어에만 머물러 있는 것이 아니라, core 컴포넌트, renderer 후처리, parse/render 테스트, editor의 파일 라우팅까지 연결돼 있다.

다만 아직 미완성인 부분도 있다.

- AI/MCP 레벨의 `project.listComponents`, `code.readComponent` 같은 "컴포넌트 인식형 도구"는 실제 구현보다 문서 계획에 가깝다
- prompt-builder는 아직 subtree/component 단위가 아니라 file preview 중심이다
- component tree를 시각적으로 보여주는 전용 UI는 없다

추가로 API 관점에서는 현재 방식이 다소 저수준이다.

- `EmbedScope`
- `MindMapEmbed`
- `useMindMapScopedProps`

이 조합은 기능적으로는 유효하지만, 작성자가 scope, prefix, mount semantics를 의식해야 해서 React스럽다고 보긴 어렵다.

이 문서의 최종 결론은 특정 `data-storage-mindmap.tsx` 리팩터링 가이드가 아니다.  
그 파일은 분석용 예시일 뿐이며, 실제 목표는 다음 두 가지다.

1. **코어 내부 구현 정리**
   - `MindMapEmbed`, `EmbedScope`, scoped props 메커니즘을 내부 primitive로 내린다
2. **고수준 사용자 API 개선**
   - 호출부 wrapper보다 정의부 helper/hook 중심으로 더 React스러운 조합 모델을 제공한다

즉 방향은 명확하다.

- `MindMapEmbed`와 `EmbedScope`는 **저수준 구현 세부사항으로 숨긴다**
- 공개 API는 **일반 컴포넌트 사용 형태를 유지**한다
- 호출부 helper보다 **정의부 helper가 더 적합하다**
- 필요하면 hook(`useMindMapSubtree`, `useScopedComponent`)으로 내부 로직을 캡슐화한다

## 현재 구현 상태

## 1. 파일 분할 자체는 이미 가능하다

이 저장소는 특별한 매직 import 시스템이 아니라, **일반 React export/import + esbuild 번들링**으로 여러 파일을 하나의 그래프로 합친다.

근거:

- `libs/cli/src/core/transpiler.ts`
  - `esbuild`로 entry file을 번들링한다
  - `metafile.inputs`를 수집해 어떤 소스 파일이 포함됐는지 추적한다
- `libs/cli/src/server/http.ts`
  - 번들된 결과를 실행하고
  - JSX `__source`와 입력 파일 목록을 이용해 각 렌더 노드에 `sourceMeta.filePath`를 주입한다

즉, 파일 기반 컴포넌트는 별도 DSL이 아니라 **"React 컴포넌트를 여러 파일로 쪼개는 표준 방식"**으로 이미 동작한다.

## 2. Canvas 레벨 조합은 `EmbedScope`로 구현돼 있다

핵심 파일:

- `libs/core/src/components/EmbedScope.tsx`
- `libs/core/src/context/EmbedScopeContext.tsx`
- `libs/core/src/hooks/useNodeId.ts`
- `libs/core/src/reconciler/resolveTreeAnchors.ts`
- `libs/core/src/__tests__/embedScope.spec.tsx`

동작:

- `EmbedScope`는 scope 문자열을 Context로 전달한다
- `useNodeId()`가 `id`를 `scope.id` 형태로 prefix한다
- `Edge`, `Shape`, `Sticky`, `Text`, `Group`, `MindMap` 등이 이 스코프를 사용한다
- 후처리 단계에서 `anchor`도 같은 scope 안에 실제 target이 있으면 자동으로 scoped id로 치환된다

즉 다음 패턴이 실제 구현 상태다.

```tsx
<EmbedScope id="auth">
  <ServiceCluster />
</EmbedScope>
<EmbedScope id="billing">
  <ServiceCluster />
</EmbedScope>
```

이 경우 동일 컴포넌트를 여러 번 재사용해도 ID 충돌이 나지 않는다.

## 3. MindMap 내부 subtree 재사용은 `MindMapEmbed`로 구현돼 있다

핵심 파일:

- `libs/core/src/components/MindMapEmbed.tsx`
- `libs/core/src/context/MindMapEmbedContext.tsx`
- `libs/core/src/hooks/useMindMapScopedProps.ts`
- `libs/core/src/reconciler/resolveMindMapEmbeds.ts`
- `libs/core/src/__tests__/renderer.spec.tsx`
- `app/features/render/parseRenderGraph.test.ts`

이건 `EmbedScope`와 다른 역할이다.

- `EmbedScope`: Canvas 전반의 일반 컴포넌트 재사용
- `MindMapEmbed`: **한 MindMap 안에 재사용 subtree를 삽입**

렌더러 테스트 기준으로 아래 패턴이 이미 동작한다.

```tsx
<MindMap id="system">
  <Node id="platform">Platform</Node>
  <MindMapEmbed id="auth" from="platform">
    <ServiceBranch label="Auth" />
  </MindMapEmbed>
  <MindMapEmbed id="billing" from="platform">
    <ServiceBranch label="Billing" />
  </MindMapEmbed>
</MindMap>
```

결과적으로 내부 노드는 다음처럼 된다.

- `auth.root`
- `auth.details`
- `billing.root`
- `billing.details`

그리고 `from`도 mount 지점 기준으로 올바르게 해석된다.

이건 "큰 mindmap 하나를 브랜치별 컴포넌트로 나누는 기능"에 직접 대응한다.

## 4. 실제 저장소에도 파일 분할 사용 예제가 있다

문서 예시만 있는 게 아니라, 실제 notes 파일에서도 import + composition을 사용하고 있다.

근거:

- `notes/system-arhictecture.tsx`
  - `import { ApiSpecMindMap } from './systemarchitecture/api-spec';`
  - 하단에서 `<EmbedScope id="api-spec"><ApiSpecMindMap ... /></EmbedScope>`로 조합
- `notes/systemarchitecture/api-spec.tsx`
  - 독립 TSX 파일로 별도 mindmap/장식 subtree를 정의

즉 "외부 파일로 분리된 diagram component를 상위 파일에서 조합"하는 패턴은 실제 운영 예제로 이미 존재한다.

## 5. 편집 라우팅도 어느 정도 파일 단위로 연결돼 있다

이 부분이 중요하다. 렌더만 되고 편집은 못 돌아가면 실전성은 낮다.

현재는 imported subtree의 노드가 어느 파일에서 왔는지 추적해서, 편집 시 그 원본 파일로 되돌릴 기반이 있다.

근거:

- `libs/cli/src/server/http.ts`
  - `injectSourceMeta()`가 각 renderable node에 `sourceMeta.sourceId`, `sourceMeta.filePath`, `kind`, `scopeId`를 넣는다
- `app/components/editor/workspaceEditUtils.ts`
  - `resolveNodeEditTarget()`가 `sourceMeta.filePath`가 있으면 현재 파일이 아니라 그 외부 파일을 편집 대상으로 잡는다
- `app/components/editor/WorkspaceClient.test.tsx`
  - 외부 파일 `sourceMeta`가 있으면 `components/auth-branch.tsx`로 편집 대상이 라우팅되는 테스트가 있다

즉 imported component를 그린 뒤, 그 노드를 수정할 때 **원본 파일을 향해 edit target을 결정하는 흐름**이 이미 존재한다.

## API 관점 평가: 왜 덜 React스러운가

현재 구현은 React를 사용하지만, 사용자 경험은 여전히 graph runtime의 내부 제약을 드러낸다.

핵심 이유는 세 가지다.

### 1. 스코프와 연결 규칙을 사용자가 직접 알아야 한다

`EmbedScope`와 `MindMapEmbed`는 결국 다음 문제를 해결하기 위한 장치다.

- ID 충돌 방지
- mount 지점 연결
- subtree 내부 참조 해석

그런데 이 정보가 renderer 내부가 아니라 JSX 작성자에게 노출되어 있다.

예:

```tsx
<EmbedScope id="auth">
  <ServiceCluster />
</EmbedScope>
```

```tsx
<MindMapEmbed id="billing" from="platform">
  <BillingBranch />
</MindMapEmbed>
```

이건 기술적으로는 명확하지만, React스럽게 보면 부모가 "그냥 자식을 조합"하는 수준을 넘어, 그래프의 네임스페이스와 연결 모델까지 직접 운영해야 하는 상태다.

### 2. 조합보다 AST 규칙이 먼저 보인다

`libs/core/src/hooks/useMindMapScopedProps.ts`를 보면 실제 핵심은 다음 내부 메타데이터다.

- `__mindmapEmbedScope`
- `__mindmapEmbedMountFrom`
- `__mindmapEmbedSourceFile`

즉 현재 API는 React composition을 표방하지만, 실제로는 "graph AST를 안전하게 만들기 위한 내부 규칙"이 바깥 JSX 레벨까지 새어나온 형태에 가깝다.

### 3. 부모보다 자식이 더 많은 구조 지식을 가진다

더 React스러운 구조라면:

- 부모가 브랜치를 배치한다
- 자식은 자기 내용만 선언한다

현재는 자식 subtree가 사실상 scope와 mount 규칙을 같이 가져간다.  
이건 재사용에는 유리하지만, 선언 모델은 상대적으로 덜 자연스럽다.

## 개선 방향: 내부 구현으로 밀어 넣기

방향은 `EmbedScope`와 `MindMapEmbed`를 당장 제거하자는 것이 아니다.  
핵심은 **이 기능들을 사용자 주 API가 아니라 내부 메커니즘으로 낮추는 것**이다.

## 1. 권장 사용자 API를 branch component 또는 branch data 중심으로 바꾸기

현재:

```tsx
<MindMap id="data-storage-map">
  <Node id="root">Data Storage</Node>
  <MindMapEmbed id="relational" from="root">
    <RelationalBranch />
  </MindMapEmbed>
</MindMap>
```

이건 과도기 API로는 괜찮지만, 호출부에 `MindMapEmbed`나 `MindMapBranch`가 드러나는 건 여전히 저수준이다.

문서 초안에서는 다음처럼 상위 API를 예시로 들었다.

```tsx
<DataStorageMindMap>
  <MindMapBranch mount="root" branch={relationalBranch} />
  <MindMapBranch mount="root" branch={performanceBranch} />
</DataStorageMindMap>
```

하지만 이 역시 호출부에 "branch mount primitive"가 남아 있어서, 최종적으로 가장 좋은 형태는 아니다.

더 나은 방향은 **컴포넌트를 그대로 사용하되, 정의 시점에 subtree helper로 승격하거나 내부에서 hook을 쓰는 방식**이다.

예:

```tsx
const RelationalBranch = defineMindMapSubtree(function RelationalBranch() {
  return (
    <>
      <Sticky id="relational-database">
        <Markdown>{`## 관계형 데이터베이스`}</Markdown>
      </Sticky>
    </>
  );
});
```

사용:

```tsx
<MindMap id="data-storage-map">
  <Node id="root">Data Storage</Node>
  <RelationalBranch id="relational" from="root" />
  <PerformanceBranch id="performance" from="root" />
</MindMap>
```

이 경우 scope/prefix/mount 연결은 내부에서 처리하고, 사용자는 그냥 "이 컴포넌트를 이 부모 아래 붙인다"는 선언만 하게 된다.

즉 정리하면:

- `MindMapBranch`를 **직접 쓰는 것**보다
- 일반 컴포넌트 + `defineMindMapSubtree()` helper 조합이 더 React스럽다
- 또는 일반 컴포넌트 내부에서 `useMindMapSubtree()` 같은 hook으로 subtree 문맥을 받는 방식이 더 자연스럽다

## 1-1. 호출부 helper보다 정의부 helper가 더 적합하다

좋은 이유:

- 호출부가 일반 React component usage와 거의 같아진다
- subtree 규칙은 컴포넌트 정의 쪽에 캡슐화된다
- 내부 구현에서는 여전히 `MindMapEmbed`를 재사용할 수 있다
- 이후 API migration도 쉽다

권장 형태:

```tsx
const ServiceBranch = defineMindMapSubtree(function ServiceBranch({ label }: { label: string }) {
  return (
    <>
      <Node id="service">{label}</Node>
      <Node id="database" from="service">Database</Node>
    </>
  );
});

<MindMap id="system">
  <Node id="root">System</Node>
  <ServiceBranch id="auth" from="root" label="Auth" />
</MindMap>
```

이 패턴이면 사용자 입장에서는 `ServiceBranch`가 그냥 "MindMap 안에서 쓸 수 있는 컴포넌트"처럼 보인다.

## 1-2. hook 형태는 더 React스럽지만, 반환 형태는 조심해야 한다

`useXXX` 네이밍은 확실히 더 React스럽다.  
다만 여기서 중요한 구분이 있다.

### 좋은 방향

hook이 **구조를 직접 렌더링하는 것**이 아니라, 컴포넌트가 subtree로 동작하기 위한 문맥과 helper를 제공한다.

예:

```tsx
function ServiceBranch({ id, from, label }: {
  id: string;
  from: string;
  label: string;
}) {
  const subtree = useMindMapSubtree({ id, from });

  return (
    <>
      <Node id={subtree.id('service')}>{label}</Node>
      <Node id={subtree.id('database')} from={subtree.from('service')}>
        Database
      </Node>
    </>
  );
}
```

또는:

```tsx
function ServiceBranch(props: { id: string; from: string; label: string }) {
  const { Node, Edge, ref } = useMindMapSubtree(props);

  return (
    <>
      <Node id="service">{props.label}</Node>
      <Node id="database" from="service">Database</Node>
      <Edge from="service" to="database" />
    </>
  );
}
```

이 방식은 사용자가 호출부에서 특별한 wrapper를 알 필요가 없고, 컴포넌트 내부 로직만 hook으로 캡슐화할 수 있다.

### 덜 좋은 방향

hook이 JSX subtree 자체를 반환하는 패턴이다.

예:

```tsx
const branch = useServiceCluster(...);
return <MindMap>{branch}</MindMap>;
```

이 방식은 기술적으로 가능하더라도 React 관점에서는 어색하다.

- hook은 보통 state/logic composition에 쓰인다
- JSX tree factory 역할까지 맡기면 컴포넌트와 hook 경계가 흐려진다
- 조건부 호출, 반복 호출 시 규칙을 어기기 쉬워진다

따라서 `useXXX`는 좋은 방향이지만, **hook은 문맥과 helper를 주고 렌더는 컴포넌트가 맡는 형태**가 더 적합하다.

## 2. branch file은 JSX subtree보다 data module이 더 적합하다

대형 mindmap에서는 브랜치 파일이 컴포넌트일 수도 있지만, 더 React스럽고 토큰 친화적인 쪽은 data module이다.

예:

```ts
export const relationalBranch = {
  id: 'relational',
  mount: 'root',
  nodes: [
    { id: 'relational-database', body: '## 관계형 데이터베이스' },
  ],
};
```

그 뒤 렌더러가 이를 `Sticky`, `Node`, `Shape` 등으로 그린다.

이 방식의 장점:

- React 컴포넌트는 렌더에 집중
- branch 내용은 순수 데이터로 관리
- AI는 JSX보다 짧은 데이터 구조를 다룸
- 내부 scope 처리도 렌더러에서 흡수 가능

즉 중장기 방향은 세 갈래가 공존할 수 있다.

- 짧고 재사용 가능한 브랜치: `defineMindMapSubtree(Component)`
- 짧고 재사용 가능한 브랜치: `useMindMapSubtree()`를 내부에서 사용하는 일반 컴포넌트
- 큰 지식형 브랜치: data module + 공통 렌더러

## 2-1. `ServiceCluster` 예시는 subtree보다 compound component에 가깝다

사용자가 제안한 다음 패턴은 방향 자체는 좋다.

```tsx
function ServiceCluster({ label, anchorId, anchorPosition }: {
  label: string;
  anchorId: string;
  anchorPosition: 'left' | 'right' | 'bottom' | 'bottom-left' | 'bottom-right';
}) {
  return (
    <>
      <Shape id="lb" anchor={anchorId} position={anchorPosition} gap={80} width={120} height={50}>
        Load Balancer
      </Shape>
      <Shape id="app" anchor="lb" position="bottom" gap={60} width={120} height={50}>
        {label} Server
        <Edge to="db" label="query" />
      </Shape>
      <Shape id="db" anchor="app" position="bottom" gap={60} width={120} height={50}>
        Database
      </Shape>
      <Edge from="lb" to="app" label="route" />
    </>
  );
}
```

다만 이 예시는 엄밀히 말하면 **MindMap subtree**라기보다 **재사용 가능한 compound canvas component**에 더 가깝다.

이유:

- 내부가 `from` 기반 topology보다 `anchor` 기반 freeform layout에 의존한다
- `lb -> app -> db`가 MindMap auto-layout 노드 체인이라기보다 수동 배치 cluster에 가깝다

즉 다음 두 경우를 분리해야 한다.

1. **MindMap subtree**
   - 부모-자식 관계가 핵심
   - `from` 또는 subtree mount 규칙이 핵심
   - `defineMindMapSubtree()`가 적합

2. **Canvas compound component**
   - 내부 로컬 배치와 장식이 핵심
   - `anchor`, `Edge`, `Group`이 중심
   - `defineCanvasComponent()` 또는 `defineScopedComponent()` 같은 helper가 더 적합

그래서 `ServiceCluster` 같은 컴포넌트를 그대로 쓰고 싶다면, 오히려 아래처럼 해석하는 편이 자연스럽다.

```tsx
function ServiceCluster(props: {
  label: string;
  anchorId: string;
  anchorPosition: 'left' | 'right' | 'bottom' | 'bottom-left' | 'bottom-right';
}) {
  const scope = useScopedComponent();

  return (
    <>
      {/* 내부 로컬 ids/scoping은 hook/helper가 처리 */}
    </>
  );
}
```

반면 MindMap 내부 브랜치라면 이쪽이 더 적합하다.

```tsx
function ServiceBranch({ id, from, label }: { id: string; from: string; label: string }) {
  const subtree = useMindMapSubtree({ id, from });

  return (
    <>
      <Node id={subtree.id('lb')}>{label} LB</Node>
      <Node id={subtree.id('app')} from={subtree.from('lb')}>{label} App</Node>
      <Node id={subtree.id('db')} from={subtree.from('app')}>Database</Node>
    </>
  );
}
```

즉 사용자가 말한 방향은 맞다. 다만 **"useXXX hook을 내부 로직 helper로 쓰고, JSX는 컴포넌트가 직접 반환"하는 방식**이 가장 React스럽다.

정리하면:

- subtree 쪽: `useMindMapSubtree()`
- canvas compound 쪽: `useScopedComponent()`
- 필요하면 정의부 helper는 선택적으로 유지

이렇게 나누는 쪽이 설계가 더 깨끗하다.

## 3. `EmbedScope`는 power-user escape hatch로만 남기기

`EmbedScope` 자체는 유용하다.  
다만 이상적인 위치는 "일반 사용자가 매번 쓰는 기본 API"가 아니라, 복잡한 재사용/충돌 회피가 필요할 때만 쓰는 저수준 escape hatch다.

즉 문서와 예제의 기본 패턴은:

- branch component
- branch data
- high-level composition

이어야 하고, `EmbedScope`는 "정말 필요할 때 직접 쓰는 고급 기능"으로 내려가는 편이 좋다.

## 4. `MindMapEmbed`는 공개 API보다 구현 primitive에 가깝다

현재 `MindMapEmbed`는 실용적이지만, 개념적으로는 renderer primitive에 더 가깝다.

좋은 방향은:

- 내부에서는 계속 유지
- 상위에서 `MindMapBranch`, `attachBranch`, `composeBranches` 같은 API를 제공
- `MindMapEmbed`는 그 하위 구현체 역할 수행

즉 "없애기"보다 "감추기"가 맞다.

같은 논리로 `EmbedScope`도 가능한 한 문서 전면에서 숨기고:

- `defineScopedComponent`
- `defineMindMapSubtree`
- branch data renderer

같은 상위 API 뒤로 내리는 편이 좋다.

## 5. sourceMeta 기반 편집 라우팅은 그대로 활용하기

좋은 점은 현재 sourceMeta 라우팅이 이미 구현되어 있다는 것이다.  
따라서 상위 API를 더 React스럽게 바꾸더라도, 아래 기능은 그대로 재사용할 수 있다.

- imported branch node -> 원본 파일 추적
- node edit -> branch file로 라우팅
- source version -> 파일별 충돌 관리

즉 사용자 API는 바꾸고, 런타임/에디터 인프라는 최대한 재사용하는 방향이 가능하다.

## 토큰 최적화 관점에서의 의미

## 1. 이 기능은 실제로 토큰 절감에 도움이 된다

특히 `notes/data-storage-mindmap.tsx` 같은 대형 파일에는 효과가 크다.

이유:

- 큰 파일을 브랜치별로 나눌 수 있다
- AI가 현재 수정 대상 파일만 읽을 가능성이 높아진다
- imported subtree 단위로 재시도할 수 있다
- sourceMeta.filePath가 있으므로 편집 타겟을 외부 파일로 유지하기 쉽다

즉 "브랜치별 파일 분할 = 단순 코드 정리"가 아니라, 실제로 **AI 컨텍스트를 줄이는 구조적 장치**가 된다.

## 2. 지금 바로 적용 가능한 분할 방식은 두 가지다

### 방식 A: 여러 MindMap을 Canvas에서 조합

이건 `EmbedScope`에 더 가깝다.

```tsx
<Canvas>
  <EmbedScope id="relational">
    <RelationalMap />
  </EmbedScope>
  <EmbedScope id="nosql">
    <NonRelationalMap />
  </EmbedScope>
</Canvas>
```

장점:

- 구현이 단순하다
- 파일 분리가 쉽다
- 서로 독립적인 큰 주제를 나누기 좋다

단점:

- 사용자가 하나의 큰 mindmap처럼 느끼기보다 여러 map으로 보일 수 있다

### 방식 B: 하나의 MindMap 내부에서 브랜치를 파일로 분리

이건 `MindMapEmbed`에 더 가깝다.

```tsx
<MindMap id="data-storage-map">
  <Node id="root">Data Storage</Node>
  <MindMapEmbed id="relational" from="root">
    <RelationalBranch />
  </MindMapEmbed>
  <MindMapEmbed id="performance" from="root">
    <PerformanceBranch />
  </MindMapEmbed>
</MindMap>
```

장점:

- 시각적으로는 하나의 큰 mindmap 유지
- 코드상으로는 브랜치별 분할 가능
- 현재 `data-storage-mindmap.tsx`에 더 적합하다

단점:

- 이 패턴을 실제 예제나 문서보다 더 체계적으로 정착시킬 필요가 있다

## 3. 현재 구현에서의 현실적 해석

현 시점 구현만 놓고 보면:

- Canvas 조합에는 `EmbedScope`
- MindMap 내부 subtree 조합에는 `MindMapEmbed`

가 각각 실용적인 primitive다.

하지만 이 primitive를 곧바로 사용자 API로 유지하는 것은 목표가 아니다.  
이 둘은 "현재 시스템이 subtree 재사용을 구현하는 방식"이지, "최종적으로 노출해야 할 고수준 API"는 아니다.

따라서 해석은 다음이 맞다.

- **단기**: 내부적으로는 계속 사용 가능
- **중기**: 정의부 helper와 hook 뒤로 숨김
- **장기**: 사용자는 일반 컴포넌트를 선언적으로 조합하고, subtree mount/scoping은 런타임이 흡수

## 한계와 미완성 영역

## 1. 컴포넌트 인식형 MCP/AI 도구는 아직 문서가 앞서 있다

`docs/features/component-embedding/README.md`에는 아래가 언급된다.

- `project.listComponents()`
- `code.readComponent()`

하지만 현재 코드베이스에서 이 인터페이스가 실제로 구현된 흔적은 확인되지 않았다.  
즉 **렌더링과 파일 라우팅은 구현됐지만, AI가 컴포넌트를 1급 개체로 직접 탐색하는 도구는 아직 부족하다.**

## 2. prompt-builder는 아직 file/subtree aware 하지 않다

현재 `libs/cli/src/chat/prompt-builder.ts`는:

- current file preview
- file mentions
- node mentions summary

중심이다.

즉 imported component가 있어도 아직은:

- component source snippet만 자동 추출하거나
- subtree만 canonical summary로 보내거나
- branch file만 선택적으로 우선 포함하는

로직이 없다.

그래서 파일 분할의 이점을 **렌더링/편집 경로는 받지만, 프롬프트 생성기는 아직 덜 활용**하고 있다.

## 3. `EmbedFrame` 등 편의 계층은 아직 없다

문서에는 `EmbedFrame` 같은 편의 컴포넌트가 계획되어 있지만, 구현 파일은 없다.  
즉 현재는 저수준 조합은 가능하지만, 사용성이 아주 높은 상위 abstraction은 아직 미구현이다.

## 4. 컴포넌트 트리 가시화가 없다

현재는:

- 어떤 노드가 어떤 source file에서 왔는지 sourceMeta는 있음
- 그러나 UI에서 component tree를 직접 탐색하는 전용 구조는 없음

즉 기능은 있지만 "AI와 인간이 활용하기 쉬운 인터페이스"는 아직 약하다.

## 판단

현재 저장소의 파일 기반 컴포넌트 기능은 **이미 실전 사용 가능한 수준**이다.  
특히 다음은 구현 완료로 봐도 된다.

- 외부 파일 import 기반 조합
- `EmbedScope` 기반 일반 재사용 컴포넌트 스코핑
- `MindMapEmbed` 기반 하나의 mindmap 내부 subtree 재사용
- imported node의 원본 filePath 추적
- 편집 시 원본 파일로 라우팅할 기반

반면 다음은 아직 "다음 단계"다.

- component-aware prompt building
- component list/read 전용 MCP tooling
- component tree UI
- 상위 편의 abstraction

## 추천

이 분석을 바탕으로 한 권장 방향은 특정 예제 파일 수정이 아니라, 코어와 고수준 API 개선 작업이다.

1. `MindMapEmbed`와 `EmbedScope`를 공개 중심 API가 아니라 내부 primitive로 재정의한다
2. 호출부 wrapper보다 정의부 helper 패턴을 기본 방향으로 채택한다
3. MindMap subtree용 `useMindMapSubtree()`와 canvas compound용 `useScopedComponent()`를 구분 설계한다
4. 정의부 helper는 필요 시 제공하되, 핵심 로직은 hook과 runtime에 캡슐화한다
5. branch data/module 기반 경로도 병행 지원해 대형 지식형 mindmap에 대응한다
6. sourceMeta 기반 파일 라우팅과 버전 관리 인프라는 그대로 재사용한다
7. prompt-builder와 AI tooling을 file 중심에서 component/subtree 중심으로 전환한다

즉, 지금 단계에서의 핵심 판단은 이것이다.

- subtree/component 재사용 기능은 이미 구현되어 있다
- 문제는 기능 부재가 아니라 **공개 API가 너무 저수준이라는 점**이다
- 최종 목표는 **`MindMapEmbed`와 `EmbedScope`를 숨기고 더 React스러운 고수준 사용자 API를 만드는 것**이다
