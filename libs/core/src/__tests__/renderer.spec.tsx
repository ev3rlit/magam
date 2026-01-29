// @ts-nocheck
import * as React from 'react';
import { renderToGraph } from '../renderer';
import { Sticky } from '../components/Sticky';
import { Shape } from '../components/Shape';
import { Text } from '../components/Text';
import { Edge } from '../components/Edge';
import { Group } from '../components/Group';
import { MindMap } from '../components/MindMap';
import { Node } from '../components/Node';
import { GraphwriteError } from '../errors';

describe('GraphWrite Renderer', () => {
  it('should render a simple tree to JSON', async () => {
    const element = (
      <canvas>
        <Sticky id="1" text="Hello" x={10} y={20} />
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
              props: { id: '1', text: 'Hello', x: 10, y: 20 },
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
        <Sticky id="A" text="Source" x={0} y={0}>
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
              props: { id: 'A', x: 0, y: 0 },
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
          <Sticky id="S1" text="Inside" x={10} y={10} />
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
                  props: {
                    id: 'S1',
                    parentId: 'G1',
                    extent: 'parent',
                    x: 10,
                    y: 10,
                  },
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

  describe('Validation', () => {
    it('should throw GraphwriteError if Sticky is missing id', async () => {
      const element = (
        <canvas>
          <Sticky x={0} y={0} />
        </canvas>
      );
      await expect(renderToGraph(element)).rejects.toThrow(GraphwriteError);
      await expect(renderToGraph(element)).rejects.toThrow(
        "Missing required prop 'id'",
      );
    });

    it('should throw GraphwriteError if Sticky is missing x', async () => {
      const element = (
        <canvas>
          <Sticky id="1" y={0} />
        </canvas>
      );
      await expect(renderToGraph(element)).rejects.toThrow(GraphwriteError);
      await expect(renderToGraph(element)).rejects.toThrow(
        "Missing required prop 'x'",
      );
    });

    it('should throw GraphwriteError if Sticky is missing y', async () => {
      const element = (
        <canvas>
          <Sticky id="1" x={0} />
        </canvas>
      );
      await expect(renderToGraph(element)).rejects.toThrow(GraphwriteError);
      await expect(renderToGraph(element)).rejects.toThrow(
        "Missing required prop 'y'",
      );
    });

    it('should throw GraphwriteError if Shape is missing props', async () => {
      const element = (
        <canvas>
          <Shape id="s1" x={0} />
        </canvas>
      );
      await expect(renderToGraph(element)).rejects.toThrow(
        "Missing required prop 'y'",
      );
    });

    it('should throw GraphwriteError if Text is missing props', async () => {
      const element = (
        <canvas>
          <Text id="t1" x={0} />
        </canvas>
      );
      await expect(renderToGraph(element)).rejects.toThrow(
        "Missing required prop 'y'",
      );
    });
  });
});
