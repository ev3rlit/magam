# File-Based Component Analysis

## 문제

현재 코어는 파일 분할과 재사용 가능한 그래프 조각 구성을 이미 지원하지만, 공개 API는 아직 저수준이다.

- `EmbedScope`
- `MindMapEmbed`
- scoped props 기반 내부 메커니즘

이 방식은 기능적으로는 유효하지만, 사용자가 scope, prefix, mount semantics를 직접 의식해야 한다.  
즉 React 위에 구현되어 있어도, 사용자 경험은 여전히 graph runtime의 내부 제약을 강하게 드러낸다.

## 배경

현재 시스템은 이미 다음을 할 수 있다.

- 여러 `.tsx` 파일로 나눈 컴포넌트를 import해서 조합
- Canvas 레벨 재사용
- 하나의 MindMap 내부 조각 재사용
- source file 추적과 편집 대상 파일 라우팅

즉 문제는 "기능이 없어서"가 아니라, **그 기능이 공개 API에서 너무 직접적으로 노출되어 있다는 점**이다.

또한 이 작업의 목표는 특정 예제 파일 리팩터링이 아니다.  
예제 mindmap 파일들은 분석 근거일 뿐이고, 실제 목표는 다음 두 가지다.

1. 코어 내부 구현 정리
2. 고수준 사용자 API 개선

## 개선 결론

방향은 명확하다.

### 1. `MindMapEmbed`와 `EmbedScope`는 저수준 primitive로 숨긴다

이 둘은 계속 내부 구현으로는 활용할 수 있지만, 공개 중심 API로 유지하는 방향은 적절하지 않다.

사용자가 직접:

- scope를 만들고
- mount 지점을 지정하고
- 내부 연결 규칙을 의식하는

형태는 장기적으로 덜 React스럽다.

### 2. 공개 개념은 `subtree`보다 `frame`이 더 적합하다

이 기능은 MindMap 안에서만 쓰이는 것이 아니다.  
Canvas 위에 배치되는 재사용 조각까지 포함하면, 공개 개념은 `subtree`보다 `frame`이 더 적합하다.

`frame`은 다음 의미를 가진다.

- 로컬 id 공간을 가진다
- 내부 연결 규칙을 가진다
- 큰 Canvas 또는 MindMap 안에 마운트될 수 있다
- 다른 `frame` 안에도 중첩되어 마운트될 수 있다
- 재사용 가능한 로컬 그래프 공간이다

중요한 점은 `frame`이 `Group`과 다른 개념이라는 점이다.

- `Group`: 시각적/좌표적 묶음
- `Frame`: 재사용 가능한 로컬 그래프 공간

즉 `Group`은 배치 단위이고, `Frame`은 재사용 단위다.

### 3. 호출부 helper보다 정의부 helper가 더 적합하다

`<MindMapBranch ... />` 같은 호출부 래퍼보다, 일반 컴포넌트를 그대로 사용하면서 정의 시점에 frame으로 승격하는 방식이 더 자연스럽다.

즉 목표는 이런 형태다.

- 호출부는 일반 React component usage 유지
- frame/scoping 규칙은 컴포넌트 정의 쪽에 캡슐화
- 내부 구현에서는 필요 시 `MindMapEmbed`/`EmbedScope` 재사용

예시:

```tsx
const RelationalFrame = frame(function RelationalFrame({ title }: { title: string }) {
  return (
    <>
      <Sticky id="database">
        <Markdown>{`## ${title}`}</Markdown>
      </Sticky>
      <Sticky id="definition" from="database">
        <Markdown>{`### 정의`}</Markdown>
      </Sticky>
      <Sticky id="strengths" from="database">
        <Markdown>{`### 장점`}</Markdown>
      </Sticky>
    </>
  );
});

