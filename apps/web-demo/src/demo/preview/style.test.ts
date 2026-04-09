import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDemoCanvasBackground } from './style';

test('resolveDemoCanvasBackground uses a quiet grid for the default canvas background', () => {
  const style = resolveDemoCanvasBackground(undefined);

  assert.equal(style.backgroundColor, '#fbfaf7');
  assert.equal(
    style.backgroundImage,
    'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
  );
  assert.equal(style.backgroundPosition, '-1px -1px');
  assert.equal(style.backgroundSize, '32px 32px');
});

test('resolveDemoCanvasBackground maps the solid option to the default quiet grid', () => {
  assert.deepEqual(
    resolveDemoCanvasBackground('solid'),
    resolveDemoCanvasBackground(undefined),
  );
});
