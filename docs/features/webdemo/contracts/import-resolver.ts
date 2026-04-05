/**
 * Role: resolve demo-safe source dependencies for relative imports.
 * Responsibility: map an import request to source text that the render pipeline can consume.
 * Non-responsibility: transpilation, evaluation, or file editing.
 */

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
