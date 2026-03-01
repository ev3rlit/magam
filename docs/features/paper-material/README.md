# 종이류 & 소재 확장 PRD (Post-it Paper Material)

## 1) 배경

현재 포스트잇은 기본 종이 질감 중심으로 동작해 "메모의 맥락"을 시각적으로 구분하기 어렵습니다.  
저널링 사용자는 메모 타입(아이디어, 할 일, 회고, 보관용)을 빠르게 구분하기 위해 종이 소재/패턴/모양 선택을 원합니다.

`docs/concepts/journaling`에는 이미 라인 노트, 크래프트지, 포스트잇 질감 등 컨셉 에셋이 준비되어 있으며, 이를 제품 기능으로 정식화할 필요가 있습니다.

## 2) 문제 정의

- 현재 스타일 다양성이 낮아, 많은 메모가 같은 우선순위로 보입니다.
- 소재 확장이 필요한데 속성 모델이 단일 타입에 가깝고 확장 규칙이 불명확합니다.
- 프리셋/사용자 커스텀(SVG, 이미지, 단색) 입력 경로가 분리되어 있어 일관된 UX/데이터 모델이 없습니다.
- 실험 단계에서 빠르게 변경 가능한 API 경계 규칙이 명확하지 않습니다.

핵심 문제는 "소재 확장을 수용하는 안정적 props 계약이 없다"는 점입니다.

## 3) 목표와 비목표

### 목표

- 포스트잇 기본값을 "종이 질감 포스트잇"으로 유지한다.
- 소재 소스를 4가지로 표준화한다.
  - 사전 제공 프리셋
  - 사용자 커스텀 SVG 패턴
  - 이미지 패턴
  - 단색 패턴
- 다양한 종이류/소재(메모지, 트레이싱지, 크래프트지, 색지, 레이스 페이퍼, 봉투형, 콜라주, 필름 스트립)를 프리셋 카탈로그로 제공한다.
- 포스트잇 다양한 모양(하트, 구름, 말풍선)을 소재와 조합 가능하게 한다.
- `Discriminated Union` 기반 props로 타입 안정성과 확장성을 확보한다.

### 비목표

- Inspector 패널 / UI 기반 소재 편집: 소재 적용은 TSX 코드로만 수행한다. 캔버스 위 시각적 편집 UI(인스펙터, 사이드바, 드롭다운 등)는 제공하지 않는다.
- 포토샵 수준의 텍스처 편집기 제공
- AI 기반 자동 패턴 생성
- 에셋 마켓/구매 시스템
- 실시간 협업 편집 충돌 해결

## 4) 사용자 시나리오

1. 사용자는 포스트잇을 추가하면 기본 포스트잇 종이 질감으로 즉시 생성된다.
2. 사용자는 프리셋에서 `라인 노트` 또는 `크래프트지`를 선택해 메모 성격을 구분한다.
3. 사용자는 하트/구름/말풍선 모양 포스트잇을 선택해 감정/코멘트 메모를 강조한다.
4. 사용자는 커스텀 SVG 패턴을 업로드해 브랜드/테마 일관성을 맞춘다.
5. 사용자는 이미지 패턴(빈티지 신문, 지도, 티켓 느낌)을 적용해 콜라주 메모를 만든다.
6. 사용자는 트레이싱지(반투명) 소재를 겹쳐서 배경을 일부 보여주며 주석을 남긴다.

## 5) 프리셋 카탈로그 (v1)

총 11개 프리셋. 각 프리셋은 `MaterialPresetMeta`(`backgroundColor`, `backgroundImage?`, `textColor`)로 정의되며 CSS로 직접 렌더링된다.

**기존 (구현 완료)**

