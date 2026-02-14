import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { insertImageCommand } from './image';
import { parse } from '@babel/parser';

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

let workspaceRoot: string;

async function writeTempWorkspace() {
  workspaceRoot = await mkdtemp(path.join(tmpdir(), 'magam-image-integration-'));
  await mkdir(path.join(workspaceRoot, 'assets', 'images'), { recursive: true });
}

async function readWorkspaceFiles(): Promise<string[]> {
  return readdir(path.join(workspaceRoot, 'assets', 'images'));
}

function toCode(filePath: string): string {
  return `
import { Canvas, Node, Markdown, Shape, Image } from '@magam/core';

<Canvas>
  ${filePath}
</Canvas>
`;
}

describe('image insert integration', () => {
  beforeEach(async () => {
    process.env.MAGAM_TARGET_DIR = '';
    vi.spyOn(process, 'cwd').mockReturnValue(workspaceRoot = await mkdtemp(path.join(tmpdir(), 'magam-image-integration-')));
    await mkdir(path.join(workspaceRoot, 'assets', 'images'), { recursive: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(workspaceRoot, { recursive: true, force: true });
  });

  it('inserts Image node in node mode and saves local asset', async () => {
    const filePath = path.join(workspaceRoot, 'diagram.tsx');
    const sourcePath = path.join(workspaceRoot, 'logo.png');
    const content = toCode('<Node id="target">hello</Node>');

    await writeFile(filePath, `${content}\n`, 'utf-8');
    await writeFile(sourcePath, PNG_BYTES);

    await insertImageCommand([
      '--file', filePath,
      '--source', sourcePath,
      '--mode', 'node',
      '--target', 'target',
    ]);

    const files = await readWorkspaceFiles();
    expect(files.some((f) => f.endsWith('.png'))).toBe(true);

    const updated = await readFile(filePath, 'utf-8');
    expect(updated).toContain('<Image');
    expect(updated).toContain('import { Canvas, Node, Markdown, Shape, Image }');
  });

  it('inserts markdown token when markdown mode target exists', async () => {
    const filePath = path.join(workspaceRoot, 'diagram.tsx');
    const sourcePath = path.join(workspaceRoot, 'logo.png');
    const content = toCode('<Node id="md"><Markdown>{"start"}</Markdown></Node>');

    await writeFile(filePath, `${content}\n`, 'utf-8');
    await writeFile(sourcePath, PNG_BYTES);

    await insertImageCommand([
      '--file', filePath,
      '--source', 'https://example.com/logo.png',
      '--mode', 'markdown',
      '--target', 'md',
    ]);

    const updated = await readFile(filePath, 'utf-8');
    expect(updated).toContain('![](https://example.com/logo.png)');
  });

  it('inserts Image into canvas self-closing', async () => {
    const filePath = path.join(workspaceRoot, 'diagram.tsx');
    const content = `<Canvas />`;
    await writeFile(filePath, `${content}\n`, 'utf-8');

    await insertImageCommand([
      '--file', filePath,
      '--source', 'https://example.com/canvas.png',
      '--mode', 'canvas',
    ]);

    const updated = await readFile(filePath, 'utf-8');
    expect(updated).toContain('<Canvas>');
    expect(updated).toContain('<Image');
    expect(updated).toContain('</Canvas>');
  });

  it('patches Shape image props', async () => {
    const filePath = path.join(workspaceRoot, 'diagram.tsx');
    const sourcePath = path.join(workspaceRoot, 'logo.png');
    const content = `<Shape id="shape-1" x={10} y={20} />`;

    await writeFile(filePath, `${content}\n`, 'utf-8');
    await writeFile(sourcePath, PNG_BYTES);

    await insertImageCommand([
      '--file', filePath,
      '--source', sourcePath,
      '--mode', 'shape',
      '--target', 'shape-1',
      '--fit', 'cover',
    ]);

    const updated = await readFile(filePath, 'utf-8');
    expect(updated).toContain('imageSrc="');
    expect(updated).toContain('imageFit="cover"');
  });
});
