# Data Model: Paper Material (Sticky + Shared Material)

## 1) MaterialPreset

- Purpose: 제품이 기본 제공하는 종이/소재 프리셋 정의의 단일 소스.

### Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `MaterialPresetId` | Yes | 프리셋 고유 식별자 |
| `label` | string | Yes | UI/문서 노출 라벨 |
| `backgroundColor` | string | Yes | 기본 배경색 |
| `backgroundImage` | string | No | CSS background-image 표현 |
| `backgroundSize` | string | No | 줄노트/격자 등 반복 간격 정보 |
| `textColor` | string | Yes | 기본 텍스트 색상 |

### Constraints

- `id`는 문자열 리터럴 유니온(`MaterialPresetId`)이어야 한다.
- `id`별 메타는 `MATERIAL_PRESET_REGISTRY`에서 정확히 1개만 존재해야 한다.

## 2) PaperMaterial (Discriminated Union)

### Variant: PresetMaterialDef

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'preset'` | Yes | 소재 타입 식별자 |
| `id` | `MaterialPresetId` | Yes | 프리셋 ID |
| `color` | string | No | 프리셋 기본색 오버라이드(예: postit) |

### Variant: SolidMaterialDef

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'solid'` | Yes | 소재 타입 식별자 |
| `color` | string | Yes | 단색 값 |

### Variant: SvgMaterialDef

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'svg'` | Yes | 소재 타입 식별자 |
| `src` | string | No | 외부 SVG URL |
| `markup` | string | No | inline SVG markup |

Validation:
- `src` 또는 `markup` 중 하나 이상 존재해야 한다.
- `markup`은 sanitize 통과 시에만 렌더링한다.

### Variant: ImageMaterialDef

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'image'` | Yes | 소재 타입 식별자 |
| `src` | string | Yes | 이미지 소스 |
| `scale` | number | No | 0.25 ~ 4 범위 |
| `repeat` | `'repeat-x' \| 'repeat' \| 'stretch'` | No | 반복 모드 |

Validation:
- `src`가 비어 있으면 fallback preset 적용.
- `scale`은 clamp(0.25, 4).

## 3) AtDef (Unified Positioning)

### AnchorAt

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'anchor'` | Yes | 상대 배치 모드 |
| `target` | string | Yes | 기준 노드 ID |
| `position` | enum | No | 기본 `bottom` |
| `gap` | number | No | 기준 거리 |
| `align` | `'start' \| 'center' \| 'end'` | No | 정렬 규칙 |

### AttachAt

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'attach'` | Yes | 부착 배치 모드 |
| `target` | string | Yes | 대상 노드 ID |
| `placement` | enum | No | top/bottom/left/right/center |
| `span` | number | No | 대상 폭 비율 |
| `align` | number | No | 정렬 비율 |
| `offset` | number | No | 오프셋 |
| `followRotation` | boolean | No | 회전 추종 여부 |

### PolarAt / SegmentAt

- 기존 Washi 경로의 `polar`, `segment`를 유지해 배치 계산 로직 재사용.

### Priority Rule

- `at` 지정 시 `x,y`는 무시한다.
- `at` 미지정 시 `x,y` 사용.
- 둘 다 없으면 개발 단계에서 명시적 오류를 반환한다.

## 4) StickyNodeData (Runtime)

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | 노드 식별자 |
| `type` | `'sticky'` | Yes | 노드 타입 |
| `position` | `{x:number;y:number}` | Yes | 최종 렌더 좌표 |
| `data.label` | string | Yes | 표시 텍스트 |
| `data.pattern` | `PaperMaterial` | No | 소재 정의 |
| `data.at` | `AtDef` | No | 상대/부착 위치 정의 |
| `data.color` | string | No | 레거시 입력 |
| `data.shape` | `'rect' \| 'heart' \| 'cloud' \| 'speech'` | No | 메모 모양 |
| `data.width` | number | No | 폭 힌트 |
| `data.height` | number | No | 높이 힌트 |
| `data.fallbackApplied` | boolean | No | fallback 적용 여부 |
| `data.debugReason` | string | No | fallback 사유 |

### Normalization Rules

- `pattern`이 없고 `color`만 있으면 `solid(color)`로 변환.
- `pattern`과 `color`가 함께 있으면 `pattern` 우선.
- invalid pattern은 `preset('postit')`로 대체하고 reason 기록.

## 5) ResolvedMaterialStyle (Derived)

- Purpose: `PaperMaterial`을 실제 CSS 렌더 속성으로 변환한 결과.

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `kind` | `'preset' \| 'solid' \| 'svg' \| 'image'` | Yes | 최종 분기 |
| `presetId` | `MaterialPresetId` | Yes | 기준 프리셋 ID |
| `backgroundColor` | string | No | 계산된 배경색 |
| `backgroundImage` | string | No | 계산된 이미지 |
| `backgroundSize` | string | No | 계산된 크기 |
| `backgroundRepeat` | string | No | 반복 모드 |
| `fallbackApplied` | boolean | Yes | fallback 적용 여부 |
| `debugReason` | string | No | fallback 사유 |

## Relationships

- `StickyNodeData.data.pattern` -> `PaperMaterial` (1:1)
- `PaperMaterial(type='preset').id` -> `MaterialPreset.id` (N:1)
- `StickyNodeData.data.at.target` -> target node id (N:1)
- `PaperMaterial` -> `ResolvedMaterialStyle` (파생 관계)

## State Transitions

1. `InputReceived` -> `Normalized`
   - Trigger: parser/WS update 수신
   - Action: `pattern`/`at` 정규화 + 하위호환 변환
2. `Normalized` -> `PositionResolved`
   - Trigger: layout pass
   - Action: `at` 우선순위 적용, target 해석, 좌표 계산
3. `PositionResolved` -> `StyleResolved`
   - Trigger: node render
   - Action: `PaperMaterial` -> CSS 스타일 변환
4. `StyleResolved` -> `Persisted`
   - Trigger: file patch/save
   - Action: TSX props 직렬화
5. `Persisted` -> `Rehydrated`
   - Trigger: reopen/render
   - Action: 동일 규칙으로 재정규화, 결과 일관성 보장
