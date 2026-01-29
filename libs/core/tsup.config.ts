import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['libs/core/src/index.ts'],
  outDir: 'dist/libs/core',
  tsconfig: 'libs/core/tsconfig.lib.json',
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-reconciler', 'elkjs'],
});
