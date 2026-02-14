import { createHash } from 'node:crypto';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parse } from '@babel/parser';
import { insertImageCommand } from './image';
import { readFile, rename, writeFile, mkdir, stat } from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  rename: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
}));

const WORKSPACE_ROOT = '/tmp/graphwrite-image-test';
const TARGET_FILE = path.join(WORKSPACE_ROOT, 'diagram.tsx');
const SOURCE_FILE = path.join(WORKSPACE_ROOT, 'assets-source', 'logo.png');
const PNG_BYTES = Buffer.from('89504e470d0a1a0a00000000', 'hex');
const SOURCE_NAME = 'logo';
const HASH = createHash('sha256').update(PNG_BYTES).digest('hex').slice(0, 8);
const SAVED_NAME = `${SOURCE_NAME}-${HASH}.png`;
const SAVED_SOURCE = `./assets/images/${SAVED_NAME}`;
const mockedReadFile = vi.mocked(readFile);
const mockedWriteFile = vi.mocked(writeFile);
const mockedRename = vi.mocked(rename);
const mockedMkdir = vi.mocked(mkdir);
const mockedStat = vi.mocked(stat);

type WriteCall = [string, string | Buffer, string?];

function getWrittenCode(): string {
  const codeCall = mockedWriteFile.mock.calls.find((call): call is WriteCall => (
    typeof call[0] === 'string'
    && typeof call[1] === 'string'
    && call[0].includes('.tmp')
  ));
  if (!codeCall) {
    throw new Error('No code write call found');
  }
  return codeCall[1];
}

function countImageSpecifier(code: string): number {
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] }) as any;
  const declaration = ast.program.body.find((node: any) => (
    node.type === 'ImportDeclaration' && node.source.value === '@graphwrite/core'
  ));
  if (!declaration) return 0;
  return declaration.specifiers.filter((spec: any) => (
    spec.type === 'ImportSpecifier' && spec.imported.name === 'Image'
  )).length;
}

function setDefaultFsMocks(inputCode: string) {
  mockedReadFile.mockImplementation(async (target: string) => {
    if (target === TARGET_FILE) {
      return inputCode;
    }
    return PNG_BYTES;
  });

  mockedStat.mockResolvedValue({
    size: PNG_BYTES.length,
    isFile: () => true,
  } as any);

  mockedWriteFile.mockResolvedValue(undefined);
  mockedRename.mockResolvedValue(undefined);
  mockedMkdir.mockResolvedValue(undefined);
}

describe('insertImageCommand', () => {
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(WORKSPACE_ROOT);
    mockedReadFile.mockReset();
    mockedWriteFile.mockReset();
    mockedRename.mockReset();
    mockedMkdir.mockReset();
    mockedStat.mockReset();
  });

  afterEach(() => {
    cwdSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  it('inserts Image node with auto Image import when target node exists', async () => {
    const inputCode = `
      import { Canvas, Node } from '@graphwrite/core';

      <Canvas>
        <Node id="target">hello</Node>
      </Canvas>
    `;
    setDefaultFsMocks(inputCode);

    await insertImageCommand([
      '--file', TARGET_FILE,
      '--source', SOURCE_FILE,
      '--mode', 'node',
      '--target', 'target',
    ]);

    const written = getWrittenCode();
    expect(written).toContain(`import { Canvas, Node, Image } from '@graphwrite/core';`);
    expect(written).toContain(`src="${SAVED_SOURCE}"`);
    expect(written).toContain('<Node id="target">');
    expect(written).toContain('<Image');
    expect(countImageSpecifier(written)).toBe(1);
  });

  it('inserts markdown image token into Markdown content', async () => {
    const inputCode = `
      import { Canvas, Node, Markdown } from '@graphwrite/core';

      <Canvas>
        <Node id="md">
          <Markdown>{'start'}</Markdown>
        </Node>
      </Canvas>
    `;
    setDefaultFsMocks(inputCode);

    await insertImageCommand([
      '--file', TARGET_FILE,
      '--source', 'https://example.com/sample.png',
      '--mode', 'markdown',
      '--target', 'md',
    ]);

    const written = getWrittenCode();
    expect(written).toContain(`![](https://example.com/sample.png)`);
  });

  it('inserts Image into self-closing canvas', async () => {
    const inputCode = `<Canvas />`;
    setDefaultFsMocks(inputCode);

    await insertImageCommand([
      '--file', TARGET_FILE,
      '--source', SOURCE_FILE,
      '--mode', 'canvas',
    ]);

    const written = getWrittenCode();
    expect(written).toContain('<Canvas>');
    expect(written).toContain('<Image src="');
    expect(written).toContain(SAVED_SOURCE);
    expect(written).toContain('</Canvas>');
  });

  it('patches Shape with imageSrc and imageFit', async () => {
    const inputCode = `
      import { Shape } from '@graphwrite/core';

      <Shape id="shape-1" x={10} y={20} />
    `;
    setDefaultFsMocks(inputCode);

    await insertImageCommand([
      '--file', TARGET_FILE,
      '--source', SOURCE_FILE,
      '--mode', 'shape',
      '--target', 'shape-1',
      '--fit', 'cover',
    ]);

    const written = getWrittenCode();
    expect(written).toContain('imageSrc="');
    expect(written).toContain(SAVED_SOURCE);
    expect(written).toContain('imageFit="cover"');
  });

  it('keeps existing @graphwrite/core import unique when Image already exists', async () => {
    const inputCode = `
      import { Node, Image } from '@graphwrite/core';

      <Node id="target" />
    `;
    setDefaultFsMocks(inputCode);

    await insertImageCommand([
      '--file', TARGET_FILE,
      '--source', SOURCE_FILE,
      '--mode', 'node',
      '--target', 'target',
    ]);

    const written = getWrittenCode();
    expect(countImageSpecifier(written)).toBe(1);
    expect(written).toContain(`<Node id="target">`);
    expect(written).toContain(SAVED_SOURCE);
  });

  it('fails when required arguments are missing (process exit path)', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process exit');
    });

    const inputCode = '<Canvas />;';
    setDefaultFsMocks(inputCode);

    await expect(insertImageCommand([
      '--source', SOURCE_FILE,
      '--mode', 'node',
      '--target', 'target',
    ])).rejects.toThrow('process exit');

    exitSpy.mockRestore();
  });
});
