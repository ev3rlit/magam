import { describe, expect, it } from 'bun:test';
import type { Node } from 'reactflow';
import { mapDragToRelativeAttachmentUpdate } from './relativeAttachmentMapping';

function makeNode(input: Partial<Node> & { id: string; type: string; data?: Record<string, unknown> }): Node {
  return {
    id: input.id,
    type: input.type,
    position: input.position ?? { x: 0, y: 0 },
    data: input.data ?? {},
    width: input.width,
    height: input.height,
  } as Node;
}

describe('relativeAttachmentMapping', () => {
  it('maps Washi attach drag to at.offset only', () => {
    const target = makeNode({
      id: 'target',
      type: 'shape',
      position: { x: 100, y: 100 },
      width: 200,
      height: 120,
    });
    const washi = makeNode({
      id: 'washi-1',
      type: 'washi-tape',
      position: { x: 120, y: 70 },
      data: {
        at: {
          type: 'attach',
          target: 'target',
          placement: 'top',
          span: 0.8,
          align: 0.5,
          offset: 10,
          thickness: 20,
        },
      },
    });

    const result = mapDragToRelativeAttachmentUpdate({
      draggedNode: washi,
      allNodes: [target, washi],
      dropPosition: { x: 120, y: 65 },
    });

    expect(result?.kind).toBe('washi-attach');
    if (!result || result.kind !== 'washi-attach') return;
    expect(result.before.at.offset).toBe(10);
    expect(result.after.at.offset).toBe(25);
    expect((result.props.at.target as string)).toBe('target');
    expect((result.props.at.placement as string)).toBe('top');
    expect((result.props.at.span as number)).toBe(0.8);
    expect((result.props.at.align as number)).toBe(0.5);
  });

  it('maps Sticker anchor drag to gap only', () => {
    const target = makeNode({
      id: 'target',
      type: 'shape',
      position: { x: 50, y: 40 },
      width: 120,
      height: 80,
    });
    const sticker = makeNode({
      id: 'sticker-1',
      type: 'sticker',
      position: { x: 180, y: 60 },
      width: 40,
      height: 30,
      data: {
        anchor: 'target',
        position: 'right',
        align: 'center',
        gap: 10,
      },
    });

    const result = mapDragToRelativeAttachmentUpdate({
      draggedNode: sticker,
      allNodes: [target, sticker],
      dropPosition: { x: 200, y: 60 },
    });

    expect(result?.kind).toBe('sticker-anchor');
    if (!result || result.kind !== 'sticker-anchor') return;
    expect(result.before.gap).toBe(10);
    expect(result.after.gap).toBe(30);
    expect(result.props.gap).toBe(30);
  });

  it('returns invalid when attach target is missing', () => {
    const washi = makeNode({
      id: 'washi-1',
      type: 'washi-tape',
      data: {
        at: {
          type: 'attach',
          target: 'missing',
          placement: 'bottom',
          offset: 4,
        },
      },
    });

    const result = mapDragToRelativeAttachmentUpdate({
      draggedNode: washi,
      allNodes: [washi],
      dropPosition: { x: 0, y: 0 },
    });

    expect(result?.kind).toBe('invalid');
    if (!result || result.kind !== 'invalid') return;
    expect(result.reason).toBe('MISSING_ATTACH_TARGET');
  });
});
