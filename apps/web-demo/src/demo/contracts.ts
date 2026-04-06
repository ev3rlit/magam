/**
 * Direction captured for 001-demo-app-boundary:
 * keep web-demo as a separate Next app with local-only contracts and no imports
 * from the existing workspace app, local API proxy routes, or websocket sync flow.
 */

export type DemoPreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

export type DemoUiMode = 'example-view' | 'scratch-edit' | 'preview-error';

export interface DemoExampleNode {
  id: string;
  path: string;
  title: string;
  category: string;
  description?: string;
  children?: DemoExampleNode[];
}

export interface DemoDiagnostic {
  message: string;
  line?: number;
  column?: number;
  fileName?: string;
}

export interface ExampleRepository {
  listTree(): Promise<DemoExampleNode[]>;
  readSource(path: string): Promise<string>;
}

export interface ScratchDocument {
  documentId: string;
  sourcePath: string;
  source: string;
}

export interface ScratchStarter {
  startFromExample(input: {
    path: string;
    source: string;
  }): Promise<ScratchDocument>;
}

export interface ScratchDocumentReader {
  get(documentId: string): Promise<ScratchDocument | null>;
}

export interface ScratchDocumentWriter {
  update(documentId: string, source: string): Promise<void>;
}

export interface ScratchResetter {
  reset(documentId: string, source: string): Promise<void>;
}

export interface ScratchWorkspace
  extends ScratchStarter, ScratchDocumentReader, ScratchDocumentWriter, ScratchResetter {}

export type DemoEditorLanguage = 'tsx';

export interface CodeEditorMountInput {
  element: HTMLElement;
  value: string;
  readOnly: boolean;
  language: DemoEditorLanguage;
  onChange?: (value: string) => void;
}

export interface CodeEditorHandle {
  setValue(value: string): void;
  getValue(): string;
  focus(): void;
  dispose(): void;
}

export interface CodeEditorPort {
  mount(input: CodeEditorMountInput): CodeEditorHandle;
}

export interface DemoImportDependency {
  path: string;
  source: string;
}

export interface DemoImportResolver {
  resolve(input: {
    importerPath: string;
    specifier: string;
  }): Promise<DemoImportDependency | null>;
}

export type DemoSourceTarget =
  | {
      mode: 'example-view';
      path: string;
      source: string;
    }
  | {
      mode: 'scratch-edit';
      path: string;
      documentId: string;
      source: string;
    };

export type DemoRenderMode = DemoSourceTarget['mode'];

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

export interface DemoPreviewState {
  status: DemoPreviewStatus;
  activeTarget: DemoSourceTarget;
  lastCompletedTarget: DemoSourceTarget | null;
  graph: unknown | null;
  sourceVersion: string | null;
  diagnostics: DemoDiagnostic[];
}

export interface DemoHomeModel {
  tree: DemoExampleNode[];
  exampleSourceByPath: Record<string, string>;
  selectedPath: string;
  uiMode: DemoUiMode;
  previewStatus: DemoPreviewStatus;
  allowedPackages: string[];
  blockedCapabilities: string[];
  followupTracks: string[];
}
