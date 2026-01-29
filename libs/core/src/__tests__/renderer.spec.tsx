// @ts-nocheck
import * as React from 'react';
import { renderToGraph } from '../renderer';
import { Sticky } from '../components/Sticky';
import { Edge } from '../components/Edge';
import { Group } from '../components/Group';
import { MindMap } from '../components/MindMap';
import { Node } from '../components/Node';

describe('GraphWrite Renderer', () => {
  it('should render a simple tree to JSON', async () => {
    const element = (
      <canvas>
        <Sticky id="1" text="Hello" />
      </canvas>
    );

    const result = await renderToGraph(element);

    expect(result).toEqual({
      type: 'root',
      children: [
        {
          type: 'canvas',
          props: { children: expect.anything() },
          children: [
            {
              type: 'graph-sticky',
              props: { id: '1', text: 'Hello' },
              children: [],
            },
          ],
        },
      ],
    });
  });

  it('should implicitly set "from" prop for Edge nested in Sticky', async () => {
    const element = (
      <canvas>
        <Sticky id="A" text="Source">
          <Edge to="B" />
        </Sticky>
      </canvas>
    );

    const result = await renderToGraph(element);

    expect(result).toMatchObject({
      type: 'root',
      children: [
        {
          type: 'canvas',
          children: [
            {
              type: 'graph-sticky',
              props: { id: 'A' },
              children: [
                {
                  type: 'graph-edge',
                  props: { from: 'A', to: 'B' },
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('should implicitly set "parentId" and "extent" for children of Group', async () => {
    const element = (
      <canvas>
        <Group id="G1">
          <Sticky id="S1" text="Inside" />
        </Group>
      </canvas>
    );

    const result = await renderToGraph(element);

    expect(result).toMatchObject({
      type: 'root',
      children: [
        {
          type: 'canvas',
          children: [
            {
              type: 'graph-group',
              props: { id: 'G1' },
              children: [
                {
                  type: 'graph-sticky',
                  props: { id: 'S1', parentId: 'G1', extent: 'parent' },
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('should apply ELK layout to MindMap children (assign x, y)', async () => {
    const element = (
      <canvas>
        <MindMap id="root">
          <Node id="1" text="Root" />
          <Node id="2" text="Child" />
          <Edge from="1" to="2" />
        </MindMap>
      </canvas>
    );

    const result = await renderToGraph(element);

    const findNode = (id: string) => {
      const mindmap = result.children[0].children[0];
      return mindmap.children.find((c: any) => c.props.id === id);
    };

    const node1 = findNode('1');
    const node2 = findNode('2');

    expect(node1.props.x).toBeDefined();
    expect(node1.props.y).toBeDefined();
    expect(node2.props.x).toBeDefined();
    expect(node2.props.y).toBeDefined();

    expect(result).toMatchObject({
      type: 'root',
      children: [
        {
          type: 'canvas',
          children: [
            {
              type: 'graph-mindmap',
              children: [
                { type: 'graph-sticky', props: { id: '1', text: 'Root' } },
                { type: 'graph-sticky', props: { id: '2', text: 'Child' } },
                { type: 'graph-edge', props: { from: '1', to: '2' } },
              ],
            },
          ],
        },
      ],
    });
  });

  it('should propagate errors from the render phase', async () => {
    const ThrowingComponent = () => {
      throw new Error('Test Error');
    };

    const element = (
      <canvas>
        <ThrowingComponent />
      </canvas>
    );

    await expect(renderToGraph(element)).rejects.toThrow('Test Error');
  });
});