| 프리셋 ID | 라벨 | 설명 |
|---|---|---|
| `postit` | Post-it | 포스트잇 형태 (135° 3-stop 그라데이션 + 글로스 + 코너 컬). 기본색 버터 옐로(#fce588). `color` 옵션으로 자유롭게 변경 가능 |
| `pastel-dots` | Pastel Dots | 파스텔 핑크 배경 + 도트 패턴 |
| `kraft-grid` | Kraft Grid | 크래프트 갈색 배경 + 격자 패턴 |
| `masking-solid` | Masking Solid | 마스킹 테이프 노란색 단색 |
| `neon-stripe` | Neon Stripe | 연두 배경 + 대각선 스트라이프 |
| `vintage-paper` | Vintage Paper | 오프화이트 배경 + 미세 대각 그라데이션 |

**추가 예정 — 노트 4종** (컨셉: `lined-paper.html`, `grid-paper.html`)

| 프리셋 ID | 라벨 | 설명 | CSS 기법 |
|---|---|---|---|
| `lined-warm` | Lined Warm | 따뜻한 크림색 줄 노트 (28px 간격) | `linear-gradient(transparent 27px, #dcd0c0 28px)` background-size 100% 28px |
| `grid-standard` | Grid Standard | 20px 표준 격자 | dual `linear-gradient` 1px lines at 20px |
| `grid-fine` | Grid Fine | 10px 미세 격자 | dual `linear-gradient` 1px lines at 10px |
| `dot-grid` | Dot Grid | 20px 도트 그리드 (불렛저널) | `radial-gradient(circle 1px)` at 20px spacing |

**추가 예정 — 크래프트 1종** (컨셉: `kraft-paper.html`)

| 프리셋 ID | 라벨 | 설명 | CSS 기법 |
|---|---|---|---|
| `kraft-natural` | Kraft Natural | 자연 크래프트지 질감 | 145° multi-stop gradient + feTurbulence SVG grain overlay |

공통 속성: `backgroundColor` #fefcf7 (노트류), #e8d5a8 (크래프트), `textColor` #5a3e28 (갈색 잉크)

> 참고: 노트/격자 프리셋은 `backgroundSize` 정보가 필요하므로, `MaterialPresetMeta`에 `backgroundSize?: string` 추가를 검토한다.

## 6) 기능 요구사항

### FR-1. 소재 소스 타입 표준화

- 포스트잇 소재는 `preset`, `svg`, `image`, `solid` 4가지 타입으로 제공한다.
- 기본값은 컴포넌트별 기본 프리셋으로 fallback한다 (Sticky → `preset('postit')`).

수용 기준

- [AC-01] 소재 타입을 선택하지 않아도 컴포넌트는 기본 프리셋으로 렌더링된다.
- [AC-02] 저장/재로드 후 소재 타입과 값이 유지된다.

### FR-2. 프리셋 소재 제공

- v1 프리셋 카탈로그를 기본 제공한다.
- 프리셋은 패턴 소스(ID)만 정의하고, `patternOpacity`/`patternScale`은 Sticky 공통 props로 제어한다.

수용 기준

- [AC-03] 카탈로그의 각 프리셋을 선택하면 즉시 미리보기가 반영된다.
- [AC-04] 트레이싱지/레이스 등 반투명 프리셋은 배경 오브젝트가 비쳐 보인다.

### FR-3. 사용자 커스텀 SVG 패턴

- 문자열 또는 에셋 파일 기반 SVG 패턴 입력을 지원한다.
- 안전하지 않은 태그/속성은 제거하거나 명시적 오류를 반환한다.

수용 기준

- [AC-05] 유효한 SVG 패턴은 타일 렌더링으로 적용된다.
- [AC-06] 무효/위험 SVG 입력은 오류 메시지와 함께 저장이 차단된다.

### FR-4. 이미지 패턴 지원

- 로컬/프로젝트 에셋 이미지를 패턴 소스로 사용할 수 있다.
- `repeat` 모드(`repeat-x`, `repeat`, `stretch`)와 `scale`(0.25~4) 파라미터를 제공한다.

수용 기준

- [AC-07] 이미지 패턴 적용 시 repeat/scale 변경이 즉시 반영된다.
- [AC-08] 이미지 로드 실패 시 기본 프리셋으로 graceful fallback된다.

### FR-5. 단색 패턴 지원

- 단색 배경(`color`)을 지원한다.
- `solid(color)` 헬퍼로 간결하게 생성한다.

수용 기준

- [AC-09] 단색 패턴이 올바른 CSS background-color로 렌더링된다.
- [AC-10] 빈 문자열 등 무효 color 값은 기본 프리셋으로 fallback된다.

### FR-6. 모양(Shape) 조합

- 기본 직사각형 외 `heart`, `cloud`, `speech` 모양을 지원한다.
- 모양과 소재는 독립 조합 가능해야 한다.

수용 기준

- [AC-11] 같은 소재를 서로 다른 모양에 적용해도 렌더 결과가 일관된다.
- [AC-12] 모양 변경 시 텍스트 영역(패딩/줄바꿈)이 자동 보정된다.

### FR-7. Discriminated Union props 계약

- 소재 타입에 따라 필요한 속성만 허용하는 Union 계약을 도입한다.
- 포스트잇 컴포넌트의 공개 API는 `pattern` 프롭으로 통일한다.
- `pattern`은 helper 함수(`preset`, `svg`, `image`, `solid`)로 생성해 전달한다.
- 내부 도메인 모델은 `MaterialPresetId`를 문자열 리터럴 유니온 강타입으로 관리한다.
- 무효 입력은 절대 throw하지 않고 기본 프리셋으로 graceful fallback한다.

수용 기준

- [AC-13] 잘못된 조합(예: `type='solid'`인데 `src`만 전달)은 타입/검증 단계에서 차단된다.
- [AC-14] 내부 코드에서 잘못된 프리셋 ID 문자열은 컴파일 타임에 오류로 검출된다.
- [AC-15] 외부 입력의 미등록 프리셋 ID는 기본 프리셋으로 fallback되며 `fallbackApplied` 플래그가 설정된다.
- [AC-16] `preset/svg/image/solid` helper 사용 시 IDE 자동완성과 타입 추론이 동작한다.

## 7) 제안 Props 모델 (Discriminated Union)

### 공유 소재 모듈 구조

소재 시스템은 컴포넌트에 종속되지 않는 공유 모듈로 분리한다. `Sticky`, `WashiTape` 등 소재를 사용하는 모든 컴포넌트가 동일한 `PaperMaterial` 타입과 헬퍼 함수를 공유한다.

```
@magam/core
├── material/
│   ├── types.ts          # PaperMaterial union 타입 정의
│   ├── presets.ts         # MATERIAL_PRESET_REGISTRY (전체 프리셋 통합)
│   └── helpers.ts         # preset(), svg(), image(), solid(), definePattern()
├── components/
│   ├── Sticky.tsx         # pattern?: PaperMaterial
│   └── WashiTape.tsx      # pattern?: PaperMaterial
└── index.ts               # 컴포넌트 + 헬퍼 모두 re-export
```

- **헬퍼 함수 한 벌**: `preset()`, `svg()`, `image()`, `solid()`, `definePattern()`은 컴포넌트와 무관하게 `PaperMaterial` 객체를 생성한다.
- **프리셋 통합 관리**: 모든 프리셋 ID는 `MATERIAL_PRESET_REGISTRY` 하나에서 관리한다.
- **교차 적용 허용**: 어떤 프리셋이든 어떤 컴포넌트에든 적용 가능하다. 컴포넌트별 제한이 필요하면 런타임 경고로 처리한다.

### 타입 정의 (material/types.ts)

```ts
// --- 프리셋 레지스트리 (material/presets.ts) ---

const MATERIAL_PRESET_IDS = [
  // 포스트잇
  'postit',
  // 기존
  'pastel-dots',
  'kraft-grid',
  'masking-solid',
  'neon-stripe',
  'vintage-paper',
  // 노트 4종
  'lined-warm',
  'grid-standard',
  'grid-fine',
  'dot-grid',
  // 크래프트 1종
  'kraft-natural',
] as const;

type MaterialPresetId = (typeof MATERIAL_PRESET_IDS)[number];

interface MaterialPresetMeta {
  label: string;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: string;       // 격자/줄 노트 프리셋에 필요
  textColor: string;
}

const MATERIAL_PRESET_REGISTRY = {
  'postit':         { label: 'Post-it',        backgroundColor: '#fce588', backgroundImage: 'linear-gradient(135deg, ...)', textColor: '#5a3e28' },
  'pastel-dots':    { label: 'Pastel Dots',    backgroundColor: '#fdf2f8', backgroundImage: 'radial-gradient(...)', textColor: '#7f1d1d' },
  'kraft-grid':     { label: 'Kraft Grid',     backgroundColor: '#f5deb3', backgroundImage: 'linear-gradient(...)', textColor: '#78350f' },
  'masking-solid':  { label: 'Masking Solid',  backgroundColor: '#fde68a', backgroundImage: undefined,              textColor: '#713f12' },
  'neon-stripe':    { label: 'Neon Stripe',    backgroundColor: '#d9f99d', backgroundImage: 'repeating-linear-gradient(...)', textColor: '#14532d' },
  'vintage-paper':  { label: 'Vintage Paper',  backgroundColor: '#f8fafc', backgroundImage: 'linear-gradient(...)', textColor: '#1e293b' },
  // 노트 4종
  'lined-warm':     { label: 'Lined Warm',     backgroundColor: '#fefcf7', backgroundImage: 'linear-gradient(transparent 27px, #dcd0c0 28px)', backgroundSize: '100% 28px', textColor: '#5a3e28' },
  'grid-standard':  { label: 'Grid Standard',  backgroundColor: '#fefcf7', backgroundImage: 'linear-gradient(rgba(180,170,155,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(180,170,155,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px', textColor: '#5a3e28' },
  'grid-fine':      { label: 'Grid Fine',      backgroundColor: '#fefcf7', backgroundImage: 'linear-gradient(rgba(180,170,155,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(180,170,155,0.2) 1px, transparent 1px)', backgroundSize: '10px 10px', textColor: '#5a3e28' },
  'dot-grid':       { label: 'Dot Grid',       backgroundColor: '#fefcf7', backgroundImage: 'radial-gradient(circle 1px, rgba(160,150,135,0.35) 1px, transparent 1px)', backgroundSize: '20px 20px', textColor: '#5a3e28' },
  // 크래프트 1종
  'kraft-natural':  { label: 'Kraft Natural',  backgroundColor: '#e8d5a8', backgroundImage: 'linear-gradient(145deg, #e8d5a8 0%, #dcc590 40%, #e8d5a8 70%, #d8c088 100%)', textColor: '#5a3e28' },
} as const;

// --- 소재 타입 (material/types.ts) ---

type MaterialRepeat = 'repeat-x' | 'repeat' | 'stretch';

interface PresetMaterialDef {
  type: 'preset';
  id: MaterialPresetId;
  color?: string;           // 프리셋 기본색 오버라이드 (postit 등 형태 프리셋에서 사용)
}

interface SolidMaterialDef {
  type: 'solid';
  color: string;
}

interface SvgMaterialDef {
  type: 'svg';
  src?: string;     // 외부 SVG URL
  markup?: string;  // 인라인 SVG 문자열
}

interface ImageMaterialDef {
  type: 'image';
  src: string;
  scale?: number;            // 0.25~4
  repeat?: MaterialRepeat;   // default: 'repeat-x'
}

type PaperMaterial =
  | PresetMaterialDef
  | SolidMaterialDef
  | SvgMaterialDef
  | ImageMaterialDef;

// --- 헬퍼 함수 (material/helpers.ts) ---

function preset(id: MaterialPresetId, opts?: { color?: string }): PresetMaterialDef;
function solid(color: string): SolidMaterialDef;
function svg(opts: { src?: string; markup?: string }): SvgMaterialDef;
function image(src: string, opts?: { scale?: number; repeat?: MaterialRepeat }): ImageMaterialDef;
function definePattern<T extends PaperMaterial>(def: T): T;  // 타입 어서션 유틸리티

// --- 컴포넌트별 Props (components/) ---

interface StickyProps {
  id?: string;
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;                   // 레거시 호환
  fontFamily?: FontFamilyPreset;
  pattern?: PaperMaterial;          // 소재 지정
  className?: string;
}

interface WashiTapeProps {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  at?: AtDef;                       // 배치 (segment | polar | attach)
  pattern?: PaperMaterial;          // 소재 지정
  edge?: EdgeDef;                   // 테두리 (smooth | torn)
  texture?: TextureDef;             // 텍스처 (opacity, blendMode)
  seed?: string | number;
  opacity?: number;
  className?: string;
}
```

### 사용 예시

```tsx
import {
  Sticky, WashiTape,
  preset, svg, image, solid, definePattern,
  polar, attach, torn,
} from "@magam/core"

// 1) 기본값 사용: pattern 미지정 → 기본 포스트잇(버터 옐로) 자동 적용
<Sticky id="memo-1" text="오늘 회고 정리" x={120} y={90} />

// 2) 포스트잇 형태 + 색상 커스텀
<Sticky
  id="memo-2a"
  text="긴급 TODO"
  pattern={preset('postit', { color: '#ff6b6b' })}
  x={200} y={90}
/>

// 3) 프리셋 패턴
<Sticky
  id="memo-2"
  text="회의 액션 아이템"
  pattern={preset('kraft-grid')}
  x={300} y={90}
/>

// 4) 커스텀 SVG 패턴 (인라인 markup 또는 외부 URL)
<Sticky
  id="memo-3"
  text="브랜드 테마 메모"
  pattern={svg({ markup: '<svg>...</svg>' })}
  x={400} y={90}
/>

// 5) 이미지 패턴
<Sticky
  id="memo-4"
  text="빈티지 콜라주"
  pattern={image('./assets/papers/vintage-map.png', { scale: 1.5, repeat: 'repeat' })}
  x={500} y={90}
/>

// 6) 단색 패턴
<Sticky
  id="memo-5"
  text="중요 TODO"
  pattern={solid('#ffe27a')}
  x={600} y={90}
/>

// 7) WashiTape — 같은 헬퍼, 같은 PaperMaterial 타입
<WashiTape id="tape-1" x={100} y={250} width={200} pattern={preset('pastel-dots')} />
<WashiTape
  id="tape-2"
  at={polar(100, 300, 150, -3)}
  pattern={svg({ markup: '<svg>...</svg>' })}
  edge={torn(3)}
/>

// 8) 교차 적용 — 어떤 프리셋이든 어떤 컴포넌트에든 사용 가능
<Sticky id="memo-6" text="테이프 질감 메모" pattern={preset('neon-stripe')} x={200} y={400} />
<WashiTape id="tape-3" x={200} y={450} width={180} pattern={preset('vintage-paper')} />

// 9) definePattern — 타입 어서션 유틸리티
const myPattern = definePattern({ type: 'solid', color: '#fce588' });
<Sticky id="memo-7" text="커스텀" pattern={myPattern} x={300} y={400} />
```

가이드

- 신규 API는 `pattern` prop + 헬퍼 함수 사용을 기본으로 한다.
- `definePattern()`으로 타입 어서션이 필요한 경우 안전하게 객체 리터럴을 생성할 수 있다.

설계 원칙

- 소재 독립: 소재 시스템(`PaperMaterial`, 헬퍼, 레지스트리)은 컴포넌트에 종속되지 않는 공유 모듈로 분리
- 형태/색상 독립: 프리셋의 시각적 형태(그라데이션, 글로스, 컬 등)와 기본색은 독립 축이다. `preset(id, { color })` 패턴으로 형태는 유지하면서 색상만 자유롭게 변경할 수 있다.
- 기본값 우선: `pattern`이 없으면 클라이언트에서 기본 프리셋(`postit`)으로 fallback
- API 명확성: 컴포넌트 외부에서는 `pattern` 프롭만 사용하도록 가이드
- helper 우선: 수동 객체 리터럴 대신 `preset/svg/image/solid` helper로 오타/누락 방지
- 단일 소스: 프리셋 목록/타입/렌더 정보는 `MATERIAL_PRESET_REGISTRY` 한 곳에서 파생
- 타입 안전성: `MaterialPresetId`로 컴파일 타임 오타 방지
- Graceful fallback: 무효한 소재 입력은 절대 throw하지 않고 기본 프리셋으로 fallback
- 확장성: 신규 소재 타입 추가 시 union 분기만 확장
- 실험 민첩성: 하위 호환 제약 없이 API를 빠르게 변경 가능

### 마이그레이션 전략

#### 원칙

- **소스 호환성 우선**: 기존 TSX 코드의 `<Sticky color="..." />`는 수정 없이 동작해야 한다.
- **점진적 전환**: `color` prop은 deprecated하지 않고 유지하되, 신규 코드는 `pattern` 사용을 권장한다.
- **무중단**: 기존 그래프 AST(JSON)에 `pattern` 필드가 없어도 클라이언트가 기본값으로 정상 렌더링한다.

#### `color` → `pattern` 내부 변환 규칙

클라이언트 렌더러에서 다음 우선순위로 소재를 결정한다:

| 조건 | 적용 결과 |
|------|-----------|
| `pattern` 지정됨 | `pattern` 사용 (`color` 무시) |
| `pattern` 없음 + `color` 지정됨 | `solid(color)` 변환 |
| `pattern` + `color` 모두 없음 | 컴포넌트별 기본 프리셋 적용 (Sticky → `preset('postit')`) |

#### 기존 코드 시나리오

```tsx
// 기존 코드 — 수정 없이 그대로 동작
<Sticky id="m1" text="메모" x={10} y={10} color="#fce588" />
// → 내부에서 solid('#fce588')으로 처리

// 신규 코드 — pattern 사용 권장
<Sticky id="m2" text="메모" x={10} y={10} pattern={solid('#fce588')} />
```

#### AST 호환성

- Reconciler는 `color`, `pattern` 모두 pass-through한다. 정규화는 클라이언트에서 수행한다.
- 기존 AST: `{ props: { color: '#fce588' } }` → 클라이언트가 solid로 변환
- 신규 AST: `{ props: { pattern: { type: 'solid', color: '#fce588' } } }` → 그대로 사용

#### WashiTape

WashiTape은 신규 컴포넌트이므로 마이그레이션 불필요. `pattern`이 첫 번째이자 유일한 소재 API이다.

## 8) 렌더링 아키텍처

### 데이터 흐름

```
사용자 TSX (<Sticky pattern={preset('kraft-grid')} />)
  → esbuild 트랜스파일
  → Node.js 실행 → React Element
  → Custom Reconciler → Graph AST (JSON)
    { type: 'graph-sticky', props: { pattern: { type: 'preset', id: 'kraft-grid' }, ... } }
  → HTTP JSON 응답 → 클라이언트
  → resolveWashiPattern() → CSS 속성 변환
  → ReactFlow 노드 렌더링
```

### 서버 사이드 (Reconciler → AST)

- `pattern` 객체는 JSON-직렬화 가능하며, Reconciler가 `graph-sticky` 인스턴스의 props로 그대로 전달한다.
- Reconciler는 `pattern` 값을 검증하지 않는다 (기존 `[key: string]: any` pass-through 패턴 유지).
- 타입 검증은 컴파일 타임(TypeScript) + 선택적 런타임 스키마(Zod)에서 수행한다.

### 클라이언트 사이드 (ReactFlow 노드)

패턴 타입별 렌더링 전략:

| 타입 | 렌더링 방식 |
|------|------------|
| `preset` | 프리셋 ID → 레지스트리 CSS background 적용. `color` 지정 시 `backgroundColor`를 오버라이드하고 light/dark 파생색 자동 계산 |
| `svg` | `markup` → sanitize → data URI 인코딩 → `background-image`, 또는 `src` → URL 직접 사용 |
| `image` | `src` → `background-image` + `scale`/`repeat` 기반 `background-size`/`background-repeat` |
| `solid` | `color` → `background-color` |

### 프리셋 렌더 정의

`MATERIAL_PRESET_REGISTRY`가 렌더 정보(`backgroundColor`, `backgroundImage`, `textColor`)를 직접 포함하므로, 별도의 클라이언트 스타일 매핑이 불필요하다. 클라이언트의 `resolveWashiPattern()`이 레지스트리에서 CSS 속성을 직접 추출한다.

SVG sanitization (`sanitizeInlineSvgMarkup`)은 인라인 SVG 마크업에 대해:
- 16KB 크기 제한
- `<script>`, `<style>`, `<foreignObject>` 태그 제거
- `on*` 이벤트 핸들러 속성 제거

## 9) 개발자 경험 (DX)

Magam은 코드가 소스 오브 트루스인 프로그래매틱 화이트보드다. 소재 적용은 **TSX 코드 작성으로만** 수행하며, 캔버스 위 시각적 편집 UI는 제공하지 않는다.

### 소재 적용 방식

사용자 또는 AI가 TSX 파일에서 `pattern` prop과 헬퍼 함수를 사용해 소재를 지정한다:

```tsx
import { Sticky, WashiTape, preset, solid } from "@magam/core"

<Sticky id="m" text="메모" x={10} y={10} pattern={preset('kraft-grid')} />
<WashiTape id="t" x={10} y={50} width={200} pattern={preset('pastel-dots')} />
```

### DX 설계 목표

- **IDE 자동완성**: `preset('` 입력 시 등록된 프리셋 ID 목록이 자동완성된다.
- **컴파일 타임 검증**: 미등록 프리셋 ID, 잘못된 타입 조합은 TypeScript 오류로 즉시 검출된다.
- **헬퍼 함수 가이드**: `preset()`, `svg()`, `image()`, `solid()` 4가지 헬퍼만 기억하면 모든 소재를 적용할 수 있다.
- **기본값 생략**: `pattern` 미지정 시 컴포넌트별 기본 프리셋이 자동 적용되므로, 소재가 불필요한 경우 prop을 생략하면 된다.

### 에러 처리

| 상황 | 동작 |
|------|------|
| 미등록 프리셋 ID (내부) | TypeScript 컴파일 오류 |
| 미등록 프리셋 ID (외부) | `resolveWashiPattern` → 기본 프리셋 fallback + `debugReason` 설정 |
| 무효 SVG 문자열 | 렌더 시 `MagamError` throw, 콘솔 경고 |
| 이미지 로드 실패 | 클라이언트에서 기본 프리셋으로 fallback |

## 10) 비기능 요구사항

- 성능: 동일 화면에 포스트잇 100개 배치 시 기본 이동/편집이 체감 지연 없이 동작
- 안정성: undo/redo에서 소재 타입 전환 이력 정확히 복원
- 변경 유연성: 실험 단계에서 패턴 API 변경을 빠르게 반영 가능
- 품질: 내보내기 PNG/SVG/PDF의 시각 일관성 유지

## 11) 컨셉 에셋 레퍼런스

- 컨셉 문서: `docs/concepts/journaling/README.md`
- 컴포넌트 기준:
  - `docs/concepts/journaling/components/postit.html`
  - `docs/concepts/journaling/components/lined-paper.html`
  - `docs/concepts/journaling/components/kraft-paper.html`
- 이미지 레퍼런스:
  - `docs/concepts/journaling/images/postit1.png`
  - `docs/concepts/journaling/images/postit2.png`
  - `docs/concepts/journaling/images/postit3.png`
  - `docs/concepts/journaling/images/postit4.png`
  - `docs/concepts/journaling/images/linenote.png`
  - `docs/concepts/journaling/images/gridnote.png`
  - `docs/concepts/journaling/images/craft.png`

## 12) 단계별 구현 계획

1. 데이터 모델/타입 계약
- `PaperMaterial` Union 타입, `pattern` 프롭 계약, helper 함수 API 정의

2. 렌더링 계층 확장
- `preset/svg/image/solid` 분기 렌더 구현
- 모양(heart/cloud/speech) 마스크와 텍스트 레이아웃 보정

3. 품질 검증
- PNG/SVG/PDF 결과 비교
- 성능/회귀 테스트 추가

## 13) 성공 지표

- 소재 프리셋 사용률: 포스트잇 생성 중 기본 외 소재 선택 비율 40% 이상
- 사용자 작업 시간: "메모 강조 스타일 적용" 평균 시간 30% 단축
- 시각 만족도: 내부 QA/사용자 피드백에서 소재 다양성 만족도 4.0/5 이상
- 회귀 안정성: 패턴/모양 조합 렌더 오류 0건
