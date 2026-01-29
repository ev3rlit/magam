import { mkdir, writeFile, access } from 'fs/promises';
import { join } from 'path';

export async function initProject(cwd: string) {
  const graphwriteDir = join(cwd, '.graphwrite', 'node_modules', 'graphwrite');

  // 1. Create .graphwrite/node_modules/graphwrite/ folder
  await mkdir(graphwriteDir, { recursive: true });

  // 2. Copy types (mock for now)
  const dtsContent = `
// Mock types for graphwrite
export declare const Canvas: any;
export declare const Sticky: any;
export declare const Shape: any;
export declare const Text: any;
export declare const Group: any;
export declare const MindMap: any;
export declare const Node: any;
`;
  await writeFile(join(graphwriteDir, 'index.d.ts'), dtsContent);

  // 3. Write tsconfig.json
  const tsconfigPath = join(cwd, 'tsconfig.json');
  try {
    await access(tsconfigPath);
    console.warn(
      'tsconfig.json already exists. Skipping creation to avoid overwriting.',
    );
  } catch {
    const tsconfigContent = {
      compilerOptions: {
        baseUrl: '.',
        paths: {
          graphwrite: ['.graphwrite/node_modules/graphwrite'],
        },
      },
    };
    await writeFile(tsconfigPath, JSON.stringify(tsconfigContent, null, 2));
    console.log('Created tsconfig.json');
  }

  console.log('Initialized graphwrite project in .graphwrite');
}
