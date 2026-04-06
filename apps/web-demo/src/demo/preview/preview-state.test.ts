import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDemoPreviewPresentation } from './preview-state';
import type { DemoPreviewCanvasState } from './types';

const PREVIEW: DemoPreviewCanvasState = {
  nodes: [],
  edges: [],
  mindMapGroups: [],
  sourceVersion: 'demo:ok',
};

test('resolveDemoPreviewPresentation keeps last good preview during loading', () => {
  const presentation = resolveDemoPreviewPresentation({
    status: 'loading',
    lastGoodPreview: PREVIEW,
    diagnostics: [],
  });

  assert.equal(presentation.visiblePreview, PREVIEW);
  assert.equal(presentation.statusTone, 'loading');
  assert.equal(presentation.isShowingLastGoodPreview, true);
});

test('resolveDemoPreviewPresentation keeps last good preview during error', () => {
  const presentation = resolveDemoPreviewPresentation({
    status: 'error',
    lastGoodPreview: PREVIEW,
    diagnostics: [
      {
        message: 'Syntax error',
        fileName: 'examples/readme.tsx',
      },
    ],
  });

  assert.equal(presentation.visiblePreview, PREVIEW);
  assert.equal(presentation.statusTone, 'error');
  assert.equal(presentation.diagnosticsVisible, true);
});

test('resolveDemoPreviewPresentation shows empty placeholder when first render fails', () => {
  const presentation = resolveDemoPreviewPresentation({
    status: 'error',
    lastGoodPreview: null,
    diagnostics: [
      {
        message: 'Import failed',
      },
    ],
  });

  assert.equal(presentation.visiblePreview, null);
  assert.equal(presentation.statusTone, 'error');
  assert.equal(presentation.isShowingLastGoodPreview, false);
});
