import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDemoPreviewGraph } from './parse-preview-graph';

test('parseDemoPreviewGraph maps markdown nodes, sequence nodes, and canvas background meta', () => {
  const parsed = parseDemoPreviewGraph({
    graph: {
      type: 'root',
      meta: {
        background: {
          type: 'custom',
          svg: '<line x1="0" y1="10" x2="10" y2="10" stroke="#cbd5e1" />',
          gap: 10,
        },
      },
      children: [
        {
          type: 'graph-node',
          props: {
            id: 'doc',
            x: 10,
            y: 20,
          },
          children: [
            {
              type: 'graph-markdown',
              props: {
                content: '# Title\n\n- one\n- two',
              },
            },
          ],
        },
        {
          type: 'graph-sequence',
          props: {
            id: 'auth',
            x: 0,
            y: 0,
          },
          children: [
            {
              type: 'graph-participant',
              props: {
                id: 'user',
                label: 'User',
              },
            },
            {
              type: 'graph-participant',
              props: {
                id: 'server',
                label: 'Server',
              },
            },
            {
              type: 'graph-message',
              props: {
                from: 'user',
                to: 'server',
                label: 'Login',
              },
            },
          ],
        },
      ],
    },
    sourceVersion: 'demo:1234',
  });

  const markdownNode = parsed.nodes.find((node) => node.id === 'doc');
  const sequenceNode = parsed.nodes.find((node) => node.id === 'auth');

  assert.equal(parsed.canvasBackground?.type, 'custom');
  assert.equal(parsed.sourceVersion, 'demo:1234');
  assert.equal(markdownNode?.data.kind, 'markdown');
  assert.equal(sequenceNode?.data.kind, 'sequence');
});

test('parseDemoPreviewGraph preserves tree and bidirectional mindmap group metadata', () => {
  const parsed = parseDemoPreviewGraph({
    graph: {
      type: 'root',
      children: [
        {
          type: 'graph-mindmap',
          props: {
            id: 'tree-map',
            layout: 'tree',
            spacing: 80,
          },
          children: [],
        },
        {
          type: 'graph-mindmap',
          props: {
            id: 'bidi-map',
            layout: 'bidirectional',
          },
          children: [],
        },
      ],
    },
    sourceVersion: null,
  });

  assert.deepEqual(parsed.mindMapGroups, [
    {
      id: 'tree-map',
      layoutType: 'tree',
      spacing: 80,
      basePosition: { x: 0, y: 0 },
    },
    {
      id: 'bidi-map',
      layoutType: 'bidirectional',
      spacing: 72,
      basePosition: { x: 0, y: 0 },
    },
  ]);
});
