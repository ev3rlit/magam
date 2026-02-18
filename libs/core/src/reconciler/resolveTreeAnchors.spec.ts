import { describe, expect, it } from 'bun:test';
import type { Container } from './hostConfig';
import { resolveTreeAnchors } from './resolveTreeAnchors';

describe('resolveTreeAnchors', () => {
  it('resolves local anchor ids inside the same scope', () => {
    const input: Container = {
      type: 'root',
      children: [
        {
          type: 'graph-shape',
          props: { id: 'infra.ref' },
          children: [],
        },
        {
          type: 'graph-mindmap',
          props: { id: 'infra.map', anchor: 'ref', position: 'bottom' },
          children: [],
        },
      ],
    };

    const output = resolveTreeAnchors(input);
    const mindmap = output.children[1];

    expect(mindmap.props.anchor).toBe('infra.ref');
  });

  it('keeps cross-scope anchor ids unchanged when scoped candidate does not exist', () => {
    const input: Container = {
      type: 'root',
      children: [
        {
          type: 'graph-shape',
          props: { id: 'gateway' },
          children: [],
        },
        {
          type: 'graph-shape',
          props: { id: 'auth.lb', anchor: 'gateway', position: 'bottom' },
          children: [],
        },
      ],
    };

    const output = resolveTreeAnchors(input);
    const lb = output.children[1];

    expect(lb.props.anchor).toBe('gateway');
  });
});
