import type { DemoDiagnostic } from './shared';

/**
 * Role: convert source text into preview-ready graph output for the web demo.
 * Responsibility: accept source and return graph plus diagnostics.
 * Non-responsibility: UI presentation, scratch storage, or editor lifecycle.
 */

export type DemoRenderMode = 'example-view' | 'scratch-edit';

export interface DemoRenderRequest {
  source: string;
  filename: string;
  mode: DemoRenderMode;
}

export interface DemoRenderResponse {
  graph: unknown | null;
  sourceVersion: string | null;
  diagnostics: DemoDiagnostic[];
}

export interface DemoRenderEngine {
  render(input: DemoRenderRequest): Promise<DemoRenderResponse>;
}
