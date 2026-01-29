# Learnings

## Core Library Initialization (Thu Jan 29 2026)

- **Library Generation**: Used `nx g @nx/js:lib core` to create the library. This sets up a basic JS/TS library structure.
- **Dependencies**:
  - Installed `react-reconciler` and `elkjs` as dependencies.
  - Installed `@types/react-reconciler`.
  - Discovered that `elkjs` does not have a separate `@types` package on npm (error 404), but it includes types in its package (`types` field in `package.json` points to `lib/main`).
- **Build Configuration**:
  - Configured `tsup` for building the library.
  - Created `libs/core/tsup.config.ts`.
  - Updated `libs/core/project.json` to use `nx:run-commands` with `tsup` instead of the default `@nx/js:tsc`.
  - Important: Configured `tsup` to output to `dist/libs/core` and explicitly use `libs/core/tsconfig.lib.json`.
- **Verification**: Verified that `nx build core` and `nx test core` pass.
