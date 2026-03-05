export interface SizeTokenRegistry {
  xs: true;
  s: true;
  m: true;
  l: true;
  xl: true;
}

export type SizeToken = keyof SizeTokenRegistry & string;
export type SizeRatio = 'landscape' | 'portrait' | 'square';
export type SizeCategory = 'typography' | 'space' | 'object2d';
export type SizeValue = number | SizeToken;

export type FontSizeInput = SizeValue;

export type ObjectSizeInput =
  | SizeToken
  | number
  | { token: SizeToken; ratio?: SizeRatio }
  | { widthHeight: SizeValue }
  | { width: SizeValue; height: SizeValue };

export type MarkdownSizeInput =
  | SizeValue
  | { token: SizeToken; ratio?: SizeRatio }
  | { widthHeight: SizeValue }
  | { width: SizeValue; height: SizeValue };

export interface TypographyScaleEntry {
  fontSizePx: number;
  lineHeightPx: number;
}

export interface Object2DScaleEntry {
  landscape: {
    widthPx: number;
    heightPx: number;
  };
  square: {
    widthPx: number;
    heightPx: number;
  };
}

export type NormalizedObjectSizeMode = 'token' | 'uniform' | 'explicit';

export interface NormalizedObjectSizeInput {
  mode: NormalizedObjectSizeMode;
  ratio: SizeRatio;
  token: SizeToken | null;
  primitive: SizeValue | null;
  width: SizeValue | null;
  height: SizeValue | null;
  source: string;
}

export interface ResolvedTypography {
  fontSizePx: number;
  lineHeightPx: number;
  tokenUsed?: SizeToken;
}

export interface ResolvedObject2D {
  widthPx: number;
  heightPx: number;
  ratioUsed: SizeRatio;
  tokenUsed?: SizeToken;
}

export type ResolvedMarkdownSize =
  | { mode: 'typography'; typography: ResolvedTypography }
  | { mode: 'object2d'; object2d: ResolvedObject2D };

