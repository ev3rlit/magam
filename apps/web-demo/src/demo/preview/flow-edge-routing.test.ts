import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePreviewEdgeHandleIds } from './flow-edge-routing';
import type { DemoPreviewNode } from './types';

function createShapeNode(input: {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}): DemoPreviewNode {
  return {
    id: input.id,
    type: 'demo-shape',
    position: {
      x: input.x,
      y: input.y,
    },
    width: input.width ?? 180,
    height: input.height ?? 80,
    data: {
      kind: 'shape',
      label: input.id,
    },
  };
}

test('resolvePreviewEdgeHandleIds routes left-to-right edges across side handles', () => {
  const handles = resolvePreviewEdgeHandleIds({
    sourceNode: createShapeNode({ id: 'root', x: 0, y: 0 }),
    targetNode: createShapeNode({ id: 'child', x: 320, y: 20 }),
  });

  assert.deepEqual(handles, {
    sourceHandle: 'right',
    targetHandle: 'left',
  });
});

test('resolvePreviewEdgeHandleIds routes right-to-left edges across opposite side handles', () => {
  const handles = resolvePreviewEdgeHandleIds({
    sourceNode: createShapeNode({ id: 'root', x: 320, y: 0 }),
    targetNode: createShapeNode({ id: 'child', x: 0, y: 20 }),
  });

  assert.deepEqual(handles, {
    sourceHandle: 'left',
    targetHandle: 'right',
  });
});

test('resolvePreviewEdgeHandleIds routes vertical edges across top and bottom handles', () => {
  const handles = resolvePreviewEdgeHandleIds({
    sourceNode: createShapeNode({ id: 'root', x: 120, y: 0 }),
    targetNode: createShapeNode({ id: 'child', x: 140, y: 240 }),
  });

  assert.deepEqual(handles, {
    sourceHandle: 'bottom',
    targetHandle: 'top',
  });
});
