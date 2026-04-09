import {
  MATERIAL_PRESET_REGISTRY,
  pasteldots,
  postit,
  type MaterialPresetId,
  type PaperMaterial,
  type PaperTextureParams,
} from '@magam/core';

export interface StickerNormalized {
  outlineWidth: number;
  outlineColor: string;
  shadow: 'none' | 'sm' | 'md' | 'lg';
  padding: number;
}

export interface ResolvedPaperPattern {
  kind: 'preset' | 'solid' | 'svg' | 'image';
  presetId: MaterialPresetId;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
  textColor?: string;
  texture?: PaperTextureParams;
  fallbackApplied: boolean;
  debugReason?: string;
}

const DEFAULT_WASHI_PRESET_ID: MaterialPresetId = pasteldots;
const DEFAULT_STICKY_PRESET_ID: MaterialPresetId = postit;
const MAX_INLINE_MARKUP_LENGTH = 16_384;
const OUTLINE_WIDTH_MIN = 8;
const OUTLINE_WIDTH_MAX = 14;

const STICKER_JITTER_ANGLES = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5] as const;
const WASHI_ROTATION_JITTER_ANGLES = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5] as const;
const WASHI_SHAPE_SKEW_ANGLES = [-2.4, -2.2, -2.0, 2.0, 2.2, 2.4] as const;

function hashFNV1a(input: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function isCssColorLike(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) return false;
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('rgb(') || trimmed.startsWith('rgba(')) return true;
  if (trimmed.startsWith('hsl(') || trimmed.startsWith('hsla(')) return true;
  if (trimmed.startsWith('var(')) return true;

  return /^[a-zA-Z]+$/.test(trimmed);
}

function clampOutlineWidth(value: unknown): number {
  const base = typeof value === 'number' && Number.isFinite(value) ? value : OUTLINE_WIDTH_MIN;

  return Math.max(OUTLINE_WIDTH_MIN, Math.min(OUTLINE_WIDTH_MAX, Math.round(base)));
}

function clampPadding(value: unknown): number {
  const base = typeof value === 'number' && Number.isFinite(value) ? value : 12;

  return Math.max(0, Math.round(base));
}

function encodeSvgDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function resolvePresetPatternId(
  value: unknown,
  fallbackPresetId: MaterialPresetId,
): MaterialPresetId {
  if (typeof value === 'string' && value in MATERIAL_PRESET_REGISTRY) {
    return value as MaterialPresetId;
  }

  if (value && typeof value === 'object') {
    const candidate = 'id' in value ? value.id : 'name' in value ? value.name : undefined;

    if (typeof candidate === 'string' && candidate in MATERIAL_PRESET_REGISTRY) {
      return candidate as MaterialPresetId;
    }
  }

  return fallbackPresetId;
}

function sanitizeInlineSvgMarkup(markup: string): string | null {
  const trimmed = markup.trim();

  if (!trimmed || trimmed.length > MAX_INLINE_MARKUP_LENGTH || !trimmed.includes('<svg')) {
    return null;
  }

  const withoutScripts = trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '');

  return withoutScripts.replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, '');
}

function resolvePresetStyle(
  presetId: MaterialPresetId,
  fallbackPresetId: MaterialPresetId,
): ResolvedPaperPattern {
  const resolvedPresetId = resolvePresetPatternId(presetId, fallbackPresetId);
  const preset = MATERIAL_PRESET_REGISTRY[resolvedPresetId];

  return {
    kind: 'preset',
    presetId: resolvedPresetId,
    backgroundColor: preset.backgroundColor,
    backgroundImage: 'backgroundImage' in preset ? preset.backgroundImage : undefined,
    backgroundRepeat: 'backgroundImage' in preset && preset.backgroundImage ? 'repeat' : undefined,
    backgroundSize: 'backgroundSize' in preset ? preset.backgroundSize : undefined,
    textColor: preset.textColor,
    texture: preset.texture,
    fallbackApplied: false,
  };
}

