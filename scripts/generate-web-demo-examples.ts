import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  exampleRegistryConfig,
  type ExampleRegistryOverride,
} from '../apps/web-demo/src/demo/example-registry.config';

interface GeneratedExampleNode {
  id: string;
  path: string;
  title: string;
  category: string;
  description?: string;
  children?: GeneratedExampleNode[];
}

type MutableGeneratedExampleNode = GeneratedExampleNode & {
  children?: MutableGeneratedExampleNode[];
};

const DEFAULT_EXAMPLE_PATH = 'examples/readme.tsx';
const ROOT_NODE_ID = 'examples-root';
const ROOT_NODE_PATH = 'examples';

const currentFile = fileURLToPath(import.meta.url);
const workspaceRoot = path.resolve(path.dirname(currentFile), '..');
const outputPath = path.join(
  workspaceRoot,
  'apps',
  'web-demo',
  'src',
  'generated',
  'demo-example-manifest.generated.ts',
);

async function main() {
  const includePaths = validateIncludes(exampleRegistryConfig.include);
  const defaultExamplePath = validateDefaultExamplePath(
    exampleRegistryConfig.defaultExamplePath,
    includePaths,
  );
  const sourceByPath = await buildSourceByPath(includePaths);
  const tree = buildExampleTree(includePaths, exampleRegistryConfig.overrides ?? {});
  const outputSource = renderManifestModule({
    tree,
    sourceByPath,
    defaultExamplePath,
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, outputSource, 'utf8');

  console.log(`Generated web demo example manifest: ${path.relative(workspaceRoot, outputPath)}`);
}

function validateIncludes(include: string[]): string[] {
  const normalized = include.map(normalizeExamplePath);
  const unique = new Set(normalized);

  if (normalized.length === 0) {
    throw new Error('web-demo example registry requires at least one included example.');
  }

  if (unique.size !== normalized.length) {
    throw new Error('web-demo example registry includes duplicate paths.');
  }

  return normalized;
}

function validateDefaultExamplePath(
  configuredDefaultPath: string | undefined,
  includePaths: string[],
): string {
  const defaultExamplePath = normalizeExamplePath(configuredDefaultPath ?? DEFAULT_EXAMPLE_PATH);

  if (!includePaths.includes(defaultExamplePath)) {
    throw new Error(
      `Default example path must be included in the curated registry: ${defaultExamplePath}`,
    );
  }

  return defaultExamplePath;
}

async function buildSourceByPath(includePaths: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    includePaths.map(async (examplePath) => {
      const absolutePath = path.join(workspaceRoot, examplePath);
      const source = await readFile(absolutePath, 'utf8');

      return [examplePath, source] as const;
    }),
  );

  return Object.fromEntries(entries);
}

function buildExampleTree(
  includePaths: string[],
  overrides: Record<string, ExampleRegistryOverride>,
): GeneratedExampleNode[] {
  const root: MutableGeneratedExampleNode = {
    id: ROOT_NODE_ID,
    path: ROOT_NODE_PATH,
    title: 'Examples',
    category: 'collection',
    children: [],
  };

  const folderMap = new Map<string, MutableGeneratedExampleNode>([[ROOT_NODE_PATH, root]]);

  for (const examplePath of includePaths) {
    const segments = examplePath.split('/');
    const fileName = segments.at(-1);

    if (!fileName) {
      throw new Error(`Invalid example path: ${examplePath}`);
    }

    let parentPath = ROOT_NODE_PATH;
    let parentNode = folderMap.get(parentPath);

    if (!parentNode) {
      throw new Error(`Missing root node while building example tree for ${examplePath}`);
    }

    for (const folderName of segments.slice(1, -1)) {
      const folderPath = `${parentPath}/${folderName}`;
      let folderNode = folderMap.get(folderPath);

      if (!folderNode) {
        folderNode = {
          id: createFolderId(folderPath),
          path: folderPath,
          title: toTitleCase(folderName),
          category: 'collection',
          children: [],
        };
        parentNode.children ??= [];
        parentNode.children.push(folderNode);
        folderMap.set(folderPath, folderNode);
      }

      parentPath = folderPath;
      parentNode = folderNode;
    }

    parentNode.children ??= [];
    parentNode.children.push(
      createExampleLeaf({
        examplePath,
        fileName,
        override: overrides[examplePath],
      }),
    );
  }

  return [root];
}

function createExampleLeaf(input: {
  examplePath: string;
  fileName: string;
  override?: ExampleRegistryOverride;
}): GeneratedExampleNode {
  const fileStem = input.fileName.replace(/\.tsx$/, '');
  const pathSegments = input.examplePath.split('/');
  const parentFolder = pathSegments.length > 2 ? pathSegments.at(-2) : undefined;

  return {
    id: createExampleId(input.examplePath),
    path: input.examplePath,
    title: input.override?.title ?? toTitleCase(fileStem),
    category: input.override?.category ?? inferCategory(parentFolder),
    description: input.override?.description,
  };
}

function normalizeExamplePath(examplePath: string): string {
  const normalized = examplePath.replaceAll(path.sep, '/');

  if (!normalized.startsWith('examples/')) {
    throw new Error(`Example path must stay under examples/: ${examplePath}`);
  }

  if (!normalized.endsWith('.tsx')) {
    throw new Error(`Only .tsx example files can be included in the web demo: ${examplePath}`);
  }

  return normalized;
}

function inferCategory(parentFolder: string | undefined): string {
  if (!parentFolder) {
    return 'Examples';
  }

  return toTitleCase(parentFolder);
}

function toTitleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function createFolderId(folderPath: string): string {
  return `folder-${folderPath.replaceAll('/', '-')}`;
}

function createExampleId(examplePath: string): string {
  return `example-${examplePath.replaceAll(/[/.]/g, '-')}`;
}

function renderManifestModule(input: {
  tree: GeneratedExampleNode[];
  sourceByPath: Record<string, string>;
  defaultExamplePath: string;
}): string {
  const serializedTree = JSON.stringify(input.tree, null, 2);
  const serializedSourceMap = JSON.stringify(input.sourceByPath, null, 2);

  return `/* auto-generated by scripts/generate-web-demo-examples.ts */
import type { DemoExampleNode } from '@/src/demo/contracts';

export const demoDefaultExamplePath = ${JSON.stringify(input.defaultExamplePath)} as const;

export const demoExampleTree: DemoExampleNode[] = ${serializedTree};

export const demoExampleSourceByPath: Record<string, string> = ${serializedSourceMap};
`;
}

await main();
