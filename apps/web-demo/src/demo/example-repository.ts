import type { DemoExampleNode, DemoHomeModel, ExampleRepository } from '@/src/demo/contracts';
import {
  demoDefaultExamplePath,
  demoExampleSourceByPath,
  demoExampleTree,
} from '@/src/generated/demo-example-manifest.generated';

class GeneratedExampleRepository implements ExampleRepository {
  constructor(
    private readonly tree: DemoExampleNode[],
    private readonly sourceByPath: Record<string, string>,
  ) {}

  async listTree(): Promise<DemoExampleNode[]> {
    return this.tree;
  }

  async readSource(path: string): Promise<string> {
    const source = this.sourceByPath[path];

    if (!source) {
      throw new Error(`Unknown demo example source: ${path}`);
    }

    return source;
  }
}

export const demoExampleRepository: ExampleRepository = new GeneratedExampleRepository(
  demoExampleTree,
  demoExampleSourceByPath,
);

export async function getDemoHomeModel(): Promise<DemoHomeModel> {
  const tree = await demoExampleRepository.listTree();
  const selectedNode = findExampleNode(tree, demoDefaultExamplePath);
  await demoExampleRepository.readSource(demoDefaultExamplePath);

  if (!selectedNode) {
    throw new Error(`Missing default demo example: ${demoDefaultExamplePath}`);
  }

  return {
    tree,
    exampleSourceByPath: demoExampleSourceByPath,
    selectedPath: selectedNode.path,
    uiMode: 'example-view',
    previewStatus: 'idle',
    allowedPackages: ['@magam/core', '@magam/shared'],
    blockedCapabilities: [
      'WorkspaceClient import or wrapper',
      'Next `/api/render`, `/api/files`, `/api/file-tree` fetches',
      'WebSocket or JSON-RPC file sync',
      'chat/session/group/provider/persistence UI',
    ],
    followupTracks: [
      '002 example registry explorer',
      '003 scratch workspace editor',
      '004 browser render engine',
      '005 preview shell and Vercel polish',
    ],
  };
}

export function findExampleNode(
  nodes: DemoExampleNode[],
  targetPath: string,
): DemoExampleNode | null {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node;
    }

    if (!node.children) {
      continue;
    }

    const nestedNode = findExampleNode(node.children, targetPath);

    if (nestedNode) {
      return nestedNode;
    }
  }

  return null;
}
