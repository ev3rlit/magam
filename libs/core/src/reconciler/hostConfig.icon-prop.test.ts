import { describe, expect, it } from 'bun:test';
import { createInstance, type Container } from './hostConfig';
import { MagamError } from '../errors';

describe('hostConfig legacy icon prop guard', () => {
  const root: Container = { type: 'root', children: [] };

  it('throws explicit migration error when icon prop is used on graph-shape', () => {
    expect(() =>
      createInstance('graph-shape', { id: 's1', x: 0, y: 0, icon: 'rocket' }, root, {}, null),
    ).toThrow(MagamError);

    expect(() =>
      createInstance('graph-shape', { id: 's1', x: 0, y: 0, icon: 'rocket' }, root, {}, null),
    ).toThrow('Migration: remove icon=... and declare a Lucide icon as a child');
  });

  it('does not throw when icon prop is absent', () => {
    expect(() =>
      createInstance('graph-shape', { id: 's1', x: 0, y: 0, label: 'ok' }, root, {}, null),
    ).not.toThrow();
  });
});
