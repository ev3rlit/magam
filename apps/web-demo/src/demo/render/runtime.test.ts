import assert from 'node:assert/strict';
import test from 'node:test';
import { renderDemoSourceGraph } from './runtime';

test('renderDemoSourceGraph renders an entry module with relative TSX dependencies', async () => {
  const response = await renderDemoSourceGraph({
    request: {
      filename: 'examples/readme.tsx',
      mode: 'example-view',
      source: `
        import { Canvas } from '@magam/core';
        import Child from './child';

        export default function Example() {
          return (
            <Canvas>
              <Child />
            </Canvas>
          );
        }
      `,
    },
    exampleSourceByPath: {
      'examples/child.tsx': `
        import { Text } from '@magam/core';

        export default function Child() {
          return <Text id="child" x={12} y={24}>Hello</Text>;
        }
      `,
    },
  });

  const graph = response.graph as {
    type?: string;
    children?: Array<{
      type?: string;
      children?: Array<{
        type?: string;
        props?: Record<string, unknown>;
      }>;
    }>;
  };
  const textNode = findNodeByType(graph, 'graph-text');

  assert.equal(response.diagnostics.length, 0);
  assert.match(response.sourceVersion ?? '', /^demo:/);
  assert.equal(graph.type, 'root');
  assert.equal(textNode?.type, 'graph-text');
  assert.equal(textNode?.props?.id, 'child');
});

test('renderDemoSourceGraph normalizes syntax diagnostics', async () => {
  const response = await renderDemoSourceGraph({
    request: {
      filename: 'examples/broken.tsx',
      mode: 'scratch-edit',
      source: 'export default function Broken( { return <div />; }',
    },
    exampleSourceByPath: {},
  });

  assert.equal(response.graph, null);
  assert.equal(response.sourceVersion, null);
  assert.ok(response.diagnostics.length > 0);
  assert.equal(response.diagnostics[0]?.fileName, 'examples/broken.tsx');
});

test('renderDemoSourceGraph reports unsupported imports as diagnostics', async () => {
  const response = await renderDemoSourceGraph({
    request: {
      filename: 'examples/unsupported.tsx',
      mode: 'scratch-edit',
      source: `
        import { Canvas } from '@magam/core';
        import chalk from 'chalk';

        export default function Unsupported() {
          return <Canvas>{chalk.green('nope')}</Canvas>;
        }
      `,
    },
    exampleSourceByPath: {},
  });

  assert.equal(response.graph, null);
  assert.equal(response.sourceVersion, null);
  assert.match(response.diagnostics[0]?.message ?? '', /Unsupported import specifier "chalk"/);
});

function findNodeByType(
  node: {
    type?: string;
    props?: Record<string, unknown>;
    children?: Array<{
      type?: string;
      props?: Record<string, unknown>;
      children?: unknown[];
    }>;
  },
  type: string,
): {
  type?: string;
  props?: Record<string, unknown>;
} | null {
  if (node.type === type) {
    return node;
  }

  for (const child of node.children ?? []) {
    const match = findNodeByType(
      child as {
        type?: string;
        props?: Record<string, unknown>;
        children?: Array<{
          type?: string;
          props?: Record<string, unknown>;
          children?: unknown[];
        }>;
      },
      type,
    );

    if (match) {
      return match;
    }
  }

  return null;
}
