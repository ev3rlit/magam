---
title: ADR-0003 Unified `at` Positioning System
date: 2026-03-02
status: proposed
authors:
  - platform-team
tags:
  - adr
  - positioning
  - anchor
  - at
  - sticky
  - washi-tape
  - layout
aliases:
  - Unified Positioning ADR
  - at 위치 통합 ADR
---

# ADR-0003: Unified `at` Positioning System

## Context

현재 Magam 컴포넌트들의 위치 지정 방식이 세 가지로 분산되어 있다.

### 1. 절대 좌표 (`x, y`)

모든 컴포넌트가 지원하는 가장 기본적인 방식.

```tsx
<Sticky id="s1" text="메모" x={100} y={200} />
<Shape id="a" type="circle" x={100} y={100} />
```

### 2. 분산 anchor props (Shape, Text)

`anchor`, `position`, `gap`, `align` — 4개 props가 흩어져 있다.

```tsx
<Shape id="b" type="circle" anchor="a" position="right" gap={60} align="center" />
<Text id="t" text="설명" anchor="b" position="bottom" gap={20} />
```

### 3. 구조체 `at` prop (WashiTape)

`at` prop 하나에 3가지 모드(`segment`, `polar`, `attach`)를 담은 discriminated union.

```tsx
<WashiTape id="t1" at={segment({ x: 0, y: 0 }, { x: 200, y: 0 })} />
<WashiTape id="t2" at={polar(100, 200, 150, -3)} />
<WashiTape id="t3" at={attach({ target: 'card-1', placement: 'top' })} />
```

### 문제

이 세 가지 방식이 공존하면서 다음 문제가 발생한다.

1. **API 비일관성**: Shape/Text는 `anchor` + `position` + `gap` + `align` 4개 props, WashiTape는 `at` 구조체. 같은 "상대 위치 지정"을 전혀 다른 형태로 표현한다.
2. **Sticky 위치 제약**: Sticky는 `x, y` 절대 좌표만 지원한다. 다른 노드 옆에 메모를 배치하려면 좌표를 직접 계산해야 한다.
3. **anchor와 attach의 의미 중복**: Shape의 `anchor="a" position="right"`와 WashiTape의 `attach({ target: 'a', placement: 'right' })`는 본질적으로 같은 일(기준 노드 상대 배치)을 한다. 그러나 이름, 구조, 해석 경로가 모두 다르다.
4. **확장 비용**: 신규 컴포넌트(Envelope, FilmStrip 등)를 추가할 때마다 "어떤 위치 지정 방식을 채택할 것인가"를 반복 결정해야 한다.

### 핵심 인식

ADR-0002에서 소재 시스템을 컴포넌트로부터 분리한 것과 같은 논리가 위치 지정에도 적용된다.

**Sticky, WashiTape, Shape는 각자 고유한 시각적 특성을 가진 컴포넌트일 뿐이다. 레이아웃과 배치는 컴포넌트의 시각적 특성이 아니라 범용 기능이다.** 따라서 위치 지정 시스템은 컴포넌트에 종속되지 않는 공유 모듈로 관리하는 것이 유리하다.

소재가 `pattern` 하나로 통합되었듯, 위치도 `at` 하나로 통합해야 한다.

## Decision

위치 지정 시스템을 `at` prop 기반 단일 구조체로 통합한다. 기존 `anchor/position/gap/align` 분산 패턴은 `at={anchor(...)}` 모드로 흡수한다.

### 1. `at` prop을 범용 위치 지정 진입점으로 사용

```tsx
// 모든 컴포넌트에서 동일한 at prop + 헬퍼 사용
<Sticky id="s" text="메모" at={anchor('node-1', { position: 'bottom', gap: 20 })} />
<Shape id="b" type="circle" at={anchor('a', { position: 'right', gap: 60 })} />
<WashiTape id="t" at={attach({ target: 'card', placement: 'top' })} />
```

### 2. `AtDef` discriminated union

```ts
type AtDef = AnchorAt | AttachAt | PolarAt | SegmentAt;
```

