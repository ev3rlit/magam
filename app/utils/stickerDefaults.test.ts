import { describe, expect, it } from 'bun:test';
import { normalizeStickerData } from './stickerDefaults';

describe('normalizeStickerData', () => {
  it('applies defaults for text sticker', () => {
    const result = normalizeStickerData({ kind: 'text' });

    expect(result.kind).toBe('text');
    expect(result.outlineWidth).toBe(4);
    expect(result.outlineColor).toBe('#ffffff');
    expect(result.shadow).toBe('md');
    expect(result.bgColor).toBe('#fffef7');
    expect(result.textColor).toBe('#111827');
    expect(result.fontSize).toBe(20);
    expect(result.fontWeight).toBe(700);
    expect(result.padding).toBe(8);
  });

  it('uses emoji-specific default font size', () => {
    const result = normalizeStickerData({ kind: 'emoji' });
    expect(result.fontSize).toBe(40);
  });

  it('keeps explicit style overrides used in copy/paste payloads', () => {
    const result = normalizeStickerData({
      kind: 'image',
      outlineWidth: 10,
      outlineColor: '#abc123',
      shadow: 'lg',
      bgColor: '#101010',
      textColor: '#fafafa',
      fontSize: 18,
      fontWeight: 600,
      padding: 4,
    });

    expect(result).toMatchObject({
      kind: 'image',
      outlineWidth: 10,
      outlineColor: '#abc123',
      shadow: 'lg',
      bgColor: '#101010',
      textColor: '#fafafa',
      fontSize: 18,
      fontWeight: 600,
      padding: 4,
    });
  });
});
