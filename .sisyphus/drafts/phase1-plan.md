# Draft: Phase 1 Implementation Plan

## Requirements (confirmed)
- **Goal**: Initialize `graphwrite` (Local-first whiteboard, NestJS + React).
- **Reference**: `prd.md` (Phase 1).
- **Scope**:
    - Project Structure (Monorepo vs Simple).
    - Dependencies.
    - Tasks: NestJS setup, React setup (Vite), WebSocket Gateway, Basic Canvas Store, React Flow scaffolding.

## Open Questions
1. **Monorepo Strategy**: Nx vs Turborepo vs Simple folders? (Recommendation: Nx is standard for NestJS/React).
2. **Phase Definition**: Confirm we are doing both Backend + Frontend skeleton now (crossing PRD Week 1-4 boundaries).
3. **Testing**: Include test setup now?

## Technical Decisions
- **Runtime**: Node.js
- **Server**: NestJS
- **Frontend**: React + Vite (build to static)
- **Communication**: Socket.io
- **State**: Zustand (Client), In-Memory/JSON (Server)
