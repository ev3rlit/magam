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

  assert.equal(typeof parsed.canvasBackground === 'object' && parsed.canvasBackground?.type, 'custom');
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

test('parseDemoPreviewGraph creates edges for mindmap nodes connected with from props', () => {
  const parsed = parseDemoPreviewGraph({
    graph: {
      type: 'root',
      children: [
        {
          type: 'graph-mindmap',
          props: {
            id: 'map',
            layout: 'bidirectional',
          },
          children: [
            {
              type: 'graph-node',
              props: {
                id: 'root',
              },
              children: [
                {
                  type: 'graph-markdown',
                  props: {
                    content: '# Root',
                  },
                },
              ],
            },
            {
              type: 'graph-node',
              props: {
                id: 'child',
                from: 'root',
              },
              children: [
                {
                  type: 'graph-markdown',
                  props: {
                    content: 'Child',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    sourceVersion: null,
  });

  assert.deepEqual(parsed.edges, [
    {
      id: 'demo-preview-edge-1',
      source: 'map.root',
      target: 'map.child',
      type: 'default',
      style: {
        stroke: '#94a3b8',
        strokeWidth: 2,
      },
    },
  ]);
});

test('parseDemoPreviewGraph resolves sticky, sticker, and washi tape preview nodes', () => {
  const parsed = parseDemoPreviewGraph({
    graph: {
      type: 'root',
      children: [
        {
          type: 'graph-sticky',
          props: {
            id: 'todo',
            x: 120,
            y: 80,
            width: 240,
            height: 180,
            pattern: { type: 'preset', id: 'postit' },
          },
          children: [
            {
              type: 'graph-markdown',
              props: {
                content: '# Todo\n\n- ship preview support',
              },
            },
          ],
        },
        {
          type: 'graph-sticker',
          props: {
            id: 'pin',
            anchor: 'todo',
            position: 'top-right',
            gap: -8,
            rotation: 12,
          },
          children: [
            {
              type: 'text',
              props: {
                text: '📌',
              },
            },
          ],
        },
        {
          type: 'graph-washi-tape',
          props: {
            id: 'banner',
            at: {
              type: 'attach',
              target: 'todo',
              placement: 'top',
              span: 0.5,
              align: 0.5,
              offset: 4,
              thickness: 20,
            },
            pattern: { type: 'solid', color: '#fde68a' },
          },
          children: [
            {
              type: 'text',
              props: {
                text: 'hello',
              },
            },
          ],
        },
      ],
    },
    sourceVersion: null,
  });

  const sticky = parsed.nodes.find((node) => node.id === 'todo');
  const sticker = parsed.nodes.find((node) => node.id === 'pin');
  const washi = parsed.nodes.find((node) => node.id === 'banner');

  assert.equal(sticky?.data.kind, 'sticky');
  assert.equal(sticker?.data.kind, 'sticker');
  assert.equal(washi?.data.kind, 'washi');
  assert.deepEqual(sticky?.position, { x: 120, y: 80 });
  assert.ok((sticker?.position.x ?? 0) > 240);
  assert.equal(washi?.position.y, 74);
  assert.equal(washi?.height, 20);
});
