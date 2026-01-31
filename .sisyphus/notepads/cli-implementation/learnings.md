# CLI Implementation Learnings

## Transpiler (esbuild)

- Use `esbuild.build` with `write: false` to keep output in memory.
- `outfile` is required even with `write: false` to establish path resolution context for relative imports.
- `platform: 'node'` and `format: 'cjs'` are essential for running the code in the Node.js CLI environment.
- External dependencies (`react`, `graphwrite`) must be marked as external to avoid bundling them.
