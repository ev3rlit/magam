# Data Storage MindMap Token Optimization Report

## 대상

- 분석 파일: `notes/data-storage-mindmap.tsx`
- 실제 경로: `/Users/danghamo/Documents/gituhb/notes/notes/data-storage-mindmap.tsx`

## 파일 현황

실제 파일은 "MindMap 렌더링 소스"이면서 동시에 "긴 교육용 문서" 역할도 같이 하고 있다.

- 총 `2353` lines
- 파일 크기 약 `82KB`
- `<MindMap>` `1`개
- `<Sticky>` `222`개
- `<Markdown>` `222`개
- `<Sticker>` `16`개
- `<Node>`, `<Shape>`, `<Sequence>`, `<WashiTape>` 사용 없음
- `from="root"` 기준 최상위 브랜치 `5`개
  - `relational-database`
  - `non-relational-database`
  - `database-performance-improvement`
  - `brewer-cap-theorem`
  - `unstructured-data-storage`
- 명시적 `x/y` 수동 배치 override는 소수만 존재
- `bubble` 사용도 사실상 `1`회뿐

핵심은 이 파일이 "레이아웃 복잡도"보다 "콘텐츠 볼륨" 때문에 토큰을 많이 먹는 구조라는 점이다.

## 결론

구조적 개선 여지는 크다. 다만 이 파일에서 토큰을 많이 쓰는 주원인은 Magam MindMap 자체가 아니라, **모든 지식을 TSX 안의 개별 `Sticky + Markdown` 노드로 직접 펼쳐 쓴 방식**이다.

가장 큰 절감 포인트는 세 가지다.

1. 전체 TSX를 직접 생성/수정하는 흐름을 줄이고 subtree 단위 편집으로 바꾸기
2. 반복되는 `Sticky + Markdown` 패턴을 데이터 스펙 또는 헬퍼 호출로 압축하기
3. 긴 Markdown 본문과 코드 예시를 TSX 본체에서 분리하기

## 현재 파일에서 토큰을 키우는 구조

### 1. 모든 노드가 같은 패턴을 반복한다

이 파일은 거의 전부가 아래 패턴이다.

```tsx
<Sticky id="..." from="...">
  <Markdown>{`...긴 본문...`}</Markdown>
</Sticky>
```

이 패턴이 `222`번 반복된다.  
즉 AI가 이 파일을 수정할 때는 "구조"보다 "비슷한 JSX 껍데기"를 계속 다시 읽고 다시 출력하게 된다.

이건 사람이 보기에도 장황하고, 모델 입장에서는 더 비싸다.

### 2. 긴 본문이 JSX 안에 직접 들어 있다

이 파일은 설명 텍스트뿐 아니라 SQL/TypeScript 예시도 직접 넣고 있다.

- `### TypeScript 쿼리 예시` 섹션 `7`개
- `### SQL / Drizzle 예시` 섹션 `6`개

이런 노드는 구조 수정과 내용 수정이 섞여 있어서, 작은 변경에도 큰 문자열 블록을 같이 다뤄야 한다.

### 3. polymorphic children의 이점을 거의 쓰지 않고 있다

현재 파일은 MindMap 안에서 사실상 `Sticky`만 사용한다.  
Magam이 지원하는 polymorphic children의 장점은 "한 개 컴포넌트로 더 많은 의미를 압축"하는 데 있는데, 지금은 그 이점을 거의 사용하지 못하고 있다.

예:

- 흐름 설명은 `Sequence` 한 개로 대체 가능한데 여러 설명 stickies로 풀어씀
- 강조/분류 정보는 `WashiTape`나 `Sticker` 레이어로 뺄 수 있는데 본문 텍스트에 섞임
- 단순 heading 노드도 전부 Markdown wrapper를 거침

### 4. 구조 모듈이 아니라 대형 단일 문서다

루트 브랜치는 5개뿐인데, 모두 한 파일에 붙어 있다.

이 구조의 문제:

- AI가 특정 브랜치만 고쳐도 파일 전체를 함께 읽기 쉽다
- 재시도 비용이 크다
- prompt-builder의 file preview 절단과 잘 안 맞는다

### 5. 마지막 브랜치가 열린 채 끝난다