export function normalizeStickerData(input: Record<string, unknown>): StickerNormalized {
  const shadow =
    input.shadow === 'none' || input.shadow === 'sm' || input.shadow === 'md' || input.shadow === 'lg'
      ? input.shadow
      : 'md';

  return {
    outlineWidth: clampOutlineWidth(input.outlineWidth),
    outlineColor: typeof input.outlineColor === 'string' && input.outlineColor ? input.outlineColor : '#ffffff',
    shadow,
    padding: clampPadding(input.padding),
  };
}

export function getStickerJitterAngle(seed: string): number {
  const safeSeed = seed && seed.trim().length > 0 ? seed : 'sticker-default';
  const hash = hashFNV1a(`sticker:${safeSeed}`);

  return STICKER_JITTER_ANGLES[hash % STICKER_JITTER_ANGLES.length];
}

export function resolveStickerRotation(explicitRotation: unknown, seed: string): number {
  if (typeof explicitRotation === 'number' && Number.isFinite(explicitRotation)) {
    return explicitRotation;
  }

  return getStickerJitterAngle(seed);
}

export function getWashiShapeSkewAngle(seed: string): number {
  const safeSeed = seed && seed.trim().length > 0 ? seed : 'washi-default';
  const hash = hashFNV1a(`washi-shape:${safeSeed}`);

  return WASHI_SHAPE_SKEW_ANGLES[hash % WASHI_SHAPE_SKEW_ANGLES.length];
}

export function getWashiJitterAngle(seed: string): number {
  const safeSeed = seed && seed.trim().length > 0 ? seed : 'washi-default';
  const hash = hashFNV1a(`washi:${safeSeed}`);

  return WASHI_ROTATION_JITTER_ANGLES[hash % WASHI_ROTATION_JITTER_ANGLES.length];
}

export function resolveWashiAngle(explicitAngle: unknown, seed: string): number {
  if (typeof explicitAngle === 'number' && Number.isFinite(explicitAngle)) {
    return explicitAngle;
  }

  return getWashiJitterAngle(seed);
}

