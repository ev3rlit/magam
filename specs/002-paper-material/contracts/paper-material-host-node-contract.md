# Contract: Paper Material Host Node

## 목적

코어 렌더러 host tree와 앱 파서 간에 `pattern`/`at` 기반 Sticky 소재 계약을 명시한다.

## Producer / Consumer

- Producer: `libs/core` (`Sticky`, `WashiTape`, material helpers)
- Transport: renderer AST (`graph-sticky`, `graph-washi-tape`)
- Consumer: `app/app/page.tsx` parser + React Flow node builders

## Host Node Types

- `graph-sticky` (기존)
- `graph-washi-tape` (기존)

## Shared Props Contract

| Prop | Required | Type | Notes |
|------|----------|------|-------|
| `id` | Yes | string | scope-resolved ID |
| `pattern` | No | `PaperMaterial` | 신규 표준 소재 입력 |
| `at` | No | `AtDef` | 상대 위치 입력 |
| `x` | Cond | number | `at` 없을 때 필수 |
| `y` | Cond | number | `at` 없을 때 필수 |
| `width` | No | number | 사이즈 힌트 |
| `height` | No | number | 사이즈 힌트 |
| `className` | No | string | 확장 스타일 |

## Compatibility Props (Sticky)

| Prop | Status | Handling |
|------|--------|----------|
| `color` | Legacy keep | `pattern` 미지정 시 `solid(color)`로 정규화 |
| `anchor/position/gap/align` | Legacy keep | `at={anchor(...)}` 형태로 내부 변환 |

## Scoping Contract

1. `id` 스코프 규칙은 기존 `EmbedScope`와 동일하다.
2. `anchor`뿐 아니라 `at.target`도 같은 스코프 해석 규칙을 적용한다.
3. scoped target이 존재하지 않으면 원본 target을 유지한다(교차 스코프 허용).

## Parser Mapping Contract

1. `graph-sticky` 수신 시:
   - `node.type = 'sticky'`
   - `data.pattern`은 정규화된 `PaperMaterial`로 저장
   - `data.at`이 있으면 layout pass에서 위치 계산 우선권을 가진다
2. `graph-washi-tape` 수신 시 기존 계약을 유지하되 공유 material resolver를 사용한다.
3. invalid material 입력은 예외 대신 fallback(`postit` 또는 컴포넌트 기본 preset)으로 렌더한다.

## Validation Rules

- `pattern.type`이 지원 목록이 아니면 fallback + `debugReason`.
- `image.scale`은 0.25~4로 보정.
- `svg.markup`은 sanitize 통과 시만 렌더.
- `at`, `x`, `y` 모두 없으면 개발 단계 오류로 표면화한다.

## Export Contract

- PNG/JPEG/SVG/PDF 경로에서 `pattern` 기반 스타일과 shape 마스크가 캔버스와 시각적으로 일관돼야 한다.
- 저장/재열기 후 preset ID와 fallback 여부가 안정적으로 재현돼야 한다.
