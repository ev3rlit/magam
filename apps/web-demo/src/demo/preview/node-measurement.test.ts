import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeMeasuredPreviewNode,
  type PreviewNodeMeasurement,
  resolvePreviewNodeMeasurement,
} from './node-measurement';
import type { DemoPreviewNode } from './types';

function createMarkdownNode(overrides: Partial<DemoPreviewNode> = {}): DemoPreviewNode {
  return {
    id: 'markdown-node',
    type: 'demo-markdown',
    position: { x: 0, y: 0 },
    width: 420,
    height: 180,
    data: {
      kind: 'markdown',
      label: 'Result',
      markdown: '```tsx\nconst glass = true;\n```',
    },
    ...overrides,
  };
}

function createStickyNode(overrides: Partial<DemoPreviewNode> = {}): DemoPreviewNode {
  return {
    id: 'sticky-node',
    type: 'demo-sticky',
    position: { x: 0, y: 0 },
    width: 260,
    height: 190,
    data: {
      kind: 'sticky',
      label: 'Sticky',
      markdown: '```tsx\n<Sticky />\n```',
    },
    ...overrides,
  };
}

test('resolvePreviewNodeMeasurement keeps width tied to the rendered box and height tied to intrinsic content', () => {
  const measurement = resolvePreviewNodeMeasurement({
    hostWidth: 420,
    contentHeight: 188,
    verticalInsets: 30,
  });

  assert.deepEqual(measurement, {
    width: 420,
    height: 218,
  });
});

test('mergeMeasuredPreviewNode preserves markdown width while allowing height growth', () => {
  const node = createMarkdownNode();
  const measurement: PreviewNodeMeasurement = {
    width: 388,
    height: 236,
  };

  const merged = mergeMeasuredPreviewNode(node, measurement);

  assert.equal(merged.width, 420);
  assert.equal(merged.height, 236);
});

test('mergeMeasuredPreviewNode is idempotent for repeated markdown measurements', () => {
  const measurement: PreviewNodeMeasurement = {
    width: 420,
    height: 236,
  };
  const once = mergeMeasuredPreviewNode(createMarkdownNode({ height: 220 }), measurement);
  const twice = mergeMeasuredPreviewNode(once, measurement);

  assert.equal(once.width, 420);
  assert.equal(once.height, 236);
  assert.equal(twice, once);
});

test('mergeMeasuredPreviewNode does not keep increasing markdown height from the measured wrapper size', () => {
  const once = mergeMeasuredPreviewNode(
    createMarkdownNode({ height: 236 }),
    resolvePreviewNodeMeasurement({
      hostWidth: 420,
      contentHeight: 188,
      verticalInsets: 30,
    }),
  );
  const twice = mergeMeasuredPreviewNode(
    once,
    resolvePreviewNodeMeasurement({
      hostWidth: 420,
      contentHeight: 188,
      verticalInsets: 30,
    }),
  );

  assert.equal(once.height, 236);
  assert.equal(twice, once);
});

test('mergeMeasuredPreviewNode keeps sticky markdown width stable across repeated measurements', () => {
  const measurement: PreviewNodeMeasurement = {
    width: 260,
    height: 220,
  };
  const once = mergeMeasuredPreviewNode(createStickyNode(), measurement);
  const twice = mergeMeasuredPreviewNode(once, measurement);

  assert.equal(once.width, 260);
  assert.equal(once.height, 220);
  assert.equal(twice, once);
});
