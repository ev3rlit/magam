# 2026-02-16 — Local AI Chat release-readiness docs pass

## What landed

- Added a short **How to verify locally** checklist to `docs/features/local-ai-chat/README.md`.
- Added concise **TODO / Known limitations** sections to:
  - `docs/features/local-ai-chat/README.md`
  - `docs/features/local-ai-chat/implementation-plan.md`
- Updated smoke-test override example in implementation docs to use `/chat` endpoint by default (matches CLI server route).

## Command/script verification done

Validated references against repository state:

- `bun run dev` (exists in root `package.json`)
- `bun run chat:smoke` (exists in root `package.json`)
- `scripts/chat-smoke.ts` (exists)
- chat endpoints in CLI server (`/chat/providers`, `/chat/send`, `/chat/stop`) exist in `libs/cli/src/server/http.ts`
- Next proxy routes under `app/app/api/chat/*` exist

## Notes

- This pass is docs-only (no runtime behavior change).
