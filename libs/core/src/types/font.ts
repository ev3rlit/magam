export type FontFamilyPreset = 'hand-gaegu' | 'hand-caveat' | 'sans-inter';

export function isFontFamilyPreset(value: unknown): value is FontFamilyPreset {
  return (
    value === 'hand-gaegu'
    || value === 'hand-caveat'
    || value === 'sans-inter'
  );
}
