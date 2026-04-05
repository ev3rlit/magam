/**
 * Role: mount an editor implementation without coupling the demo to a specific library.
 * Responsibility: expose editor lifecycle and text I/O for TSX editing.
 * Non-responsibility: document persistence, preview rendering, or diagnostics formatting.
 */

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
