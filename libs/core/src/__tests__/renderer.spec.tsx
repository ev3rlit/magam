// @ts-nocheck
import * as React from 'react';
import { renderToGraph } from '../renderer';
import { Sticky } from '../components/Sticky';
import { Edge } from '../components/Edge';

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
});
