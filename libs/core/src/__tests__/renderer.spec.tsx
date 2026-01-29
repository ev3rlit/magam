// @ts-nocheck
import * as React from 'react';
import { renderToGraph } from '../renderer';
import { Sticky } from '../components/Sticky';
import { Edge } from '../components/Edge';
import { Group } from '../components/Group';

describe('GraphWrite Renderer', () => {
  it('should render a simple tree to JSON', async () => {
    const element = (
      <canvas>
        <Sticky id="1" text="Hello" />
      </canvas>
    );

    const result = renderToGraph(element);

    await new Promise((resolve) => setTimeout(resolve, 100));

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

    const result = renderToGraph(element);
    await new Promise((resolve) => setTimeout(resolve, 100));

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

    const result = renderToGraph(element);
    await new Promise((resolve) => setTimeout(resolve, 100));

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
});
