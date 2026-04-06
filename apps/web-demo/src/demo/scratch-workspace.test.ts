import assert from 'node:assert/strict';
import test from 'node:test';
import { createScratchDocumentId, DemoScratchWorkspace } from './scratch-workspace';

test('DemoScratchWorkspace creates and reuses a scratch document for the same path', async () => {
  const workspace = new DemoScratchWorkspace();

  const document = await workspace.startFromExample({
    path: 'examples/readme.tsx',
    source: 'export default function Example() {}',
  });
  const reusedDocument = await workspace.startFromExample({
    path: 'examples/readme.tsx',
    source: 'export default function Changed() {}',
  });

  assert.equal(document.documentId, createScratchDocumentId('examples/readme.tsx'));
  assert.equal(reusedDocument, document);
  assert.equal(reusedDocument.source, 'export default function Example() {}');
});

test('DemoScratchWorkspace updates and resets the active scratch document', async () => {
  const workspace = new DemoScratchWorkspace();
  const document = await workspace.startFromExample({
    path: 'examples/readme.tsx',
    source: 'one',
  });

  await workspace.update(document.documentId, 'two');
  assert.deepEqual(await workspace.get(document.documentId), {
    ...document,
    source: 'two',
  });

  await workspace.reset(document.documentId, 'three');
  assert.deepEqual(await workspace.get(document.documentId), {
    ...document,
    source: 'three',
  });
});

test('DemoScratchWorkspace replaces the previous scratch document when the path changes', async () => {
  const workspace = new DemoScratchWorkspace();
  const firstDocument = await workspace.startFromExample({
    path: 'examples/readme.tsx',
    source: 'one',
  });
  const secondDocument = await workspace.startFromExample({
    path: 'examples/sequence.tsx',
    source: 'two',
  });

  assert.equal(await workspace.get(firstDocument.documentId), null);
  assert.deepEqual(await workspace.get(secondDocument.documentId), secondDocument);
});
