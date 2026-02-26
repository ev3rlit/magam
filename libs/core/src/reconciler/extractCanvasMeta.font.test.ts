import { describe, expect, it } from 'bun:test';
import { extractCanvasMeta } from './extractCanvasMeta';
import type { Container } from './hostConfig';

describe('extractCanvasMeta fontFamily', () => {
  it('extracts valid canvas fontFamily into container.meta', () => {
    const container: Container = {
      type: 'root',
      children: [
        {
          type: 'graph-canvas',
          props: {
            fontFamily: 'hand-gaegu',
          },
          children: [],
        },
      ],
    };

    const next = extractCanvasMeta(container);
    expect(next.meta?.fontFamily).toBe('hand-gaegu');
  });

  it('ignores invalid canvas fontFamily values', () => {
    const container: Container = {
      type: 'root',
      children: [
        {
          type: 'graph-canvas',
          props: {
            fontFamily: 'invalid-font',
          },
          children: [],
        },
      ],
    };

    const next = extractCanvasMeta(container);
    expect(next.meta?.fontFamily).toBeUndefined();
  });
});
