import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/cli',
  resolve: {
    alias: {
      '@graphwrite/shared': resolve(__dirname, '../shared/src/index.ts'),
      '@graphwrite/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    name: 'cli',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/cli',
      provider: 'v8' as const,
    },
  },
});
