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
  source?: string;
  children?: DemoExampleNode[];
}

export interface ExampleRepository {
  listTree(): Promise<DemoExampleNode[]>;
  readSource(path: string): Promise<string>;
}

export interface DemoHomeModel {
  tree: DemoExampleNode[];
  selectedPath: string;
  selectedSource: string;
  selectedTitle: string;
  uiMode: DemoUiMode;
  previewStatus: DemoPreviewStatus;
  allowedPackages: string[];
  blockedCapabilities: string[];
  followupTracks: string[];
}
