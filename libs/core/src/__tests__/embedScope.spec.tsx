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
import { EmbedScope } from '../components/EmbedScope';

async function render(element: React.ReactNode) {
  const resultAsync = renderToGraph(element);
  return resultAsync.match(
    (container) => container,
    (error) => { throw error; },
  );
}

describe('EmbedScope', () => {
  it('should pass IDs through unchanged when no EmbedScope is present', async () => {
    const element = (
      <canvas>
        <Sticky id="A" text="Hello" x={0} y={0} />
      </canvas>
    );
    const result = await render(element);
    const sticky = result.children[0].children[0];
    expect(sticky.props.id).toBe('A');
  });

  it('should prefix IDs with scope when inside EmbedScope', async () => {
    const element = (
      <canvas>
        <EmbedScope id="auth">
          <Sticky id="jwt" text="JWT" x={0} y={0} />
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const sticky = result.children[0].children[0];
    expect(sticky.props.id).toBe('auth.jwt');
  });

  it('should chain nested EmbedScopes', async () => {
    const element = (
      <canvas>
        <EmbedScope id="infra">
          <EmbedScope id="aws">
            <Sticky id="ec2" text="EC2" x={0} y={0} />
          </EmbedScope>
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const sticky = result.children[0].children[0];
    expect(sticky.props.id).toBe('infra.aws.ec2');
  });

  it('should not prefix IDs that already contain a dot (cross-boundary)', async () => {
    const element = (
      <canvas>
        <EmbedScope id="auth">
          <Sticky id="backend.api" text="Cross" x={0} y={0} />
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const sticky = result.children[0].children[0];
    expect(sticky.props.id).toBe('backend.api');
  });

  it('should scope Edge from and to', async () => {
    const element = (
      <canvas>
        <EmbedScope id="auth">
          <Sticky id="A" text="Source" x={0} y={0} />
          <Sticky id="B" text="Target" x={100} y={0} />
          <Edge from="A" to="B" />
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const children = result.children[0].children;
    const edge = children.find((c: any) => c.type === 'graph-edge');
    expect(edge.props.from).toBe('auth.A');
    expect(edge.props.to).toBe('auth.B');
  });

  it('should inject scoped parent ID for nested Edge (from injection)', async () => {
    const element = (
      <canvas>
        <EmbedScope id="auth">
          <Sticky id="A" text="Source" x={0} y={0}>
            <Edge to="B" />
          </Sticky>
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const sticky = result.children[0].children[0];
    const edge = sticky.children[0];
    // Edge's from is injected by reconciler from scoped parent id
    expect(edge.props.from).toBe('auth.A');
    expect(edge.props.to).toBe('auth.B');
  });

  it('should scope Shape IDs', async () => {
    const element = (
      <canvas>
        <EmbedScope id="diagram">
          <Shape id="rect1" type="rectangle" x={0} y={0} width={100} height={50} />
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const shape = result.children[0].children[0];
    expect(shape.props.id).toBe('diagram.rect1');
  });

  it('should scope Text IDs', async () => {
    const element = (
      <canvas>
        <EmbedScope id="section">
          <Text id="title" text="Hello" x={0} y={0} />
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const text = result.children[0].children[0];
    expect(text.props.id).toBe('section.title');
  });

  it('should scope MindMap ID', async () => {
    const element = (
      <canvas>
        <EmbedScope id="auth">
          <MindMap id="map">
            <Node id="1" text="Root" />
            <Node id="2" text="Child" />
            <Edge from="1" to="2" />
          </MindMap>
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const mindmap = result.children[0].children[0];
    expect(mindmap.props.id).toBe('auth.map');
  });

  it('should scope Group ID and propagate scoped parentId to children', async () => {
    const element = (
      <canvas>
        <EmbedScope id="section">
          <Group id="G1">
            <Sticky id="S1" text="Inside" x={10} y={10} />
          </Group>
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const group = result.children[0].children[0];
    expect(group.props.id).toBe('section.G1');
    const child = group.children[0];
    expect(child.props.id).toBe('section.S1');
    expect(child.props.parentId).toBe('section.G1');
  });

  it('should work with multiple EmbedScopes at the same level', async () => {
    const element = (
      <canvas>
        <EmbedScope id="left">
          <Sticky id="box" text="Left" x={0} y={0} />
        </EmbedScope>
        <EmbedScope id="right">
          <Sticky id="box" text="Right" x={200} y={0} />
        </EmbedScope>
      </canvas>
    );
    const result = await render(element);
    const children = result.children[0].children;
    expect(children[0].props.id).toBe('left.box');
    expect(children[1].props.id).toBe('right.box');
  });
});
