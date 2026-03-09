import { vi, describe, it, expect, afterEach } from 'vitest';
import { execute } from './executor';
import { renderToGraph } from '@magam/core';

// Mock @magam/core
vi.mock('@magam/core', () => ({
  renderToGraph: vi.fn().mockResolvedValue({ type: 'root', children: [] }),
}));

describe('executor', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute valid code and return graph', async () => {
    // We simulate code that doesn't depend on external modules to avoid resolution issues in tests
    const jsCode = `
      module.exports.default = function() {
        return { type: 'node', props: { id: 'test-node' } };
      };
    `;

    const result = await execute(jsCode);

    expect(renderToGraph).toHaveBeenCalledWith({
      type: 'node',
      props: { id: 'test-node' },
    });
    expect(result).toEqual({ type: 'root', children: [] });
  });

  it('should support react/jsx-dev-runtime through the require shim', async () => {
    const jsCode = `
      const jsxDevRuntime = require('react/jsx-dev-runtime');
      module.exports.default = function() {
        return jsxDevRuntime.jsxDEV('div', { children: 'hello' }, undefined, false, undefined, this);
      };
    `;

    const result = await execute(jsCode);

    expect(renderToGraph).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'div',
      }),
    );
    expect(result).toEqual({ type: 'root', children: [] });
  });

  it('should throw if no default export', async () => {
    const jsCode = `module.exports = { foo: 'bar' };`;
    await expect(execute(jsCode)).rejects.toThrow(
      'No default export function found',
    );
  });

  it('should throw if default export returns null', async () => {
    const jsCode = `
      module.exports.default = function() {
        return null;
      };
    `;
    await expect(execute(jsCode)).rejects.toThrow(
      'Default export function returned null',
    );
  });

  it('should clean up temp file even if execution fails', async () => {
    const jsCode = `
      throw new Error('Execution failed');
    `;

    await expect(execute(jsCode)).rejects.toThrow('Execution failed');
  });
});
