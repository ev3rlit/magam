import { transpile } from './transpiler';
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

    expect(result).toContain('require("react")'); // Should still require react (external)
    expect(result).toContain('createElement'); // JSX transformed
    expect(result).toContain('module.exports'); // Exported as CJS
  });

  it('should throw error on invalid syntax', async () => {
    const code = `
       this is invalid syntax
     `;
    fs.writeFileSync(tmpFile, code);

    await expect(transpile(tmpFile)).rejects.toThrow();
  });
});
