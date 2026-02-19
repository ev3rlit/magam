export type StickerKind = 'image' | 'text' | 'emoji';

export interface StickerNormalized {
  kind: StickerKind;
  outlineWidth: number;
  outlineColor: string;
  shadow: 'none' | 'sm' | 'md' | 'lg';
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: number;
  padding: number;
}

export function normalizeStickerData(input: Record<string, any>): StickerNormalized {
  const rawKind = input?.kind;
  const kind: StickerKind =
    rawKind === 'image' || rawKind === 'text' || rawKind === 'emoji'
      ? rawKind
      : 'text';

  return {
    kind,
    outlineWidth: typeof input?.outlineWidth === 'number' ? input.outlineWidth : 4,
    outlineColor: input?.outlineColor || '#ffffff',
    shadow: input?.shadow === 'none' || input?.shadow === 'sm' || input?.shadow === 'md' || input?.shadow === 'lg'
      ? input.shadow
      : 'md',
    bgColor: input?.bgColor || '#fffef7',
    textColor: input?.textColor || '#111827',
    fontSize: typeof input?.fontSize === 'number' ? input.fontSize : kind === 'emoji' ? 40 : 20,
    fontWeight: typeof input?.fontWeight === 'number' ? input.fontWeight : 700,
    padding: typeof input?.padding === 'number' ? input.padding : 8,
  };
}
