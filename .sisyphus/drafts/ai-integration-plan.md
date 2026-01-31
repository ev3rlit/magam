# Draft: AI-Native Integration Plan

## Current Status (Inferred)

- **Core Engine**: Ready (React Reconciler -> Graph).
- **Runtime**: Basic CLI execution exists (esbuild, watch).
- **Frontend**: Canvas renders nodes.
- **Gap**: The "Bridge" between AI (Prompt) and Runtime (Code Execution) might be missing or incomplete.

## Proposed Objectives (To Validate)

1. **Complete the Feedback Loop**: ensure `User edits code (or AI edits)` -> `CLI runs` -> `Socket emits` -> `Frontend updates` works flawlessly.
2. **Implement MCP Server**: Expose the tools listed in README (`add_node`, etc.) so an external Agent can actually drive this.
3. **E2E Demo**: Create a "Hello World" scenario where an AI generates a graph.

## Open Questions

- Is the MCP server already started?
- Does the CLI push to the API, or does the Client pull?
