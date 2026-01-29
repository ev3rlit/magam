// @ts-nocheck
import * as React from 'react';
import { renderToGraph } from '../renderer';

describe('GraphWrite Renderer', () => {
  it('should render a simple tree to JSON', async () => {
    const element = (
      <canvas>
        <sticky id="1" text="Hello" />
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
              type: 'sticky',
              props: { id: '1', text: 'Hello' },
              children: [],
            },
          ],
        },
      ],
    });
  });
});
