import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts'],
  format: ['cjs'],
  dts: false,
  clean: true,
  external: [
    '@magam/core',
    '@magam/shared',
    'react',
    'esbuild',
    '@modelcontextprotocol/sdk',
    'drizzle-orm',
    'drizzle-orm/*',
    'bun:sqlite',
  ],
});
