import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { patchFile, patchNodeCreate, patchNodePosition, patchNodeReparent } from './filePatcher';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

async function makeTempTsx(content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'magam-filepatcher-'));
  tempDirs.push(dir);
  const filePath = join(dir, 'sample.tsx');
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

describe('filePatcher', () => {
  it('update: null 속성은 JSX attribute를 제거한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Node id="n1" icon={"rocket"} label={"Hello"} />;
      }
    `);

    await patchFile(filePath, 'n1', { icon: null, label: 'Updated' });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('icon')).toBe(false);
    expect(patched.includes('label={"Updated"}')).toBe(true);
  });

  it('update: id 변경 시 from/to/anchor 참조를 함께 갱신한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas>
          <Node id="old-id" />
          <Node id="child" from="old-id" anchor="old-id" />
          <Edge from="old-id" to="child" />
        </Canvas>;
      }
    `);

    await patchFile(filePath, 'old-id', { id: 'new-id' });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('id={"new-id"}')).toBe(true);
    expect(patched.includes('from={"new-id"}')).toBe(true);
    expect(patched.includes('anchor={"new-id"}')).toBe(true);
    expect(patched.includes('<Edge from={"new-id"}')).toBe(true);
  });

  it('update: markdown content를 Markdown 자식으로 반영한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas>
          <Node id="md"><Markdown>{\`old\`}</Markdown></Node>
        </Canvas>;
      }
    `);

    await patchFile(filePath, 'md', { content: '# hello' });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('# hello')).toBe(true);
  });

  it('move: patchNodePosition은 x/y만 갱신한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Node id="n3" x={10} y={20} label={"keep"} />;
      }
    `);

    await patchNodePosition(filePath, 'n3', 333, 444);

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('x={333}')).toBe(true);
    expect(patched.includes('y={444}')).toBe(true);
    expect(patched.includes('label={"keep"}')).toBe(true);
  });

  it('create: Canvas에 새 Node를 추가한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas><Node id="root" /></Canvas>;
      }
    `);

    await patchNodeCreate(filePath, { id: 'n-new', type: 'text', props: { from: 'root', content: 'hello' } });
    const patched = await readFile(filePath, 'utf-8');

    expect(patched.includes('id={"n-new"}')).toBe(true);
    expect(patched.includes('from={"root"}')).toBe(true);
    expect(patched.includes('hello')).toBe(true);
  });

  it('reparent: 부모 변경 성공', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas>
          <Node id="a" />
          <Node id="b" from="a" />
        </Canvas>;
      }
    `);

    await patchNodeReparent(filePath, 'b', 'c');
    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('id="b" from={"c"}')).toBe(true);
  });

  it('reparent: cycle이면 MINDMAP_CYCLE 에러', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas>
          <Node id="a" />
          <Node id="b" from="a" />
          <Node id="c" from="b" />
        </Canvas>;
      }
    `);

    await expect(patchNodeReparent(filePath, 'a', 'c')).rejects.toThrow('MINDMAP_CYCLE');
  });

  it('Shape에서도 icon 제거 시 다른 속성은 유지한다 (icon-prop 제거 회귀)', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Shape id="s1" icon={"bug"} type={"rectangle"} label={"Auth"} />;
      }
    `);

    await patchFile(filePath, 's1', {
      icon: null,
      label: 'Auth Service',
    });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('icon=')).toBe(false);
    expect(patched.includes('type={"rectangle"}')).toBe(true);
    expect(patched.includes('label={"Auth Service"}')).toBe(true);
  });
});
