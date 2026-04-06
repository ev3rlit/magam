import assert from 'node:assert/strict';
import test from 'node:test';
import { layoutDemoPreviewCanvasState } from './layout';
import type { DemoPreviewCanvasState } from './types';

test('layoutDemoPreviewCanvasState applies tree placement to grouped nodes', async () => {
  const input: DemoPreviewCanvasState = {
    nodes: [
      {
        id: 'map.root',
        type: 'demo-shape',
        position: { x: 0, y: 0 },
        data: { kind: 'shape', label: 'Root', groupId: 'map' },
      },
      {
        id: 'map.child',
        type: 'demo-shape',
        position: { x: 0, y: 0 },
        data: { kind: 'shape', label: 'Child', groupId: 'map' },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'map.root',
        target: 'map.child',
      },
    ],
    mindMapGroups: [
      {
        id: 'map',
        layoutType: 'tree',
        spacing: 80,
        basePosition: { x: 40, y: 20 },
      },
    ],
    sourceVersion: null,
  };
  const output = await layoutDemoPreviewCanvasState(input);
  const root = output.nodes.find((node) => node.id === 'map.root');
  const child = output.nodes.find((node) => node.id === 'map.child');

  assert.ok(root);
  assert.ok(child);
  assert.equal(root?.position.x, 40);
  assert.ok((child?.position.x ?? 0) > (root?.position.x ?? 0));
});

test('layoutDemoPreviewCanvasState splits bidirectional children across both sides', async () => {
  const input: DemoPreviewCanvasState = {
    nodes: [
      {
        id: 'map.root',
        type: 'demo-shape',
        position: { x: 0, y: 0 },
        data: { kind: 'shape', label: 'Root', groupId: 'map' },
      },
      {
        id: 'map.left',
        type: 'demo-shape',
        position: { x: 0, y: 0 },
        data: { kind: 'shape', label: 'Left', groupId: 'map' },
      },
      {
        id: 'map.right',
        type: 'demo-shape',
        position: { x: 0, y: 0 },
        data: { kind: 'shape', label: 'Right', groupId: 'map' },
      },
    ],
    edges: [
      {
        id: 'edge-left',
        source: 'map.root',
        target: 'map.left',
      },
      {
        id: 'edge-right',
        source: 'map.root',
        target: 'map.right',
      },
    ],
    mindMapGroups: [
      {
        id: 'map',
        layoutType: 'bidirectional',
        spacing: 80,
        basePosition: { x: 0, y: 0 },
      },
    ],
    sourceVersion: null,
  };
  const output = await layoutDemoPreviewCanvasState(input);
  const root = output.nodes.find((node) => node.id === 'map.root');
  const left = output.nodes.find((node) => node.id === 'map.left');
  const right = output.nodes.find((node) => node.id === 'map.right');

  assert.ok(root);
  assert.ok(left);
  assert.ok(right);
  assert.ok((left?.position.x ?? 0) < (root?.position.x ?? 0));
  assert.ok((right?.position.x ?? 0) > (root?.position.x ?? 0));
});
