import type { DemoExampleNode, DemoHomeModel, ExampleRepository } from '@/src/demo/contracts';

const README_EXAMPLE_SOURCE = `import { Canvas, Group, Sticky, Text } from '@magam/core';

export default function ReadmeDemo() {
  return (
    <Canvas width={1280} height={720}>
      <Group x={96} y={92}>
        <Sticky
          title="Browser-first demo"
          content="This placeholder ships with the new apps/web-demo boundary."
          color="#FDE68A"
        />
        <Text x={360} y={28} fontSize={34} weight={700}>
          Demo source and preview stay local to the demo app.
        </Text>
      </Group>
    </Canvas>
  );
}
`;

const STYLING_EXAMPLE_SOURCE = `import { Canvas, Text, WashiTape } from '@magam/core';

export default function StylingDemo() {
  return (
    <Canvas width={1200} height={680} background="#FCF7F0">
      <WashiTape x={90} y={96} width={320} color="#E07A5F" label="future preview shell" />
      <Text x={96} y={196} fontSize={28} weight={700}>
        002-005 can layer explorer, scratch, and browser rendering on this shell.
      </Text>
    </Canvas>
  );
}
`;

const STATIC_DEMO_TREE: DemoExampleNode[] = [
  {
    id: 'examples-root',
    path: 'examples',
    title: 'Examples',
    category: 'collection',
    children: [
      {
        id: 'readme-demo',
        path: 'examples/readme.tsx',
        title: 'Readme playground',
        category: 'Getting started',
        source: README_EXAMPLE_SOURCE,
      },
      {
        id: 'styling-demo',
        path: 'examples/showcase_styling.tsx',
        title: 'Styling preview',
        category: 'Visual language',
        source: STYLING_EXAMPLE_SOURCE,
      },
    ],
  },
];

const DEFAULT_EXAMPLE_PATH = 'examples/readme.tsx';

class StaticExampleRepository implements ExampleRepository {
  constructor(private readonly tree: DemoExampleNode[]) {}

  async listTree(): Promise<DemoExampleNode[]> {
    return this.tree;
  }

  async readSource(path: string): Promise<string> {
    const node = findExampleNode(this.tree, path);

    if (!node?.source) {
      throw new Error(`Unknown demo example source: ${path}`);
    }

    return node.source;
  }
}

export const demoExampleRepository: ExampleRepository = new StaticExampleRepository(STATIC_DEMO_TREE);

export async function getDemoHomeModel(): Promise<DemoHomeModel> {
  const tree = await demoExampleRepository.listTree();
  const selectedNode = findExampleNode(tree, DEFAULT_EXAMPLE_PATH);

  if (!selectedNode?.source) {
    throw new Error(`Missing default demo example: ${DEFAULT_EXAMPLE_PATH}`);
  }

  return {
    tree,
    selectedPath: selectedNode.path,
    selectedTitle: selectedNode.title,
    selectedSource: selectedNode.source,
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
