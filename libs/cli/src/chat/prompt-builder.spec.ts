import { describe, it, expect } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { buildPrompt } from './prompt-builder';

describe('buildPrompt', () => {
  it('collects current file and repository context', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-builder-'));
    await fs.writeFile(path.join(tmp, 'index.tsx'), 'export const App = () => <div>Hello</div>;');
    await fs.writeFile(path.join(tmp, 'README.md'), '# Example');

    const result = await buildPrompt({
      targetDir: tmp,
      userMessage: 'Fix the component',
      currentFile: 'index.tsx',
    });

    expect(result.prompt).toContain('Fix the component');
    expect(result.prompt).toContain('Current file (index.tsx)');
    expect(result.includedFiles).toContain('index.tsx');
    expect(result.includedFiles).toContain('README.md');
  });

  it('enforces max prompt size cap', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-builder-cap-'));
    await fs.writeFile(path.join(tmp, 'index.tsx'), 'x'.repeat(5000));

    const result = await buildPrompt({
      targetDir: tmp,
      userMessage: 'A'.repeat(5000),
      currentFile: 'index.tsx',
      maxBytes: 512,
    });

    expect(Buffer.byteLength(result.prompt, 'utf-8')).toBeLessThanOrEqual(512);
    expect(result.truncated).toBe(true);
  });

  it('ignores current file outside targetDir', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-builder-safe-'));

    const result = await buildPrompt({
      targetDir: tmp,
      userMessage: 'inspect',
      currentFile: '../outside.txt',
    });

    expect(result.prompt).toContain('ignored because it is outside working directory');
  });

  it('includes mentioned files and multiple node summaries', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-builder-mentions-'));
    await fs.mkdir(path.join(tmp, 'src'), { recursive: true });
    await fs.writeFile(path.join(tmp, 'src', 'a.ts'), 'export const a = 1;');
    await fs.writeFile(path.join(tmp, 'src', 'b.ts'), 'export const b = 2;');

    const result = await buildPrompt({
      targetDir: tmp,
      userMessage: 'Use mentions',
      fileMentions: [{ path: 'src/a.ts' }, { path: '../outside.ts' }, { path: 'src/b.ts' }],
      nodeMentions: [
        { id: 'n1', title: 'Auth', summary: 'Handles login state' },
        { id: 'n2', type: 'markdown', summary: 'Contains onboarding copy' },
      ],
    });

    expect(result.prompt).toContain('Mentioned file (src/a.ts)');
    expect(result.prompt).toContain('Mentioned file (src/b.ts)');
    expect(result.prompt).toContain('ignored because it is outside working directory');
    expect(result.prompt).toContain('Selected node context');
    expect(result.prompt).toContain('id=n1');
    expect(result.prompt).toContain('id=n2');
  });

  it('caps mention counts and marks prompt as truncated', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-builder-mentions-cap-'));
    await fs.mkdir(path.join(tmp, 'src'), { recursive: true });

    for (let i = 0; i < 15; i += 1) {
      await fs.writeFile(path.join(tmp, 'src', `f-${i}.ts`), `export const v${i} = ${i};`);
    }

    const fileMentions = Array.from({ length: 15 }, (_, i) => ({ path: `src/f-${i}.ts` }));
    const nodeMentions = Array.from({ length: 30 }, (_, i) => ({ id: `n-${i}`, summary: `summary-${i}` }));

    const result = await buildPrompt({
      targetDir: tmp,
      userMessage: 'large mentions',
      fileMentions,
      nodeMentions,
    });

    expect(result.truncated).toBe(true);
    expect((result.prompt.match(/Mentioned file \(/g) ?? []).length).toBe(10);
    expect(result.prompt).toContain('summary-19');
    expect(result.prompt).not.toContain('summary-29');
  });
});