| 모드 | 의미 | 헬퍼 |
|------|------|------|
| `AnchorAt` | 기준 노드 상대 배치 ("옆에 놓기") | `anchor(target, opts?)` |
| `AttachAt` | 대상 노드에 부착 ("위에 붙이기") | `attach(opts)` |
| `PolarAt` | 중심점 + 각도 + 길이 | `polar(x, y, length, angle?)` |
| `SegmentAt` | 두 점 잇기 | `segment(from, to)` |

### 3. 컴포넌트별 지원 매트릭스

모든 모드가 모든 컴포넌트에 적합하지는 않다. 컴포넌트가 지원하는 모드를 타입으로 제한한다.

| 모드 | Sticky | Shape | Text | WashiTape |
|------|--------|-------|------|-----------|
| `x, y` | O | O | O | O |
| `anchor()` | O (신규) | O (마이그레이션) | O (마이그레이션) | O |
| `attach()` | O (신규) | — | — | O |
| `polar()` | — | — | — | O |
| `segment()` | — | — | — | O |

### 4. anchor vs attach 의미 구분

두 모드는 "기준 노드 참조"라는 공통점이 있지만 의미가 다르다.

- **anchor**: "옆에 배치". 기준 노드와의 간격(`gap`)을 유지하며 독립적으로 존재한다. Shape 옆에 Shape를 놓거나, Sticky를 Shape 아래에 배치하는 용도.
- **attach**: "위에 부착". 대상 노드에 밀착/겹침된다. WashiTape를 카드 위에 붙이거나, Sticky를 보드 위에 직접 부착하는 용도.

### 5. Fallback 우선순위

```
at 지정 → at 사용
at 없음 + x,y 지정 → 절대 좌표 사용
at 없음 + x,y 없음 → MagamError (위치 필수 컴포넌트), 또는 기본 위치 (선택적)
```

### 6. EmbedScope 연동

`at` 내부의 `target` 문자열은 기존 `resolveTreeAnchors`의 스코프 해석 대상에 포함된다.

```tsx
<EmbedScope id="auth">
  <Shape id="login" type="rectangle" x={100} y={100} />
  <Sticky id="note" text="로그인 주석" at={anchor('login', { position: 'right' })} />
  {/* target 'login' → 'auth.login'으로 해석 */}
</EmbedScope>
```

### 7. 하위 호환

- Shape/Text의 기존 `anchor` prop은 유지한다. 내부에서 `AnchorAt` 객체로 변환한다.
- `at`과 `anchor`가 동시 지정되면 `at`이 우선한다.
- Sticky는 처음부터 `at` 패턴만 지원한다 (분산 `anchor` prop 없음).

## Target Shape

```text
@magam/core
├── at/
│   ├── types.ts           # AtDef union (AnchorAt | AttachAt | PolarAt | SegmentAt)
│   └── helpers.ts         # anchor(), attach(), polar(), segment()
├── material/
│   ├── types.ts           # PaperMaterial union
│   ├── presets.ts         # MATERIAL_PRESET_REGISTRY
│   └── helpers.ts         # preset(), svg(), image(), solid()
├── components/
│   ├── Sticky.tsx         # pattern?: PaperMaterial, at?: AtDef
│   ├── Shape.tsx          # at?: AtDef (+ legacy anchor/position/gap/align)
│   ├── Text.tsx           # at?: AtDef (+ legacy anchor/position/gap/align)
│   └── WashiTape.tsx      # pattern?: PaperMaterial, at?: AtDef
└── index.ts               # 컴포넌트 + 소재 + 위치 헬퍼 모두 re-export
```

## Rationale

### 1. 배치는 컴포넌트 특성이 아니라 범용 기능이다

Sticky는 포스트잇 시각, WashiTape는 테이프 시각을 담당한다. 하지만 "다른 노드 옆에 놓기"는 어느 컴포넌트에서든 필요한 범용 기능이다. ADR-0002에서 소재 시스템을 `material/` 모듈로 분리한 것과 같은 원칙을 위치 지정에도 적용한다.

### 2. 구조체가 분산 props보다 낫다

```tsx
// 분산: 4개 props, 어떤 것이 anchor 관련인지 파악 어려움
<Shape anchor="a" position="right" gap={60} align="center" fill="#fff" />

// 구조체: at 하나에 위치 의도 집약
<Shape at={anchor('a', { position: 'right', gap: 60 })} fill="#fff" />
```