파일 마지막에는 `unstructured-data-storage` 루트만 있고 하위 확장이 없다.  
이건 작성 중 상태로 보이며, 앞으로 이 파일이 더 커질 가능성이 높다는 신호다.

즉 지금 구조를 그대로 유지하면 토큰 비용은 더 악화될 가능성이 크다.

## `magam` 스킬 관점 분석

## 이미 가능한 절감

### 1. node ID 기반 표적 수정은 매우 효과적이다

이 파일에서는 node ID가 길지만 규칙적이다.

예:

- `database-performance-indexing-composite-check-example`
- `brewer-cap-cp-example-seat-query`
- `relational-schema-rigidity-design-defaults-example`

이건 Magam의 copied node ID 워크플로우와 잘 맞는다.  
전체 파일을 다시 보내지 말고 특정 node/subtree만 수정하도록 유도하면 바로 토큰을 줄일 수 있다.

권장 프롬프트 형태:

```text
`data-storage-map.brewer-cap-cp-example-seat-query` 노드의 코드 예시만 더 짧게 줄여줘
```

```text
`data-storage-map.database-performance-guideline` subtree만 요약 위주로 재작성해줘
```

### 2. 이 파일은 subtree 생성 전략이 특히 잘 맞는다

루트 브랜치가 5개뿐이라서 작성 순서를 더 구조화하기 좋다.

권장 순서:

1. `root`와 root 직계 5개만 생성
2. 브랜치 하나씩 확장
3. 각 브랜치에서 코드 예시 노드만 마지막에 추가
4. 장식용 `Sticker`는 맨 마지막 패스에서 추가

지금처럼 처음부터 완성형 TSX 전체를 생성하는 방식은 가장 비싸다.

### 3. 장식 레이어는 이미 분리돼 있어서 이 점은 좋다

상단의 `Sticker 16개`는 MindMap 본문과 별도 레이어에 놓여 있다.  
이건 좋은 구조다. 내용 편집 시 장식과 분리할 수 있기 때문이다.

다만 장식 수가 많아서 "처음 생성" 프롬프트에는 불필요할 수 있다.  
Magam 스킬 레벨에서 다음 규칙을 두면 좋다.

- 첫 패스: 장식 없이 구조만 생성
- 둘째 패스: 제목 스티커만 추가
- 셋째 패스: 나머지 데코 스티커 추가

## 스킬 보강이 필요해 보이는 부분

### 1. node span 추출이 있으면 큰 폭으로 줄일 수 있다

현재 prompt-builder는 파일 preview 위주라, 긴 TSX 파일에서는 대상 노드가 뒤쪽에 있으면 앞부분 불필요 컨텍스트가 많이 섞인다.

이 파일에는 매우 긴 node ID가 있으므로 다음 기능이 잘 맞는다.

- copied node ID -> JSX element span 추출
- 해당 노드 + 부모 + 자식 몇 개만 prompt에 포함

이 기능 하나만 있어도 이 파일 같은 대형 mindmap에서 효과가 크다.

### 2. subtree export summary가 필요하다

이 파일은 브랜치 경계가 명확하다.

- relational
- non-relational
- performance
- CAP
- unstructured

따라서 Magam 스킬이 subtree를 다음처럼 먼저 요약해 넘기면 좋다.

```json
{
  "branch": "brewer-cap-theorem",
  "nodeCount": 40,
  "focus": "CA/CP/AP trade-offs with MongoDB examples"
}
```

이런 canonical summary는 TSX 전체보다 훨씬 싸다.

## TSX 구조 차원의 개선 제안

## 우선순위 높음

### 1. 브랜치별 파일 분할

현재 파일은 최소 아래 단위로 쪼개는 편이 좋다.

- `notes/data-storage-mindmap/index.tsx`
- `notes/data-storage-mindmap/relational.tsx`
- `notes/data-storage-mindmap/non-relational.tsx`
- `notes/data-storage-mindmap/performance.tsx`
- `notes/data-storage-mindmap/cap.tsx`
- `notes/data-storage-mindmap/unstructured.tsx`
- `notes/data-storage-mindmap/decorations.tsx`

효과:

