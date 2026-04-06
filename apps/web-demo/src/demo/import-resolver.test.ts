import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDemoImportCandidates, resolveDemoImportDependency } from './import-resolver';

test('resolveDemoImportCandidates supports extensionless relative TSX imports', () => {
  assert.deepEqual(resolveDemoImportCandidates('examples/readme.tsx', './shared/card'), [
    'examples/shared/card.tsx',
    'examples/shared/card/index.tsx',
    'examples/shared/card.ts',
    'examples/shared/card/index.ts',
    'examples/shared/card.jsx',
    'examples/shared/card/index.jsx',
    'examples/shared/card.js',
    'examples/shared/card/index.js',
  ]);
});

test('resolveDemoImportDependency prefers the active scratch source before registry fallback', () => {
  const dependency = resolveDemoImportDependency({
    exampleSourceByPath: {
      'examples/readme.tsx': 'registry-readme',
      'examples/nested/consumer.tsx': 'consumer',
    },
    entryPath: 'examples/readme.tsx',
    entrySource: 'scratch-readme',
    importerPath: 'examples/nested/consumer.tsx',
    specifier: '../readme',
  });

  assert.deepEqual(dependency, {
    path: 'examples/readme.tsx',
    source: 'scratch-readme',
  });
});

test('resolveDemoImportDependency walks parent segments and falls back to registry sources', () => {
  const dependency = resolveDemoImportDependency({
    exampleSourceByPath: {
      'examples/shared/note.tsx': 'export default function Note() {}',
    },
    entryPath: 'examples/readme.tsx',
    entrySource: 'entry',
    importerPath: 'examples/nested/consumer.tsx',
    specifier: '../shared/note',
  });

  assert.deepEqual(dependency, {
    path: 'examples/shared/note.tsx',
    source: 'export default function Note() {}',
  });
});
