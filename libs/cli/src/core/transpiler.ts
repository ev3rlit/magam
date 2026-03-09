import { build } from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

export interface TranspileMetadataResult {
  code: string;
  inputs: string[];
}

export function normalizeInputPath(
  entryPoint: string,
  inputPath: string,
  workspaceRoot: string = process.cwd(),
): string {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  const workspaceCandidate = path.resolve(workspaceRoot, inputPath);
  const entryRelativeCandidate = path.resolve(path.dirname(entryPoint), inputPath);

  if (inputPath.startsWith('./') || inputPath.startsWith('../')) {
    if (fs.existsSync(entryRelativeCandidate)) {
      return entryRelativeCandidate;
    }
    if (fs.existsSync(workspaceCandidate)) {
      return workspaceCandidate;
    }
    return entryRelativeCandidate;
  }

  if (fs.existsSync(workspaceCandidate)) {
    return workspaceCandidate;
  }
  if (fs.existsSync(entryRelativeCandidate)) {
    return entryRelativeCandidate;
  }

  return workspaceCandidate;
}

export async function transpileWithMetadata(entryPoint: string): Promise<TranspileMetadataResult> {
  try {
    const result = await build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      write: false,
      metafile: true,
      jsx: 'automatic',
      jsxDev: true,
      external: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'magam',
        '@magam/core',
      ],
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

    return {
      code: result.outputFiles[0].text,
      inputs: Object.keys(result.metafile?.inputs || {}).map((inputPath) => (
        normalizeInputPath(entryPoint, inputPath)
      )),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown transpilation error: ${String(error)}`);
  }
}

export async function transpile(entryPoint: string): Promise<string> {
  const result = await transpileWithMetadata(entryPoint);
  return result.code;
}
