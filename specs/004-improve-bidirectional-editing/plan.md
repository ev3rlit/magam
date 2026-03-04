# Implementation Plan: Focused Bidirectional Editing for Existing Objects

**Branch**: `004-improve-bidirectional-editing` | **Date**: 2026-03-03 | **Spec**: `/Users/danghamo/Documents/gituhb/magam-bidirectional-editing-improvement/specs/004-improve-bidirectional-editing/spec.md`
**Input**: Feature specification from `/specs/004-improve-bidirectional-editing/spec.md` and `docs/features/bidirectional-editing-improvement/README.md`

## Summary

양방향 편집을 "기존 오브젝트의 재편집"으로 축소하고, 세 가지 편집만 안전하게 완성한다: (1) 절대 좌표 노드 이동은 `x`,`y`만 patch, (2) Markdown/텍스트 children 편집은 선택된 오브젝트 1개에 한정하며 Markdown은 현재 렌더러 범위와 1:1 WYSIWYG, (3) attach된 Sticker/Washi Tape는 상대 위치값만 patch한다. 모든 편집 완료 동작은 이벤트 단위로 기록되어 undo/redo 1회가 정확히 1 이벤트만 반영되며, Option A 정책으로 전역 ID 충돌이 감지되면 반영을 거부하고 중복 해결 안내를 제공한다.

## Technical Context

**Language/Version**: TypeScript 5.9.x, React 18, Bun 1.x workspace runtime  
**Primary Dependencies**: Next.js app runtime, React Flow 11, Zustand graph store, `@babel/*` AST patcher, `@magam/core` renderer, markdown renderer stack (`LazyMarkdownRenderer`)  
**Storage**: TSX source file(AST patch 기반) + client runtime state(Zustand), 신규 DB 없음  
**Testing**: `bun test` (ws/mutation/parser/component), 편집 회귀 E2E/통합 테스트, 수동 UX 검증  
**Target Platform**: 브라우저 기반 Magam editor + Bun local WS server  
**Project Type**: 모노레포 웹 애플리케이션(Next.js + ws patch service)  
**Performance Goals**: 스펙 성공 기준(SC-001~SC-011) 충족, 편집 완료 이벤트 처리에서 불필요한 다중 patch/다중 undo 스텝 0건  
**Constraints**: TSX Source of Truth, 최소 diff 원칙(목적 외 prop/구조 변경 금지), 선택 대상 단일 편집 보장, 충돌 시 부분 반영 금지, 전역 ID 유일성 위반 시 반영 거부(Option A), 신규 생성/삭제/재부모화는 범위 밖  
**Scale/Scope**: `app/components/GraphCanvas.tsx`, `app/components/nodes/MarkdownNode.tsx`, `app/components/editor/WorkspaceClient.tsx`, `app/hooks/useFileSync.ts`, `app/store/graph.ts`, `app/ws/methods.ts`, `app/ws/filePatcher.ts`, `app/features/render/parseRenderGraph.ts` 및 관련 테스트

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase-0 Gate

- **I. Think Before Coding**: 기존 코드 경계를 먼저 고정했다(`node.move`, `node.update`, AST patcher, selection store). 미확정 정책(undo 단위, ID 충돌, WYSIWYG 범위)은 스펙 Clarification에서 확정됐다.
- **II. Simplicity First**: 신규 편집 시스템을 만들지 않고 기존 WS RPC + patcher 경로를 재사용한다. 범위를 생성/삭제/재부모화로 확장하지 않는다.
- **III. Surgical Changes**: 변경 대상은 편집 입력(UI) + patch validation + undo/redo 이벤트 계층으로 제한한다. 레이아웃/탭/검색 등 주변 기능은 건드리지 않는다.
- **IV. Goal-Driven Execution**: 성공 기준을 SC-001~SC-011로 수치화했고, 각 요구사항을 단위 테스트/통합 테스트로 역추적 가능하게 설계한다.
- **Technical Constraints**: Bun 워크플로우, Zustand 단일 스토어, AST patch 기반, monorepo alias 규칙 준수.

결과: **PASS**

### Post-Phase-1 Re-check

- `research.md`에서 편집 이벤트 모델, 충돌 정책, WYSIWYG 접근, attach 상대 좌표 patch 방식을 결정했다.
- `data-model.md`에서 편집 대상/이벤트/전역 ID 인덱스 모델과 상태 전이를 정의했다.
- `contracts/`에서 WS mutation 계약과 UI 편집 이벤트 계약을 명시했다.
- `quickstart.md`에서 구현 체크포인트와 정량 검증 시나리오를 실행 가능한 단계로 고정했다.

결과: **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/004-improve-bidirectional-editing/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── bidirectional-editing-rpc-contract.md
│   └── bidirectional-editing-ui-event-contract.md
└── tasks.md              # /speckit.tasks 단계에서 생성
```

### Source Code (repository root)

```text
app/
├── components/
│   ├── GraphCanvas.tsx
│   ├── editor/WorkspaceClient.tsx
│   └── nodes/
│       ├── MarkdownNode.tsx
│       ├── StickerNode.tsx
│       └── WashiTapeNode.tsx
├── features/render/
│   └── parseRenderGraph.ts
├── hooks/
│   └── useFileSync.ts
├── store/
│   └── graph.ts
└── ws/
    ├── methods.ts
    ├── filePatcher.ts
    ├── rpc.ts
    └── server.ts

tests/
├── integration/
├── contract/
└── unit/
```

**Structure Decision**: 기존 Next.js + ws patch 경계를 유지하고, `UI edit intent -> local optimistic state -> WS RPC mutation -> AST patch -> version/event sync` 수직 흐름만 강화한다. 신규 데이터 저장소나 별도 편집 서비스는 도입하지 않는다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 없음 | N/A | N/A |
