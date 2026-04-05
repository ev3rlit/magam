import type { DemoExampleNode } from './shared';

/**
 * Role: provide read-only access to shipped example files.
 * Responsibility: tree browsing and source reading for the virtual explorer.
 * Non-responsibility: editing, persistence, rendering, or UI state.
 */

export interface ExampleTreeLister {
  listTree(): Promise<DemoExampleNode[]>;
}

export interface ExampleSourceReader {
  readSource(path: string): Promise<string>;
}

export interface ExampleRepository extends ExampleTreeLister, ExampleSourceReader {}
