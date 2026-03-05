import {
  DEFAULT_SIZE_RATIO,
  DEFAULT_SIZE_TOKEN,
  LANDSCAPE_ASPECT_RATIO,
  OBJECT2D_SCALE,
  SPACE_SCALE,
  TYPOGRAPHY_SCALE,
  isKnownSizeToken,
  resolveObject2DTokenSize,
  type FontSizeInput,
  type MarkdownSizeInput,
  type NormalizedObjectSizeInput,
  type ObjectSizeInput,
  type ResolvedMarkdownSize,
  type ResolvedObject2D,
  type ResolvedTypography,
  type SizeCategory,
  type SizeRatio,
  type SizeToken,
  type SizeValue,
} from '@magam/core';
import { emitSizeWarning, type SizeWarningCode } from './sizeWarnings';

type Object2DDefault = { token: SizeToken; ratio: SizeRatio };

export const CATEGORY_DEFAULTS: {
  typography: SizeToken;
  space: SizeToken;
  object2d: Object2DDefault;
} = {
  typography: DEFAULT_SIZE_TOKEN,
  space: DEFAULT_SIZE_TOKEN,
  object2d: {
    token: DEFAULT_SIZE_TOKEN,
    ratio: DEFAULT_SIZE_RATIO,
  },
};

export interface SizeResolverContext {
  component?: string;
  inputPath?: string;
}

export interface NormalizeObjectSizeOptions extends SizeResolverContext {
  defaultRatio?: SizeRatio;
}

