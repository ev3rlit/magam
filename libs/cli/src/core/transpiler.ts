import { build } from 'esbuild';
import * as path from 'path';

export async function transpile(entryPoint: string): Promise<string> {
  try {
    const result = await build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      write: false,
      external: ['react', 'graphwrite', '@graphwrite/core'],
      // Set outfile to establish path resolution context
      outfile: path.join(path.dirname(entryPoint), 'bundled.js'),
    });

    if (result.errors.length > 0) {
      const errorMessages = result.errors.map((e) => e.text).join(', ');
      throw new Error(`Transpilation failed: ${errorMessages}`);
    }

    if (!result.outputFiles || result.outputFiles.length === 0) {
      throw new Error('No output files generated from transpilation');
    }

    return result.outputFiles[0].text;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown transpilation error: ${String(error)}`);
  }
}
