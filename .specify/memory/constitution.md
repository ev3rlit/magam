<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0 (initial ratification)

  Added principles:
    - I. Think Before Coding
    - II. Simplicity First
    - III. Surgical Changes
    - IV. Goal-Driven Execution

  Added sections:
    - Technical Constraints (neverthrow, monorepo conventions)
    - Development Workflow (verification, commit discipline)
    - Governance

  Removed sections: N/A (initial creation)

  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible (Constitution Check
      section uses generic gates — no changes needed)
    - .specify/templates/spec-template.md ✅ compatible (user-story and
      requirements structure aligns with Goal-Driven Execution)
    - .specify/templates/tasks-template.md ✅ compatible (phase structure
      and parallel markers align with principles)
    - .specify/templates/checklist-template.md ✅ compatible (generic)
    - .specify/templates/agent-file-template.md ✅ compatible (generic)

  Follow-up TODOs: None
-->

# Magam Constitution

## Core Principles

### I. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what is confusing. Ask.

**Rationale**: Ambiguity resolved after implementation costs 5–10x more
than ambiguity resolved before. Surfacing confusion early prevents
rework and misaligned code.

### II. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that was not requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite to 50.

Litmus test: "Would a senior engineer say this is overcomplicated?"
If yes, simplify.

**Rationale**: Unnecessary complexity is the primary source of bugs,
maintenance burden, and onboarding friction. Every line of code is a
liability until proven otherwise.

### III. Surgical Changes

**Touch only what you MUST. Clean up only your own mess.**

When editing existing code:
- Do NOT "improve" adjacent code, comments, or formatting.
- Do NOT refactor things that are not broken.
- Match existing style, even if you would do it differently.
- If you notice unrelated dead code, mention it — do not delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Do NOT remove pre-existing dead code unless asked.

Validation: every changed line MUST trace directly to the user's
request.

**Rationale**: Incidental changes inflate diffs, obscure intent, and
introduce regression risk in code the author did not intend to modify.

### IV. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" becomes "Write tests for invalid inputs, then
  make them pass."
- "Fix the bug" becomes "Write a test that reproduces it, then make
  it pass."
- "Refactor X" becomes "Ensure tests pass before and after."

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria enable independent looping. Weak criteria
("make it work") require constant clarification.

**Rationale**: Without explicit exit conditions, implementation drifts,
scope creeps, and "done" becomes subjective. Verifiable goals keep
work focused and measurable.

## Technical Constraints

The following constraints are non-negotiable across the Magam codebase:

- **Error handling**: `@magam/core` uses `neverthrow` (Result/ResultAsync
  monads). Functions MUST return `Result<T, E>` instead of throwing.
  New code in `@magam/core` MUST follow this pattern.
- **Monorepo conventions**: Use path aliases (`@magam/core`,
  `@magam/shared`, etc.) defined in `tsconfig.base.json`. Each lib
  uses `tsup` for bundling (CJS + ESM + DTS).
- **Component model**: Magam components (`Canvas`, `Node`, `Edge`,
  etc.) are processed by a custom React Reconciler — they do NOT
  produce DOM elements. Code that assumes DOM output is incorrect.
- **State management**: Zustand store at `app/store/graph.ts`. Do NOT
  introduce competing state management without explicit approval.
- **Runtime**: Bun is the package manager and script runner. Use `bun`
  commands, not `npm` or `yarn`.

## Development Workflow

- **Verification before completion**: Every task MUST have a
  verification step (test, manual check, or build confirmation)
  before being marked complete.
- **Commit discipline**: Commit after each logically complete unit of
  work. Commit messages follow conventional commits format
  (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- **Diff hygiene**: Diffs MUST contain only changes relevant to the
  task. Formatting-only changes, unrelated refactors, and
  speculative improvements are prohibited unless explicitly requested.
- **Bias toward caution**: These guidelines bias toward caution over
  speed. For trivial tasks, use judgment — but when in doubt, slow
  down.

## Governance

- This constitution supersedes conflicting ad-hoc practices. When a
  conflict arises, the constitution is authoritative.
- Amendments require: (1) documented rationale, (2) owner approval,
  (3) version bump per semantic versioning rules below.
- **Versioning policy**:
  - MAJOR: Backward-incompatible principle removals or redefinitions.
  - MINOR: New principle/section added or materially expanded.
  - PATCH: Clarifications, wording, typo fixes, non-semantic changes.
- Compliance review: All PRs and code reviews SHOULD verify adherence
  to these principles. Violations MUST be flagged, not silently
  accepted.
- Runtime development guidance lives in `CLAUDE.md` at the repo root
  and in per-folder `CLAUDE.md` files. Those files MUST remain
  consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-03-01 | **Last Amended**: 2026-03-01