export function resolvePaperPattern(
  pattern: PaperMaterial | Record<string, unknown> | undefined,
  fallbackPresetId: MaterialPresetId,
): ResolvedPaperPattern {
  if (!pattern || typeof pattern !== 'object' || !('type' in pattern)) {
    return resolvePresetStyle(fallbackPresetId, fallbackPresetId);
  }

  if (pattern.type === 'preset') {
    const requestedPresetId =
      typeof pattern.id === 'string' ? pattern.id : 'name' in pattern ? pattern.name : undefined;
    const resolved = resolvePresetStyle(
      resolvePresetPatternId(pattern, fallbackPresetId),
      fallbackPresetId,
    );

    if (
      typeof pattern.color === 'string' &&
      pattern.color.trim() !== '' &&
      isCssColorLike(pattern.color)
    ) {
      return {
        ...resolved,
        backgroundColor: pattern.color.trim(),
      };
    }

    if (!(typeof requestedPresetId === 'string' && requestedPresetId in MATERIAL_PRESET_REGISTRY)) {
      return {
        ...resolved,
        fallbackApplied: true,
        debugReason: 'unknown-preset-id',
      };
    }

    return resolved;
  }

  if (pattern.type === 'solid') {
    if (typeof pattern.color === 'string' && isCssColorLike(pattern.color)) {
      return {
        kind: 'solid',
        presetId: fallbackPresetId,
        backgroundColor: pattern.color.trim(),
        fallbackApplied: false,
      };
    }

    return {
      ...resolvePresetStyle(fallbackPresetId, fallbackPresetId),
      fallbackApplied: true,
      debugReason: 'invalid-solid-color',
    };
  }

  if (pattern.type === 'svg') {
    if (typeof pattern.markup === 'string' && pattern.markup.trim() !== '') {
      const sanitized = sanitizeInlineSvgMarkup(pattern.markup);

      if (sanitized) {
        return {
          kind: 'svg',
          presetId: fallbackPresetId,
          backgroundImage: encodeSvgDataUri(sanitized),
          backgroundRepeat: 'repeat',
          backgroundSize: '24px 24px',
          fallbackApplied: false,
        };
      }

      return {
        ...resolvePresetStyle(fallbackPresetId, fallbackPresetId),
        fallbackApplied: true,
        debugReason: 'invalid-inline-svg-markup',
      };
    }

    if (typeof pattern.src === 'string' && pattern.src.trim() !== '') {
      return {
        kind: 'svg',
        presetId: fallbackPresetId,
        backgroundImage: `url("${pattern.src}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '24px 24px',
        fallbackApplied: false,
      };
    }

    return {
      ...resolvePresetStyle(fallbackPresetId, fallbackPresetId),
      fallbackApplied: true,
      debugReason: 'missing-svg-source',
    };
  }

  if (pattern.type === 'image') {
    if (typeof pattern.src === 'string' && pattern.src.trim() !== '') {
      const scale =
        typeof pattern.scale === 'number' && Number.isFinite(pattern.scale)
          ? Math.max(0.25, Math.min(pattern.scale, 4))
          : 1;
      const repeat = pattern.repeat === 'repeat-x' || pattern.repeat === 'repeat' ? pattern.repeat : 'no-repeat';

      return {
        kind: 'image',
        presetId: fallbackPresetId,
        backgroundImage: `url("${pattern.src}")`,
        backgroundRepeat: repeat,
        backgroundSize: pattern.repeat === 'stretch' ? '100% 100%' : `${Math.round(64 * scale)}px auto`,
        fallbackApplied: false,
      };
    }

    return {
      ...resolvePresetStyle(fallbackPresetId, fallbackPresetId),
      fallbackApplied: true,
      debugReason: 'missing-image-source',
    };
  }

  return {
    ...resolvePresetStyle(fallbackPresetId, fallbackPresetId),
    fallbackApplied: true,
    debugReason: 'unsupported-pattern-type',
  };
}

export function resolveWashiPattern(
  pattern: PaperMaterial | Record<string, unknown> | undefined,
): ResolvedPaperPattern {
  return resolvePaperPattern(pattern, DEFAULT_WASHI_PRESET_ID);
}

export function resolveStickyPattern(
  pattern: PaperMaterial | Record<string, unknown> | undefined,
): ResolvedPaperPattern {
  return resolvePaperPattern(pattern, DEFAULT_STICKY_PRESET_ID);
}

export function buildPaperTextureStyle(
  texture: PaperTextureParams | undefined,
  baseBackgroundImage: string | undefined,
  baseBackgroundSize: string | undefined,
): CSSPropertiesResult {
  if (!texture) {
    return {
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.16)',
    };
  }

  const { glossOpacity = 0, insetShadowOpacity = 0, shadowWarmth = 0 } = texture;
  const glossLayer =
    glossOpacity > 0
      ? `linear-gradient(180deg, rgba(255,255,255,${glossOpacity}), transparent 30%)`
      : null;

  let backgroundImage: string | undefined;
  let backgroundSize: string | undefined;

  if (glossLayer) {
    backgroundImage = baseBackgroundImage ? `${glossLayer}, ${baseBackgroundImage}` : glossLayer;
    backgroundSize = baseBackgroundSize ? `100% 100%, ${baseBackgroundSize}` : '100% 100%';
  }

  const r = Math.round(15 + (90 - 15) * shadowWarmth);
  const g = Math.round(23 + (62 - 23) * shadowWarmth);
  const b = Math.round(42 + (40 - 42) * shadowWarmth);
  const insetPart =
    insetShadowOpacity > 0 ? `inset 0 -2px 4px rgba(0,0,0,${insetShadowOpacity})` : null;
  const outerShadow = `0 8px 20px rgba(${r},${g},${b},0.16)`;

  return {
    ...(backgroundImage ? { backgroundImage, backgroundSize } : {}),
    boxShadow: insetPart ? `${outerShadow}, ${insetPart}` : outerShadow,
  };
}

interface CSSPropertiesResult {
  backgroundImage?: string;
  backgroundSize?: string;
  boxShadow: string;
}