export default function DataStorageMindMap() {
  return (
    <MindMap id="data-storage-map">
      <Node id="root">Data Storage</Node>
      <RelationalFrame id="relational" from="root" title="관계형 데이터베이스" />
      <RelationalFrame id="analytics" from="root" title="분석 저장소" />
    </MindMap>
  );
}
```

이 예시에서 frame 컴포넌트는 끝까지 로컬 id만 사용한다.

- 내부: `database`, `definition`, `strengths`
- 마운트 시 런타임: `relational.database`, `analytics.database`처럼 자동 확장

즉 frame 컴포넌트는 부모 인스턴스 id나 namespace 규칙을 알 필요가 없다.  
이렇게 해야 나중에 해당 조각을 독립 mindmap 파일이나 canvas composition 단위로 승격해도 내부 코드를 바꿀 필요가 없다.

Canvas에서도 같은 원칙이 적용되어야 한다.

```tsx
const ServiceFrame = frame(function ServiceFrame({ label }: { label: string }) {
  return (
    <>
      <Shape id="lb">Load Balancer</Shape>
      <Shape id="app" anchor="lb" position="bottom">
        {label} Server
      </Shape>
      <Shape id="db" anchor="app" position="bottom">
        Database
      </Shape>
      <Edge from="lb" to="app" label="route" />
      <Edge from="app" to="db" label="query" />
    </>
  );
});

export default function ArchitectureCanvas() {
  return (
    <Canvas>
      <ServiceFrame id="auth" x={120} y={120} label="Auth" />
      <ServiceFrame id="billing" anchor="auth.app" position="right" gap={240} label="Billing" />
    </Canvas>
  );
}
```

즉 `frame`은 MindMap 전용 helper가 아니라, 큰 Canvas 안에 배치되는 서브 캔버스 개념으로 보는 편이 더 적절하다.

### 4. 고수준 API의 목표

최종적으로 사용자는 다음만 신경 쓰는 구조가 되어야 한다.

- 일반 컴포넌트를 정의한다
- 일반 컴포넌트를 그대로 사용한다
- frame mount/scoping/id 충돌 회피는 런타임이 내부에서 해결한다

즉 공개 API의 목표는:

- React component usage 유지
- 내부 그래프 제약 숨기기
- 대형 mindmap과 canvas composition 모두에서 파일 분할과 재사용을 자연스럽게 만들기

예를 들면 사용자는 일반 컴포넌트를 정의하고 그대로 배치하기만 하면 된다.

```tsx
const CacheFrame = frame(function CacheFrame() {
  return (
    <>
      <Shape id="redis">Redis</Shape>
      <Shape id="worker" anchor="redis" position="bottom">
        Worker
      </Shape>
    </>
  );
});

const ServiceFrame = frame(function ServiceFrame({ label }: { label: string }) {
  return (
    <>
      <Shape id="app">{label} Service</Shape>
      <CacheFrame id="cache" anchor="app" position="right" gap={140} />
    </>
  );
});

export default function ArchitectureCanvas() {
  return (
    <Canvas>
      <ServiceFrame id="auth" x={120} y={120} label="Auth" />
      <ServiceFrame id="billing" anchor="auth.cache.worker" position="right" gap={220} label="Billing" />
    </Canvas>
  );
}
```

이 구조라면 `frame` 안에 하위 `frame`도 둘 수 있고, 런타임은 중첩된 로컬 id 공간을 내부적으로 확장해 충돌 없이 배치할 수 있다.

## 정리

현재 구현의 핵심 문제는 기능 부족이 아니다.  
문제는 **공개 API가 너무 저수준이라는 점**이다.

따라서 구현 계획의 출발점은 다음이어야 한다.

1. `MindMapEmbed`와 `EmbedScope`를 내부 primitive로 재정의
2. 호출부 wrapper가 아닌 `frame(...)` 같은 정의부 helper 중심의 고수준 API 설계
3. Canvas와 MindMap 모두에서 중첩 가능한 `frame` 조합을 지원
4. 사용자에게는 일반 컴포넌트 사용 경험만 노출

이 문서를 기준으로 다음 단계의 실제 구현 계획을 세운다.
