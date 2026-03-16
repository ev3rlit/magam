# Next Surface Design: `group-hover`, `ImageNode`, `WashiTapeNode`

## Purpose

정적 runtime styling v1 이후 다음 확장 후보인 `group-hover:`와 `ImageNode` / `WashiTapeNode`의 `className` surface 개방 방향을 정리한다.

## 1. `group-hover:` runtime surface

### Current constraint

- 현재 runtime interaction state는 각 node root 내부의 local state(`hover`, `focus`, `active`)로만 존재한다.
- `group-hover:`가 의미를 가지려면 "다른 node가 hover 중인지"를 현재 node가 알 수 있어야 한다.
- 저장소 기준으로 현재 그룹 개념은 `groupId`가 있는 mindmap/member 계열에서만 드러나며, runtime styling은 이 그룹 상태를 아직 store에 올리지 않는다.

### Required runtime surface

`group-hover:`를 지원하려면 아래 surface가 필요하다.

1. **Stable group identity**
- 각 node가 styling 관점에서 어떤 group에 속하는지 식별 가능해야 한다.
- 우선 후보는 이미 존재하는 `data.groupId`.
- 단, `groupId`가 없는 일반 canvas object에는 `group-hover:`를 허용하지 않는 편이 안전하다.

2. **Shared interaction registry**
- store 레벨에 `hoveredGroupIds` 또는 `hoveredNodeIdsByGroup`가 있어야 한다.
- local `BaseNode` state만으로는 부족하다.

3. **Interpreter/runtime evaluation rule**
- `group-hover:*` 토큰은 "자기 자신이 아니라 동일 group 내 다른 eligible member가 hovered인지"를 기준으로 active/inactive가 결정되어야 한다.
- 자기 자신 hover를 포함할지 제외할지는 명시적으로 고정해야 한다.
  - 추천: **포함**
  - 이유: Tailwind 사용자의 기대와 가장 가깝고 설명이 단순하다.

4. **Unsupported diagnostics**
- `groupId` 없는 node에서 `group-hover:*`를 쓰면 unsupported diagnostic이 나와야 한다.
- group surface가 있지만 registry가 비활성화된 경우도 조용히 무시하지 않는다.

### Recommended architecture

#### Phase A: group-state capture

- `BaseNode`가 `data.groupId`가 있는 경우 hover enter/leave 때 store action을 호출한다.
- store는 `workspaceInteractionByGroupId: Record<string, { hoveredNodeIds: string[] }>` 같은 구조를 유지한다.

#### Phase B: per-node evaluation context

- `buildWorkspaceStyleSnapshot()`가 node별 해석 시점에 `groupInteractionContext`를 함께 전달한다.
- interpreter는 local variant(`hover`, `focus`, `active`)와 shared variant(`group-hover`)를 별도 레이어로 평가한다.

#### Phase C: limited rollout

- v1.1에서는 `group-hover:`를 **`groupId`가 있는 node에 한해서만** 허용한다.
- 특히 mindmap member 계열부터 시작하는 것이 안전하다.

### Why not support it immediately everywhere

- 현재 repo의 group 개념은 layout/editing 중심이지 styling group abstraction이 아니다.
- 임의의 container/frame subtree 전체를 styling group으로 해석하기 시작하면 source-of-truth가 불명확해진다.
- 그래서 first cut은 `groupId` 기반 제한 rollout이 맞다.

## 2. `ImageNode` className surface

### Current state

- `ImageNode`는 `BaseNode`를 사용하지만 node data에 `className`이 없다.
- 즉 runtime payload 소비 경로는 이미 존재하지만 입력 surface가 비어 있다.

### Recommended direction

`ImageNode`는 비교적 쉬운 확장 대상이다.

1. `ImageNodeData`에 `className?: string` 추가
2. render/parser/core surface에서 이 필드를 node data로 전달
3. 초기 적용 범위는 **image frame/wrapper styling**으로 제한

### Why wrapper-first

- 현재 `ImageNode`는 이미지 자체보다 wrapper border/padding/shadow가 UX적으로 더 의미 있는 surface다.
- `className`을 wrapper에만 적용해도 `border`, `rounded`, `shadow`, `ring`, interaction variant 대부분이 바로 가치가 있다.
- `<img>` 자체에 utility를 직접 적용하려면 `object-fit`, `filter`, `mix-blend`, crop semantics까지 얽혀서 scope가 불필요하게 커진다.

### Safe initial contract

- 지원: border, radius, shadow, outline/ring, opacity, background, interaction variants
- 비지원: 이미지 픽셀 자체의 blend/filter utility 전반

### Implementation slice

1. core/render surface에 `className` 추가
2. `ImageNodeData` 타입 추가
3. example/quick smoke 추가
4. capability matrix를 `ImageNode: Yes`로 승격

## 3. `WashiTapeNode` className surface

### Current state

- `WashiTapeNode`는 `BaseNode`를 쓰지만 핵심 시각 surface는 내부 `tapeStyle`에 직접 인라인으로 계산된다.
- 그래서 outer wrapper에만 `className`을 열어도 사용자가 기대하는 "테이프 색/질감/글자" 제어와는 어긋날 가능성이 크다.

### Recommended direction

`WashiTapeNode`는 `ImageNode`와 다르게 **wrapper-first보다 tape-surface-first**가 맞다.

#### Option A: outer wrapper `className`

- 장점: 구현이 빠르다.
- 단점: 실제 tape 시각보다 바깥 box에만 영향이 커서 기대치가 낮다.

#### Option B: primary tape surface `className` (Recommended)

- `className`을 내부 tape div 스타일에 매핑한다.
- runtime payload가 `background`, `opacity`, `shadow`, `outline`, 일부 text-related styling을 tape surface에 직접 반영한다.
- 이 방식이 "washi tape를 꾸민다"는 사용자 기대와 맞다.

### Suggested contract

초기 계약은 다음이 안전하다.

- `className`: tape body surface
- optional future: `labelClassName`: overlay text surface

### Rollout warning

- washi는 geometry/texture/pattern이 강해서 모든 utility를 그대로 받으면 preset 의미가 깨질 수 있다.
- 그래서 first cut은 아래만 허용하는 편이 낫다.
  - opacity
  - shadow / ring / outline
  - width/height-like scaling이 아닌 safe visual subset
  - background/tint 계열은 preset과 합성 규칙을 먼저 정해야 한다

## 4. Recommended order

1. `ImageNode` wrapper `className` surface
2. `group-hover:` on `groupId`-backed nodes only
3. `WashiTapeNode` primary tape surface

이 순서가 맞는 이유:

- `ImageNode`는 이미 BaseNode/runtime 소비 경로가 있어서 입력만 열면 된다.
- `group-hover:`는 구조 설계가 필요하지만 node family 추가보다 제품 가치가 더 크다.
- `WashiTapeNode`는 시각 계약이 가장 까다로워 마지막이 안전하다.

## 5. Explicit non-goal for next slice

- `group-hover:`를 arbitrary container subtree 전체로 일반화하지 않는다.
- `WashiTapeNode`에서 preset/pattern 의미를 덮어쓰는 무제한 styling은 다음 slice에 포함하지 않는다.
