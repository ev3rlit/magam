import type { DemoImportDependency, DemoImportResolver } from '@/src/demo/contracts';

const SUPPORTED_DEMO_SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'] as const;

export interface DemoImportResolverOptions {
  exampleSourceByPath: Record<string, string>;
  entryPath: string;
  entrySource: string;
}

export function createDemoImportResolver(
  options: DemoImportResolverOptions,
): DemoImportResolver {
  return {
    async resolve(input) {
      return resolveDemoImportDependency({
        ...options,
        ...input,
      });
    },
  };
}

export function resolveDemoImportDependency(input: DemoImportResolverOptions & {
  importerPath: string;
  specifier: string;
}): DemoImportDependency | null {
  if (!isRelativeDemoImport(input.specifier)) {
    return null;
  }

  for (const candidatePath of resolveDemoImportCandidates(input.importerPath, input.specifier)) {
    const source = readDemoSourceAtPath(input, candidatePath);

    if (source === null) {
      continue;
    }

    return {
      path: candidatePath,
      source,
    };
  }

  return null;
}

export function isRelativeDemoImport(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

export function resolveDemoImportCandidates(importerPath: string, specifier: string): string[] {
  const resolvedBasePath = normalizeDemoPath(
    joinDemoPathSegments(getDemoDirectory(importerPath), specifier.split('/')),
  );

  if (hasSupportedDemoExtension(resolvedBasePath)) {
    return [resolvedBasePath];
  }

  const candidates = SUPPORTED_DEMO_SOURCE_EXTENSIONS.flatMap((extension) => [
    `${resolvedBasePath}${extension}`,
    `${resolvedBasePath}/index${extension}`,
  ]);

  return Array.from(new Set(candidates));
}

function readDemoSourceAtPath(input: DemoImportResolverOptions, path: string): string | null {
  if (path === input.entryPath) {
    return input.entrySource;
  }

  return input.exampleSourceByPath[path] ?? null;
}

function getDemoDirectory(path: string): string {
  const segments = path.split('/');

  return segments.slice(0, -1).join('/');
}

function joinDemoPathSegments(basePath: string, specifierSegments: string[]): string {
  const segments = [...basePath.split('/').filter(Boolean)];

  for (const segment of specifierSegments) {
    if (segment === '.' || segment === '') {
      continue;
    }

    if (segment === '..') {
      segments.pop();
      continue;
    }

    segments.push(segment);
  }

  return segments.join('/');
}

function normalizeDemoPath(path: string): string {
  return path
    .split('/')
    .filter((segment) => segment.length > 0)
    .join('/');
}

function hasSupportedDemoExtension(path: string): boolean {
  return SUPPORTED_DEMO_SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));
}
