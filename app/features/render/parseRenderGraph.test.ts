import { describe, expect, it } from 'bun:test';
import { parseRenderGraph } from './parseRenderGraph';

describe('parseRenderGraph mindmap roots', () => {
  it('allows a root node without from and only builds edges for linked nodes', () => {
    const parsed = parseRenderGraph({
      graph: {
        children: [
          {
            type: 'graph-mindmap',
            props: { id: 'map' },
            children: [
              { type: 'graph-node', props: { id: 'root', text: 'Root' }, children: [] },
              { type: 'graph-node', props: { id: 'child', from: 'root', text: 'Child' }, children: [] },
            ],
          },
        ],
      },
    });

    expect(parsed).not.toBeNull();
    expect(parsed!.nodes.map((n) => n.id)).toEqual(['map.root', 'map.child']);
    expect(parsed!.edges).toHaveLength(1);
    expect(parsed!.edges[0]).toMatchObject({
      source: 'map.root',
      target: 'map.child',
    });
  });

  it('supports multiple root nodes in one mindmap', () => {
    const parsed = parseRenderGraph({
      graph: {
        children: [
          {
            type: 'graph-mindmap',
            props: { id: 'map' },
            children: [
              { type: 'graph-node', props: { id: 'root-a', text: 'Root A' }, children: [] },
              { type: 'graph-node', props: { id: 'root-b', text: 'Root B' }, children: [] },
            ],
          },
        ],
      },
    });

    expect(parsed).not.toBeNull();
    expect(parsed!.nodes.map((n) => n.id)).toEqual(['map.root-a', 'map.root-b']);
    expect(parsed!.edges).toHaveLength(0);
  });
});
