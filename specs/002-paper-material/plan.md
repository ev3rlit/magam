# Implementation Plan: Paper Material Expansion

**Branch**: `002-paper-material` | **Date**: 2026-03-02 | **Spec**: `/Users/danghamo/Documents/gituhb/magam-feature-paper-materials/specs/002-paper-material/spec.md`
**Input**: Feature specification from `/specs/002-paper-material/spec.md` and `docs/features/paper-material/README.md`

## Summary

Sticky/Washi 공용 소재 시스템을 `PaperMaterial` 중심으로 정규화하고, Sticky 기본 preset을 `postit`으로 고정한다. 핵심 접근은 `@magam/core/material` 레지스트리 확장(11 presets), fallback/검증 로직의 공용화, `at.target` EmbedScope 해석 확장, Sticky의 `pattern`/`at` 파이프라인 및 하위호환 브릿지(`color`, `anchor/*`) 도입이다. 목표는 save/reopen/export 일관성과 무중단 fallback 보장을 유지하면서 타입 안전성을 강화하는 것이다.

## Technical Context

**Language/Version**: TypeScript 5.9.x, React 18, Bun 1.x workspace runtime  
**Primary Dependencies**: React Flow 11, Next.js app runtime, `@babel/*` AST patcher, Tailwind CSS, `@magam/core` material helpers, optional `zod` runtime validation  
**Storage**: TSX source-based graph AST + client runtime state(zustand), 신규 DB 저장소 없음  
**Testing**: `bun test` (core/app/ws/unit), renderer/reconciler 테스트, 패턴 fallback 회귀 테스트  
**Target Platform**: 브라우저 기반 canvas editor + Bun local server  
**Project Type**: 모노레포(웹 앱 + core renderer 라이브러리 + ws patch workflow)  
**Performance Goals**: 100개 이상 Sticky/Washi 혼합 장면에서 체감 지연 없이 이동/선택 동작 유지, 저장/재열기 보존율 100%  
**Constraints**: Sticky 기본 preset=`postit`, Washi 기본 preset 회귀 금지, invalid pattern 입력에서 throw 금지, v1에서 inspector 기반 소재 편집 미포함  
**Scale/Scope**: core material/contracts + app parser/node renderer + anchor resolver + ws patch 경로 + 관련 테스트까지 엔드투엔드 통합

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase-0 Gate

- **I. Think Before Coding**: README 요구사항과 기존 구현 차이(`Sticky pattern 미지원`, `at.target 미스코프`)를 식별하고 연구 항목으로 분해함.
- **II. Simplicity First**: 신규 시스템을 만들지 않고 기존 `material`, `washiPattern`, `anchorResolver`를 확장하는 방향으로 결정.
- **III. Surgical Changes**: 핵심 터치포인트를 `libs/core/src/material/*`, `resolveTreeAnchors`, `app parser/node/ws`로 제한.
- **IV. Goal-Driven Execution**: 완료 조건을 “preset 11종 계약 + fallback 매트릭스 + scoping 회귀 테스트 통과”로 정의.
- **Technical Constraints**: Bun 기반 실행, path alias, core component model(비 DOM), zustand 단일 스토어 원칙을 모두 준수.

결과: **PASS**

### Post-Phase-1 Re-check

- `research.md`에서 모든 clarifications 해소.
- `data-model.md`에서 엔티티/검증/전이 정의 완료.
- `contracts/`에서 host/RPC 경계 명시 완료.
- `quickstart.md`에서 구현/검증 절차 고정.

결과: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/002-paper-material/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── paper-material-host-node-contract.md
│   └── paper-material-rpc-contract.md
└── tasks.md              # /speckit.tasks 단계에서 생성
```

### Source Code (repository root)

```text
libs/core/src/
├── material/
│   ├── presets.ts
│   ├── types.ts
│   └── helpers.ts
├── components/
│   ├── Sticky.tsx
│   ├── WashiTape.tsx
│   └── WashiTape.helpers.ts
└── reconciler/
    ├── resolveTreeAnchors.ts
    └── resolveTreeAnchors.spec.ts

app/
├── app/page.tsx
├── components/
│   ├── GraphCanvas.tsx
│   └── nodes/
│       ├── StickyNode.tsx
│       └── WashiTapeNode.tsx
├── utils/
│   ├── anchorResolver.ts
│   ├── washiTapeDefaults.ts
│   ├── washiTapePattern.ts
│   └── washiTapePattern.test.ts
└── ws/
    ├── methods.ts
    └── filePatcher.ts
```

**Structure Decision**: 기존 모노레포 구조를 유지하고 `core material -> renderer scope resolution -> app parser/node -> ws patch`의 단일 파이프라인을 확장한다. 분리 서비스/새 저장소는 도입하지 않는다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 없음 | N/A | N/A |
