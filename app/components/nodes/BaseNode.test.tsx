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
      focusStyle: {
        outlineWidth: '2px',
      },
      isHovered: true,
      isFocused: false,
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
      isFocused: false,
    })).toEqual({
      backgroundColor: '#fef3c7',
    });
  });

  it('applies focus style without requiring hover state', () => {
    expect(resolveBaseNodeInlineStyle({
      runtimeStyle: {
        borderColor: '#cbd5e1',
      },
      focusStyle: {
        borderColor: '#06b6d4',
        boxShadow: '0 0 0 3px #cffafe',
      },
      isHovered: false,
      isFocused: true,
    })).toEqual({
      borderColor: '#06b6d4',
      boxShadow: '0 0 0 3px #cffafe',
    });
  });
});