- AI가 수정 시 읽는 범위가 줄어든다
- 브랜치 단위 요청이 가능해진다
- review/diff도 쉬워진다

### 2. `Sticky + Markdown` 반복을 데이터화

지금 파일은 JSX 오버헤드가 과도하다.  
다음 형태로 바꾸면 토큰 절감 효과가 가장 크다.

```ts
type MindMapEntry = {
  id: string;
  from?: string;
  body: string;
  x?: number;
  y?: number;
  bubble?: boolean;
};
```

```tsx
const relationalNodes: MindMapEntry[] = [
  {
    id: 'relational-database',
    from: 'root',
    body: `## 관계형 데이터베이스\n\n...`,
  },
];
```

```tsx
{relationalNodes.map((node) => (
  <Sticky key={node.id} id={node.id} from={node.from} x={node.x} y={node.y} bubble={node.bubble}>
    <Markdown>{node.body}</Markdown>
  </Sticky>
))}
```

이렇게 하면 AI는 JSX boilerplate를 반복 생성하지 않고 데이터 항목만 추가하면 된다.

### 3. 긴 코드 예시는 별도 상수 또는 외부 md/ts snippet으로 분리

예시 노드는 본문보다 훨씬 길다.

예:

- `relational-schema-rigidity-design-optional-columns-example`
- `brewer-cap-cp-example-seat-query`
- `brewer-cap-ap-example-feed-query`

이런 노드는 최소한 상수로 분리하는 편이 낫다.

```tsx
const CAP_CP_SEAT_QUERY = `...`;
```

더 나은 방식:

- `notes/data-storage-mindmap/snippets/*.md`
- `notes/data-storage-mindmap/snippets/*.ts`

TSX는 구조만 가지고, 긴 본문은 외부에서 import한다.

### 4. 단순 heading 노드는 Markdown을 벗길 수 있다

예를 들어 `## 비정형 데이터 스토리지`처럼 한 줄 heading만 있는 노드는 굳이 긴 template literal + Markdown wrapper를 항상 쓸 필요가 없다.

가능한 방향:

- plain text children 사용
- 또는 `StickyTitle` 같은 짧은 래퍼 도입

예:

```tsx
<Sticky id="unstructured-data-storage" from="root">
  비정형 데이터 스토리지
</Sticky>
```

Markdown이 꼭 필요한 노드와 아닌 노드를 분리하면 토큰이 줄어든다.

## 우선순위 중간

### 5. 공통 노드 헬퍼 도입

완전한 데이터화가 부담되면 중간 단계로 헬퍼 함수만 도입해도 된다.

```tsx
function topic(id: string, from: string | undefined, body: string, extra?: Partial<TopicProps>) {
  return (
    <Sticky id={id} from={from} {...extra}>
      <Markdown>{body}</Markdown>
    </Sticky>
  );
}
```

이것만으로도 파일 길이와 프롬프트 길이가 꽤 줄어든다.

### 6. 코드 예시 노드와 설명 노드를 짝 단위 데이터로 묶기

현재는:

- 코드 예시 노드
- 코드 설명 노드

가 반복된다.

이 둘은 사실상 한 쌍이므로 다음처럼 묶을 수 있다.

```ts
type ExamplePair = {
  exampleId: string;
  explanationId: string;
  code: string;
  explanation: string;
};
```

이건 특히 CAP / MongoDB 예시 구간에서 효과가 크다.

## High Level API 수준의 절감 가능성

### 1. 현재 파일에는 file preview 방식이 비효율적이다

`libs/cli/src/chat/prompt-builder.ts`는 current file preview를 최대 `4KB` 읽는다.  
그런데 이 파일은 `82KB`라서 앞부분 일부만 읽히고, 실제 수정 대상은 뒤쪽일 가능성이 높다.

즉 이 파일에서는 file preview가 다음 문제를 만든다.

- 앞부분 title/sticker/root 일부만 반복적으로 읽힘
- 뒤쪽 CAP/성능/코드 예시 노드 수정에는 직접 도움이 적음
- 같은 요청을 해도 불필요 컨텍스트 비중이 큼

### 2. 상위 API는 file 중심이 아니라 subtree 중심이어야 한다

이 파일에 가장 맞는 API 입력은 다음이다.

- `targetFile`
- `targetNodeId`
- `ancestorChain`
- `childSummaries`
- `selectedSubtreeSource`
- `editIntent`

예:

```json
{
  "targetFile": "notes/data-storage-mindmap.tsx",
  "targetNodeId": "brewer-cap-cp-example-seat-query",
  "ancestorChain": [
    "root",
    "brewer-cap-theorem",
    "brewer-cap-interpretation",
    "brewer-cap-cp",
    "brewer-cap-cp-example-seat"
  ],
  "editIntent": "shorten-example"
}
```

이 구조는 전체 파일 문자열보다 훨씬 싸다.

### 3. canonical graph summary를 먼저 보내는 방식이 잘 맞는다

이 파일은 트리 구조가 명확해서 canonical summary가 유효하다.

예:

```json
{
  "mindmapId": "data-storage-map",
  "roots": [
    { "id": "relational-database", "descendants": 60 },
    { "id": "non-relational-database", "descendants": 45 },
    { "id": "database-performance-improvement", "descendants": 50 },
    { "id": "brewer-cap-theorem", "descendants": 60 },
    { "id": "unstructured-data-storage", "descendants": 0 }
  ]
}
```

AI는 이 요약으로 먼저 구조를 이해하고, 필요한 subtree source만 추가로 받으면 된다.

### 4. delta editing이 특히 잘 맞는다

이 파일은 대부분 "노드 하나의 본문 수정" 형태의 작업이 많을 것이다.  
따라서 전체 TSX 재생성보다 delta patch API가 적합하다.

예:

```json
{
  "operation": "update_node_body",
  "targetNodeId": "database-performance-guideline-order",
  "body": "### 일반적인 적용 순서\n\n1. 쿼리 튜닝 + 인덱싱\n2. 복제\n3. 파티셔닝\n4. 마지막에 샤딩"
}
```

또는:

```json
{
  "operation": "append_subtree",
  "parentNodeId": "unstructured-data-storage",
  "nodes": [
    { "id": "unstructured-object-storage", "body": "### 오브젝트 스토리지\n\n..." }
  ]
}
```

### 5. 구조 편집과 카피 편집을 분리해야 한다

이 파일은 한 번의 요청에 아래를 같이 넣으면 비싸진다.

- subtree 추가
- 긴 설명문 작성
- 코드 예시 작성
- 장식 스티커 추가

분리 권장:

1. topology pass
2. copy pass
3. code-example pass
4. decoration pass

## 가장 현실적인 개선 순서

### 바로 적용 가능

1. `data-storage-mindmap.tsx`를 브랜치별 파일로 쪼갠다.
2. `Sticky + Markdown` 반복을 데이터 배열 렌더링으로 바꾼다.
3. 긴 SQL/TypeScript 예시는 상수 또는 외부 snippet 파일로 뺀다.
4. Magam 프롬프트 기본 전략을 "전체 파일"에서 "node ID / subtree"로 바꾼다.

### 다음 단계

1. copied node ID -> JSX span 추출 유틸리티 구현
2. prompt-builder에 subtree source 입력 경로 추가
3. canonical graph summary 생성기 추가
4. delta edit -> AST patch 경로 추가

## 판단

이 파일에서 토큰을 절약하는 가장 큰 방법은 "더 짧은 JSX를 쓰는 것" 자체보다, **TSX를 AI의 주 편집 포맷으로 두지 않는 것**이다.

현재 구조는 다음 두 층이 과도하게 결합돼 있다.

- 지식 콘텐츠
- 렌더링 마크업

이 둘을 분리하면 효과가 크다.

- 콘텐츠는 branch data / snippet / summary로 저장
- TSX는 그 데이터를 렌더하는 얇은 레이어로 유지
- AI는 전체 파일이 아니라 node/subtree/data entry만 다루게 함

이 파일 하나만 놓고 보면, 가장 ROI가 높은 선택은 다음 순서다.

1. 브랜치 분할
2. `Sticky + Markdown` 데이터화
3. subtree 기반 편집
4. 코드 예시 외부화

이 네 가지가 실제 토큰 절감 효과가 가장 크다.
