import { normalizeInputPath, transpile } from './transpiler';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('transpiler', () => {
  let tmpDir: string;
  let tmpFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'transpiler-test-'));
    tmpFile = path.join(tmpDir, 'test.tsx');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should transpile TSX to CJS', async () => {
    const code = `
      import React from 'react';
      export const Component = () => <div>Hello</div>;
    `;
    fs.writeFileSync(tmpFile, code);

    const result = await transpile(tmpFile);

    expect(result).toContain('require("react'); // Should still require React runtime as external
    expect(result).toContain('jsxDEV'); // JSX transformed
    expect(result).toContain('module.exports'); // Exported as CJS
  });

  it('should throw error on invalid syntax', async () => {
    const code = `
       this is invalid syntax
     `;
    fs.writeFileSync(tmpFile, code);

    await expect(transpile(tmpFile)).rejects.toThrow();
  });

  it('normalizes workspace-relative metafile inputs without duplicating the entry directory', () => {
    const workspaceRoot = tmpDir;
    const nestedDir = path.join(tmpDir, 'notes');
    fs.mkdirSync(nestedDir, { recursive: true });
    const entryPoint = path.join(nestedDir, 'data-storage-mindmap.tsx');
    const workspaceRelativeInput = 'notes/data-storage-mindmap.tsx';

    fs.writeFileSync(entryPoint, 'export default null;');

    const normalized = normalizeInputPath(entryPoint, workspaceRelativeInput, workspaceRoot);

    expect(normalized).toBe(entryPoint);
  });

  it('keeps entry-relative import paths relative to the entry file', () => {
    const workspaceRoot = tmpDir;
    const entryDir = path.join(tmpDir, 'notes');
    const componentsDir = path.join(entryDir, 'components');
    fs.mkdirSync(componentsDir, { recursive: true });
    const entryPoint = path.join(entryDir, 'main.tsx');
    const componentPath = path.join(componentsDir, 'auth.tsx');

    fs.writeFileSync(entryPoint, 'export default null;');
    fs.writeFileSync(componentPath, 'export default null;');

    const normalized = normalizeInputPath(entryPoint, './components/auth.tsx', workspaceRoot);

    expect(normalized).toBe(componentPath);
  });
});