function emitWarning(
  code: SizeWarningCode,
  context: SizeResolverContext,
  fallbackApplied: string,
): void {
  emitSizeWarning({
    code,
    component: context.component ?? 'unknown',
    inputPath: context.inputPath ?? 'size',
    fallbackApplied,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isKnownTokenValue(value: unknown): value is SizeToken {
  return isKnownSizeToken(value);
}

export function isSizeRatio(value: unknown): value is SizeRatio {
  return value === 'landscape' || value === 'portrait' || value === 'square';
}

function normalizeRatio(
  ratio: unknown,
  context: SizeResolverContext,
  fallback: SizeRatio,
): SizeRatio {
  if (ratio === undefined) return fallback;
  if (isSizeRatio(ratio)) return ratio;
  emitWarning(
    'UNSUPPORTED_RATIO',
    context,
    `ratio=${CATEGORY_DEFAULTS.object2d.ratio}`,
  );
  return CATEGORY_DEFAULTS.object2d.ratio;
}

function resolveFallbackToken(category: SizeCategory): SizeToken {
  if (category === 'typography') return CATEGORY_DEFAULTS.typography;
  if (category === 'space') return CATEGORY_DEFAULTS.space;
  return CATEGORY_DEFAULTS.object2d.token;
}

function resolveTokenValue(token: SizeToken, category: SizeCategory): number {
  if (category === 'typography') {
    return TYPOGRAPHY_SCALE[token].fontSizePx;
  }
  if (category === 'space') {
    return SPACE_SCALE[token];
  }
  return OBJECT2D_SCALE[token].square.widthPx;
}

export function resolveSize(
  value: SizeValue | undefined,
  category: SizeCategory,
  context: SizeResolverContext = {},
): number {
  if (isValidNumber(value)) return value;
  if (isKnownTokenValue(value)) return resolveTokenValue(value, category);

  if (value !== undefined) {
    emitWarning(
      'UNSUPPORTED_TOKEN',
      context,
      `${category}=${resolveFallbackToken(category)}`,
    );
  }

  return resolveTokenValue(resolveFallbackToken(category), category);
}

export function resolveTypography(
  value: FontSizeInput | undefined,
  context: SizeResolverContext = {},
): ResolvedTypography {
  if (isValidNumber(value)) {
    return {
      fontSizePx: value,
      lineHeightPx: Math.max(Math.round(value * 1.5), value),
    };
  }

  if (isKnownTokenValue(value)) {
    const entry = TYPOGRAPHY_SCALE[value];
    return {
      fontSizePx: entry.fontSizePx,
      lineHeightPx: entry.lineHeightPx,
      tokenUsed: value,
    };
  }

  if (value !== undefined) {
    emitWarning(
      'UNSUPPORTED_TOKEN',
      context,
      `typography=${CATEGORY_DEFAULTS.typography}`,
    );
  }

  const fallback = TYPOGRAPHY_SCALE[CATEGORY_DEFAULTS.typography];
  return {
    fontSizePx: fallback.fontSizePx,
    lineHeightPx: fallback.lineHeightPx,
    tokenUsed: CATEGORY_DEFAULTS.typography,
  };
}

export function normalizeObjectSizeInput(
  input: ObjectSizeInput | undefined,
  options: NormalizeObjectSizeOptions = {},
): NormalizedObjectSizeInput {
  const context: SizeResolverContext = {
    component: options.component ?? 'unknown',
    inputPath: options.inputPath ?? 'size',
  };
  const defaultRatio = options.defaultRatio ?? CATEGORY_DEFAULTS.object2d.ratio;

  if (input === undefined) {
    return {
      mode: 'token',
      ratio: defaultRatio,
      token: CATEGORY_DEFAULTS.object2d.token,
      primitive: CATEGORY_DEFAULTS.object2d.token,
      width: null,
      height: null,
      source: context.inputPath ?? 'size',
    };
  }

  if (isValidNumber(input) || isKnownTokenValue(input)) {
    return {
      mode: 'token',
      ratio: defaultRatio,
      token: isKnownTokenValue(input) ? input : null,
      primitive: input,
      width: null,
      height: null,
      source: context.inputPath ?? 'size',
    };
  }

  if (!isRecord(input)) {
    emitWarning(
      'CONFLICTING_SIZE_INPUT',
      context,
      `object2d=${CATEGORY_DEFAULTS.object2d.token}+${CATEGORY_DEFAULTS.object2d.ratio}`,
    );
    return {
      mode: 'token',
      ratio: CATEGORY_DEFAULTS.object2d.ratio,
      token: CATEGORY_DEFAULTS.object2d.token,
      primitive: CATEGORY_DEFAULTS.object2d.token,
      width: null,
      height: null,
      source: context.inputPath ?? 'size',
    };
  }

  const hasToken = input.token !== undefined;
  const hasUniform = input.widthHeight !== undefined;
  const hasExplicit = input.width !== undefined || input.height !== undefined;
  const hasCompleteExplicit = input.width !== undefined && input.height !== undefined;
  const modes = [hasToken, hasUniform, hasCompleteExplicit].filter(Boolean).length;

  if (modes !== 1 || (hasExplicit && !hasCompleteExplicit)) {
    emitWarning(
      'CONFLICTING_SIZE_INPUT',
      context,
      `object2d=${CATEGORY_DEFAULTS.object2d.token}+${CATEGORY_DEFAULTS.object2d.ratio}`,
    );
    return {
      mode: 'token',
      ratio: CATEGORY_DEFAULTS.object2d.ratio,
      token: CATEGORY_DEFAULTS.object2d.token,
      primitive: CATEGORY_DEFAULTS.object2d.token,
      width: null,
      height: null,
      source: context.inputPath ?? 'size',
    };
  }

  if (hasToken) {
    const token = input.token;
    if (!isKnownTokenValue(token)) {
      emitWarning(
        'UNSUPPORTED_TOKEN',
        context,
        `object2d=${CATEGORY_DEFAULTS.object2d.token}+${CATEGORY_DEFAULTS.object2d.ratio}`,
      );
      return {
        mode: 'token',
        ratio: CATEGORY_DEFAULTS.object2d.ratio,
        token: CATEGORY_DEFAULTS.object2d.token,
        primitive: CATEGORY_DEFAULTS.object2d.token,
        width: null,
        height: null,
        source: context.inputPath ?? 'size',
      };
    }
    return {
      mode: 'token',
      ratio: normalizeRatio(input.ratio, context, defaultRatio),
      token,
      primitive: token,
      width: null,
      height: null,
      source: context.inputPath ?? 'size',
    };
  }

  if (hasUniform) {
    return {
      mode: 'uniform',
      ratio: 'square',
      token: null,
      primitive: null,
      width: input.widthHeight as SizeValue,
      height: input.widthHeight as SizeValue,
      source: context.inputPath ?? 'size',
    };
  }

  return {
    mode: 'explicit',
    ratio: defaultRatio,
    token: null,
    primitive: null,
    width: input.width as SizeValue,
    height: input.height as SizeValue,
    source: context.inputPath ?? 'size',
  };
}

function resolveFromBaseSize(baseSizePx: number, ratio: SizeRatio): ResolvedObject2D {
  const rounded = Math.round(baseSizePx);
  if (ratio === 'square') {
    return {
      widthPx: rounded,
      heightPx: rounded,
      ratioUsed: 'square',
    };
  }
  if (ratio === 'portrait') {
    return {
      widthPx: rounded,
      heightPx: Math.round(rounded * LANDSCAPE_ASPECT_RATIO),
      ratioUsed: 'portrait',
    };
  }
  return {
    widthPx: Math.round(rounded * LANDSCAPE_ASPECT_RATIO),
    heightPx: rounded,
    ratioUsed: 'landscape',
  };
}

export function resolveObject2D(
  normalized: NormalizedObjectSizeInput,
  context: SizeResolverContext = {},
): ResolvedObject2D {
  if (normalized.mode === 'uniform') {
    const base = resolveSize(normalized.width ?? CATEGORY_DEFAULTS.object2d.token, 'object2d', context);
    return {
      widthPx: base,
      heightPx: base,
      ratioUsed: 'square',
      tokenUsed: isKnownTokenValue(normalized.width) ? normalized.width : undefined,
    };
  }

  if (normalized.mode === 'explicit') {
    const widthPx = resolveSize(normalized.width ?? CATEGORY_DEFAULTS.object2d.token, 'object2d', {
      ...context,
      inputPath: `${context.inputPath ?? 'size'}.width`,
    });
    const heightPx = resolveSize(normalized.height ?? CATEGORY_DEFAULTS.object2d.token, 'object2d', {
      ...context,
      inputPath: `${context.inputPath ?? 'size'}.height`,
    });
    const ratioUsed =
      widthPx === heightPx ? 'square' : widthPx > heightPx ? 'landscape' : 'portrait';
    return { widthPx, heightPx, ratioUsed };
  }

  const primitive = normalized.primitive;
  if (isValidNumber(primitive)) {
    return resolveFromBaseSize(primitive, normalized.ratio);
  }

  if (isKnownTokenValue(primitive)) {
    const tokenResult = resolveObject2DTokenSize(primitive, normalized.ratio);
    return {
      widthPx: tokenResult.widthPx,
      heightPx: tokenResult.heightPx,
      ratioUsed: tokenResult.ratioUsed,
      tokenUsed: primitive,
    };
  }

  emitWarning(
    'UNSUPPORTED_TOKEN',
    context,
    `object2d=${CATEGORY_DEFAULTS.object2d.token}+${CATEGORY_DEFAULTS.object2d.ratio}`,
  );
  const fallback = resolveObject2DTokenSize(
    CATEGORY_DEFAULTS.object2d.token,
    CATEGORY_DEFAULTS.object2d.ratio,
  );
  return {
    widthPx: fallback.widthPx,
    heightPx: fallback.heightPx,
    ratioUsed: fallback.ratioUsed,
    tokenUsed: CATEGORY_DEFAULTS.object2d.token,
  };
}

export function resolveMarkdownSize(
  input: MarkdownSizeInput | undefined,
  context: NormalizeObjectSizeOptions = {},
): ResolvedMarkdownSize {
  if (
    input === undefined ||
    isValidNumber(input) ||
    isKnownTokenValue(input)
  ) {
    return {
      mode: 'typography',
      typography: resolveTypography(input, context),
    };
  }

  const normalized = normalizeObjectSizeInput(input as ObjectSizeInput, {
    ...context,
    defaultRatio: context.defaultRatio ?? CATEGORY_DEFAULTS.object2d.ratio,
  });

  return {
    mode: 'object2d',
    object2d: resolveObject2D(normalized, context),
  };
}

export function resolveShapeDefaultRatio(shapeType?: string): SizeRatio {
  if (shapeType === 'circle' || shapeType === 'triangle') {
    return 'square';
  }
  return 'landscape';
}
