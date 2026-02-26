import { describe, expect, it } from 'bun:test';
import {
  DEFAULT_GLOBAL_FONT_FAMILY,
  hasExplicitFontFamilyClass,
  isFontFamilyPreset,
  resolveEffectiveFontFamily,
  resolveFontFamilyCssValue,
} from './fontHierarchy';

describe('fontHierarchy', () => {
  it('resolves fallback priority: global only', () => {
    expect(resolveEffectiveFontFamily({
      globalFontFamily: 'hand-caveat',
    })).toBe('hand-caveat');
  });

  it('resolves fallback priority: canvas overrides global', () => {
    expect(resolveEffectiveFontFamily({
      globalFontFamily: 'hand-caveat',
      canvasFontFamily: 'sans-inter',
    })).toBe('sans-inter');
  });

  it('resolves fallback priority: node overrides canvas/global', () => {
    expect(resolveEffectiveFontFamily({
      globalFontFamily: 'hand-caveat',
      canvasFontFamily: 'sans-inter',
      nodeFontFamily: 'hand-gaegu',
    })).toBe('hand-gaegu');
  });

  it('falls back to default when all levels are unset', () => {
    expect(resolveEffectiveFontFamily({})).toBe(DEFAULT_GLOBAL_FONT_FAMILY);
  });

  it('creates css var value for resolved preset', () => {
    expect(resolveFontFamilyCssValue({
      globalFontFamily: 'hand-gaegu',
    })).toBe('var(--font-preset-hand-gaegu)');
  });

  it('detects explicit font-family utility classes', () => {
    expect(hasExplicitFontFamilyClass('text-sm font-medium font-serif')).toBe(true);
    expect(hasExplicitFontFamilyClass('text-sm font-medium')).toBe(false);
  });

  it('validates supported preset values', () => {
    expect(isFontFamilyPreset('hand-gaegu')).toBe(true);
    expect(isFontFamilyPreset('sans-inter')).toBe(true);
    expect(isFontFamilyPreset('unknown')).toBe(false);
  });
});
