import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getGlobalIdentifierCollisions,
  patchFile,
  patchNodeCreate,
  patchNodePosition,
  patchNodeReparent,
} from './filePatcher';
import {
  ATTACH_FIXTURE_TSX,
  TEXT_FIXTURE_TSX,
} from './__fixtures__/bidirectional-editing';
import { expectIncludesAll, expectIncludesNone, expectSameSnippetCount } from './testUtils';

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

  it('update: id 변경 시 from object의 node 참조도 갱신한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas>
          <Node id="old-id" />
          <Shape id="child" from={{ node: "old-id", edge: { label: "L1" } }} />
        </Canvas>;
      }
    `);

    await patchFile(filePath, 'old-id', { id: 'new-id' });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('id={"new-id"}')).toBe(true);
    expect(patched.includes('node: "new-id"')).toBe(true);
    expect(patched.includes('label: "L1"')).toBe(true);
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

  it('update: 텍스트/마크다운 편집은 content 대상만 바뀐다', async () => {
    const filePath = await makeTempTsx(TEXT_FIXTURE_TSX);
    const before = await readFile(filePath, 'utf-8');

    await patchFile(filePath, 'text-1', { content: '## changed' });
    const after = await readFile(filePath, 'utf-8');

    expectIncludesAll(after, ['id="text-1"', '## changed', 'id="text-2"', 'plain-old']);
    expectIncludesNone(after, ['# Title\\nold']);
    expect(before.includes('id="text-2"')).toBe(true);
    expectSameSnippetCount(after, 'id="text-2"', 1);
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

  it('create: sticker 타입은 Sticky JSX로 생성된다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas><Node id="root" /></Canvas>;
      }
    `);

    await patchNodeCreate(filePath, {
      id: 's-new',
      type: 'sticker',
      props: {
        x: 10,
        y: 20,
        text: 'note',
        anchor: 'root',
        position: 'right',
        gap: 16,
        pattern: { type: 'preset', id: 'lined-warm' },
      },
    });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('<Sticky')).toBe(true);
    expect(patched.includes('id={"s-new"}')).toBe(true);
    expect(patched.includes('text={"note"}')).toBe(true);
    expect(patched.includes('anchor={"root"}')).toBe(true);
    expect(patched.includes('position={"right"}')).toBe(true);
    expect(patched.includes('gap={16}')).toBe(true);
    expect(patched.includes('id: "lined-warm"')).toBe(true);
  });

  it('update: sticker pattern object를 유지한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas><Sticky id="s1" pattern={{ type: "preset", id: "postit" }} /></Canvas>;
      }
    `);

    await patchFile(filePath, 's1', {
      pattern: { type: 'preset', id: 'grid-standard' },
      at: { type: 'anchor', target: 'root', position: 'bottom', gap: 24 },
    });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('id: "grid-standard"')).toBe(true);
    expect(patched.includes('type: "anchor"')).toBe(true);
    expect(patched.includes('target: "root"')).toBe(true);
  });

  it('create: washi-tape 타입은 WashiTape JSX로 생성된다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas><Node id="root" /></Canvas>;
      }
    `);

    await patchNodeCreate(filePath, {
      id: 'w-new',
      type: 'washi-tape',
      props: {
        pattern: { type: 'preset', id: 'pastel-dots' },
        at: { type: 'polar', x: 30, y: 40, length: 200, thickness: 32 },
        opacity: 0.85,
      },
    });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('<WashiTape')).toBe(true);
    expect(patched.includes('id={"w-new"}')).toBe(true);
    expect(patched.includes('type: "preset"')).toBe(true);
    expect(patched.includes('id: "pastel-dots"')).toBe(true);
    expect(patched.includes('length: 200')).toBe(true);
  });

  it('update: object props를 JSX object expression으로 반영한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas><WashiTape id="w1" pattern={{ type: "preset", id: "pastel-dots" }} /></Canvas>;
      }
    `);

    await patchFile(filePath, 'w1', {
      at: { type: 'segment', from: { x: 0, y: 0 }, to: { x: 120, y: 40 }, thickness: 28 },
      pattern: { type: 'preset', id: 'kraft-grid' },
      opacity: 0.92,
    });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('type: "segment"')).toBe(true);
    expect(patched.includes('id: "kraft-grid"')).toBe(true);
    expect(patched.includes('opacity={0.92}')).toBe(true);
  });

  it('update: attach 상대 이동에서 Washi at.offset만 갱신해도 기존 필드를 보존한다', async () => {
    const filePath = await makeTempTsx(ATTACH_FIXTURE_TSX);

    await patchFile(filePath, 'washi-1', {
      at: { offset: 44 },
    });

    const patched = await readFile(filePath, 'utf-8');
    expectIncludesAll(patched, [
      'id="washi-1"',
      'target: "target"',
      'placement: "top"',
      'span: 0.8',
      'align: 0.5',
      'offset: 44',
    ]);
  });

  it('update: attach 상대 이동에서 Sticker gap만 갱신한다', async () => {
    const filePath = await makeTempTsx(ATTACH_FIXTURE_TSX);

    await patchFile(filePath, 'sticker-1', {
      gap: 62,
    });

    const patched = await readFile(filePath, 'utf-8');
    expectIncludesAll(patched, [
      'id="sticker-1"',
      'anchor={"target"}',
      'position={"right"}',
      'align={"center"}',
      'gap={62}',
    ]);
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

  it('reparent: from object 사용 시 edge payload를 보존한 채 node만 변경한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas>
          <Node id="a" />
          <Shape id="b" from={{ node: "a", edge: { label: { text: "link" }, pattern: "dashed" } }} />
        </Canvas>;
      }
    `);

    await patchNodeReparent(filePath, 'b', 'c');
    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('node: "c"')).toBe(true);
    expect(patched.includes('text: "link"')).toBe(true);
    expect(patched.includes('pattern: "dashed"')).toBe(true);
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

  it('detect: 전역 id 중복을 탐지한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas>
          <Node id="dup" />
          <Text id="dup">x</Text>
        </Canvas>;
      }
    `);

    const collisions = await getGlobalIdentifierCollisions(filePath);
    expect(collisions).toEqual(['dup']);
  });

  it('update: id를 기존 id로 바꾸려 하면 ID_COLLISION 에러', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Canvas>
          <Node id="a" />
          <Node id="b" />
        </Canvas>;
      }
    `);

    await expect(patchFile(filePath, 'a', { id: 'b' })).rejects.toThrow('ID_COLLISION');
  });
});
