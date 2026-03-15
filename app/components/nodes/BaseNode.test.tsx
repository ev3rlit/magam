import { describe, expect, it } from 'bun:test';
import { resolveBaseNodeInlineStyle } from './BaseNode';

describe('BaseNode runtime style layering', () => {
  it('merges base style, runtime style, and hover style in order', () => {
    expect(resolveBaseNodeInlineStyle({
      style: {
        backgroundColor: '#ffffff',
        opacity: 0.7,
      },
      runtimeStyle: {
        backgroundColor: '#f1f5f9',
        borderRadius: '0.75rem',
      },
      hoverStyle: {
        backgroundColor: '#0f172a',
        color: '#ffffff',
      },
      isHovered: true,
    })).toEqual({
      backgroundColor: '#0f172a',
      opacity: 0.7,
      borderRadius: '0.75rem',
      color: '#ffffff',
    });
  });

  it('keeps hover style inactive until hover state is entered', () => {
    expect(resolveBaseNodeInlineStyle({
      runtimeStyle: {
        backgroundColor: '#fef3c7',
      },
      hoverStyle: {
        backgroundColor: '#f59e0b',
      },
      isHovered: false,
    })).toEqual({
      backgroundColor: '#fef3c7',
    });
  });
});
