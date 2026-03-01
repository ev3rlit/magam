# Quickstart: Paper Material (Sticky)

## 목적

`002-paper-material` 기능을 로컬에서 빠르게 구현/검증하기 위한 최소 실행 순서.

## 1) 준비

```bash
cd /Users/danghamo/Documents/gituhb/magam-feature-paper-materials
git checkout codex/diary-paper-materials
bun install
```

## 2) 구현 순서

1. core material 계약 확장
   - `libs/core/src/material/presets.ts`: 11개 preset + 메타(`backgroundSize`) 반영
   - `libs/core/src/material/types.ts`: `MaterialPresetMeta`, `PresetMaterialDef` 확장
   - `libs/core/src/material/helpers.ts`: `preset(id, opts?)` 지원
2. Sticky/Washi 공용 resolver 정리
   - `app/utils/washiTapeDefaults.ts`, `app/utils/washiTapePattern.ts`에서 공용 가능한 material normalize/resolve 로직 정리
   - Sticky 기본 preset=`postit`, Washi 기본 preset=`pastel-dots` 분리 유지
3. Sticky 렌더/파서 확장
   - `app/app/page.tsx`: `graph-sticky`에서 `pattern`, `at` 파싱/정규화
   - `app/components/nodes/StickyNode.tsx`: pattern 기반 background/style 렌더 적용
4. 위치 스코프 규칙 확장
   - `libs/core/src/reconciler/resolveTreeAnchors.ts`: `at.target` 스코프 해석 추가
   - `app/utils/anchorResolver.ts`: Sticky `at` 우선순위(`at > x,y`) 적용
5. WS patch 경로 점검
   - `app/ws/methods.ts`, `app/ws/filePatcher.ts`: `pattern`/`at` round-trip 유지

## 2.1) Implementation Checkpoints

- Checkpoint A: `libs/core/src/material/*` 확장 후 프리셋 ID 11종 컴파일 통과
- Checkpoint B: Sticky 파서/렌더(`app/app/page.tsx`, `app/components/nodes/StickyNode.tsx`)에서 `pattern` 기본값이 `postit`으로 보임
- Checkpoint C: `resolveTreeAnchors`에서 `at.target` 스코프 해석 회귀 테스트 통과
- Checkpoint D: WS update/create 경로에서 Sticky `pattern` object가 손실 없이 round-trip

## 3) 테스트

```bash
# core material + reconciler
bun test libs/core/src/__tests__/washi-tape.helpers.spec.ts \
  libs/core/src/reconciler/resolveTreeAnchors.spec.ts

# app material + resolver
bun test app/utils/washiTapePattern.test.ts app/utils/anchorResolver.test.ts

# ws round-trip
bun test app/ws/methods.test.ts app/ws/filePatcher.test.ts
```

## 4) 수동 검증

1. `bun run dev` 실행 후 Sticky를 생성한다.
2. `pattern` 미지정 Sticky가 `postit` 스타일로 렌더되는지 확인한다.
3. `preset/svg/image/solid` 각각 적용해 fallback 및 렌더 일관성을 확인한다.
4. `at` + `x,y` 동시 지정 시 `at` 우선 동작을 확인한다.
5. 저장/재열기 및 PNG/SVG/PDF 내보내기에서 스타일이 유지되는지 확인한다.

## 5) 완료 기준 체크

- 프리셋 11종이 타입/런타임에서 모두 유효.
- invalid pattern 입력에서 크래시 없이 fallback.
- `at.target` 스코프 해석이 EmbedScope에서 일관되게 동작.
- 기존 Washi preset UX와 `sticker` 편집 경로 회귀 없음.

## 6) 회귀 실행 결과 (2026-03-02)

- `bun test libs/core/src/__tests__/washi-tape.helpers.spec.ts libs/core/src/reconciler/resolveTreeAnchors.spec.ts` → `9 pass / 0 fail`
- `bun test app/utils/washiTapePattern.test.ts app/utils/anchorResolver.test.ts` → `13 pass / 0 fail`
- `bun test app/ws/methods.test.ts app/ws/filePatcher.test.ts` → `18 pass / 0 fail`

## 7) 내보내기 일관성 검증 결과 (2026-03-02)

- `bun test libs/core/src/__tests__/washi-tape.spec.tsx libs/core/src/__tests__/sticker.spec.tsx`에서 PNG/JPG/SVG/PDF 대상 props 보존 케이스 통과 (`8 pass / 0 fail`)
- `bun test app/components/nodes/StickyNode.test.tsx app/app/page.test.tsx app/ws/methods.test.ts app/ws/filePatcher.test.ts`에서 Sticky 파싱/patch round-trip 회귀 통과 (`24 pass / 0 fail`)
- 헤드리스 환경 한계로 브라우저 수동 export 클릭 검증은 미실행 (자동 회귀로 대체)
