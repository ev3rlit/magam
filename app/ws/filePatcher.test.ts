import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { patchFile } from './filePatcher';

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
  it('속성 업데이트 시 null이면 JSX attribute를 제거한다(icon omit 정책)', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Node id="n1" icon={"rocket"} label={"Hello"} />;
      }
    `);

    await patchFile(filePath, 'n1', {
      icon: null,
      label: 'Updated',
    });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('icon')).toBe(false);
    expect(patched.includes('label={"Updated"}')).toBe(true);
  });

  it('숫자/문자열/불린 값을 적절한 JSX 표현식으로 반영한다', async () => {
    const filePath = await makeTempTsx(`
      export default function Sample() {
        return <Node id="n2" />;
      }
    `);

    await patchFile(filePath, 'n2', {
      x: 120,
      label: 'Task',
      bubble: true,
    });

    const patched = await readFile(filePath, 'utf-8');
    expect(patched.includes('x={120}')).toBe(true);
    expect(patched.includes('label={"Task"}')).toBe(true);
    expect(patched.includes('bubble={true}')).toBe(true);
  });
});
