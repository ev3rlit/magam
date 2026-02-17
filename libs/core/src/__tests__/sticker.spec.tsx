// @ts-nocheck
import * as React from 'react';
import { renderToGraph } from '../renderer';
import { Sticker } from '../components/Sticker';

describe('Sticker component', () => {
  it('renders graph-sticker host node', async () => {
    const element = (
      <canvas>
        <Sticker id="s1" kind="text" x={10} y={20} text="TODO" />
      </canvas>
    );

    const result = await renderToGraph(element);
    expect(result.isOk()).toBe(true);

    result.map((graph) => {
      const canvas = graph.children[0];
      const sticker = canvas?.children?.[0];
      expect(sticker?.type).toBe('graph-sticker');
      expect(sticker?.props?.id).toBe('s1');
      expect(sticker?.props?.kind).toBe('text');
      expect(sticker?.props?.text).toBe('TODO');
      return graph;
    });
  });

  it('returns error when kind is missing', async () => {
    const element = (
      <canvas>
        <Sticker id="s1" x={10} y={20} />
      </canvas>
    );

    const result = await renderToGraph(element);
    expect(result.isErr()).toBe(true);
  });

  it('allows anchor positioning without x/y', async () => {
    const element = (
      <canvas>
        <Sticker id="s2" kind="emoji" anchor="node-a" position="right" emoji="🔥" />
      </canvas>
    );

    const result = await renderToGraph(element);
    expect(result.isOk()).toBe(true);
  });

  it('preserves sticker style fields for image/svg pipelines', async () => {
    const element = (
      <canvas>
        <Sticker
          id="svg-1"
          kind="image"
          src="./assets/logo.svg"
          x={0}
          y={0}
          width={180}
          height={120}
          outlineWidth={8}
          outlineColor="#fff"
          shadow="lg"
          padding={12}
        />
      </canvas>
    );

    const result = await renderToGraph(element);
    expect(result.isOk()).toBe(true);

    result.map((graph) => {
      const canvas = graph.children[0];
      const sticker = canvas?.children?.[0];
      expect(sticker?.props?.src).toBe('./assets/logo.svg');
      expect(sticker?.props?.outlineWidth).toBe(8);
      expect(sticker?.props?.outlineColor).toBe('#fff');
      expect(sticker?.props?.shadow).toBe('lg');
      expect(sticker?.props?.padding).toBe(12);
      return graph;
    });
  });
});
