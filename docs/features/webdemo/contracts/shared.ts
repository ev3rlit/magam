/**
 * Role: declare stable cross-contract value shapes for the web demo.
 * Responsibility: shared input/output data only.
 * Non-responsibility: persistence, rendering, or UI behavior.
 */

export type DemoPreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

export type DemoUiMode = 'example-view' | 'scratch-edit' | 'preview-error';

export interface DemoExampleNode {
  id: string;
  path: string;
  title: string;
  category: string;
  source?: string;
  children?: DemoExampleNode[];
}

export interface DemoDiagnostic {
  message: string;
  line?: number;
  column?: number;
  fileName?: string;
}

export interface ScratchDocument {
  documentId: string;
  sourcePath: string;
  source: string;
}