구조체 방식의 장점:
- 위치 관련 속성이 하나의 객체로 응집되어 의도가 명확하다.
- 헬퍼 함수로 타입 안전성과 IDE 자동완성을 확보한다.
- 직렬화 시 위치 정보가 하나의 필드로 깔끔하게 저장된다.
- 새로운 위치 모드 추가 시 union 분기만 확장하면 된다.

### 3. 소재와 위치의 대칭적 설계

```tsx
<Sticky
  id="note"
  text="주석"
  pattern={preset('kraft-grid')}               // 소재: 무엇으로 보이는가
  at={anchor('target', { position: 'bottom' })} // 위치: 어디에 놓이는가
/>
```

`pattern`과 `at`이 동일한 패턴(단일 prop + 헬퍼 함수 + discriminated union)을 따르므로 API를 배우는 비용이 줄어든다.

## Alternatives Considered

### A. Sticky에만 기존 anchor 패턴 추가

```tsx
<Sticky id="s" anchor="node-1" position="bottom" gap={20} />
```

- 장점: Shape/Text와 일관됨, 구현 최소
- 단점: 이미 문제가 있는 분산 패턴을 확산시킴. WashiTape의 `at`과 이중 표준 지속
- 결론: 비채택 — 문제를 해결하지 않고 확대함

### B. WashiTape의 `at`을 anchor 방식으로 전환

```tsx
<WashiTape id="t" anchor="card" placement="top" span={0.6} />
```

- 장점: 기존 anchor 패턴 통일
- 단점: WashiTape의 `segment`, `polar` 같은 복합 기하 모드를 분산 props로 표현하면 API가 크게 복잡해짐. ADR-0001에서 `at` 구조체를 채택한 이유(직렬화, 모드 분리)가 무효화됨
- 결론: 비채택 — 분산 패턴이 복합 기하에 부적합

### C. 통합하되 새 이름 도입 (`placement`, `position` 등)

- 장점: 기존 API와 네이밍 충돌 없음
- 단점: WashiTape에 이미 `at`이 사용 중이므로 불필요한 혼란. `at`이 이미 검증된 패턴
- 결론: 비채택 — `at`을 그대로 확장하는 것이 단순

### D. (채택) `at` 구조체로 통합

- 장점: API 일관성, 타입 안전성, 확장 용이, 소재 시스템(`pattern`)과 대칭적 설계
- 단점: Shape/Text의 기존 `anchor` prop 마이그레이션 경로 필요
- 결론: 최종 채택

## Consequences

### Positive

- **API 일관성**: 모든 컴포넌트가 같은 `at` + 헬퍼 패턴으로 위치를 지정한다
- **Sticky 기능 확장**: 절대 좌표 전용이던 Sticky가 상대 배치, 부착을 지원한다
- **학습 비용 절감**: `pattern` (소재) + `at` (위치) 두 개의 일관된 패턴만 익히면 된다
- **확장성**: 신규 컴포넌트는 `at?: AtDef`만 추가하면 위치 지정 기능을 즉시 획득한다
- **직렬화 안정성**: 위치 정보가 단일 JSON-직렬화 가능 객체로 저장된다

### Negative

- Shape/Text의 기존 `anchor` prop 하위 호환 브릿지 유지 필요
- `resolveTreeAnchors` 후처리 확장 필요 (`at.target` 스코프 해석)
- WashiTape의 기존 `at` 타입에 `AnchorAt` 모드 추가 시 타입 확장 작업

## Follow-up

1. `at/` 모듈 스캐폴딩 (types.ts, helpers.ts)
2. Sticky에 `at` prop 추가 및 `anchor`/`attach` 모드 구현
3. `resolveTreeAnchors` 확장: `at.target` 스코프 해석
4. Shape/Text의 기존 `anchor` prop → 내부 `AnchorAt` 변환 브릿지
5. WashiTape `AtDef`에 `AnchorAt` 모드 추가
6. 클라이언트 레이아웃 엔진에서 `AnchorAt`/`AttachAt` 좌표 계산 로직 구현
