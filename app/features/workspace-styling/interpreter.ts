import {
  classifyTokens,
  getCategoryPriority,
} from './classCategories';
import {
  createMixedInputDiagnostic,
  createOutOfScopeObjectDiagnostic,
  createUnsupportedCategoryDiagnostic,
  createUnsupportedTokenDiagnostic,
  dedupeDiagnostics,
} from './diagnostics';
import type {
  EligibleObjectProfile,
  InterpretedStyleResult,
  ResolvedStylePayload,
  StylingDiagnostic,
  WorkspaceStyleCategory,
  WorkspaceStyleInput,
} from './types';

type StyleAccumulator = {
  style: Record<string, string | number>;
  ringWidth: number;
  ringColor: string;
  ringOffsetWidth: number;
  ringOffsetColor: string;
  shadowValue?: string;
};

const COLOR_PALETTES: Record<string, Record<string, string> | string> = {
  white: '#ffffff',
  black: '#000000',
  slate: {
    '50': '#f8fafc',
    '100': '#f1f5f9',
    '200': '#e2e8f0',
    '300': '#cbd5e1',
    '400': '#94a3b8',
    '500': '#64748b',
    '600': '#475569',
    '700': '#334155',
    '800': '#1e293b',
    '900': '#0f172a',
    '950': '#020617',
  },
  amber: {
    '100': '#fef3c7',
    '200': '#fde68a',
    '300': '#fcd34d',
    '400': '#fbbf24',
    '500': '#f59e0b',
    '600': '#d97706',
    '700': '#b45309',
  },
  blue: {
    '100': '#dbeafe',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '500': '#3b82f6',
    '600': '#2563eb',
    '700': '#1d4ed8',
  },
  red: {
    '100': '#fee2e2',
    '200': '#fecaca',
    '300': '#fca5a5',
    '400': '#f87171',
    '500': '#ef4444',
    '600': '#dc2626',
    '700': '#b91c1c',
  },
  green: {
    '100': '#dcfce7',
    '200': '#bbf7d0',
    '300': '#86efac',
    '400': '#4ade80',
    '500': '#22c55e',
    '600': '#16a34a',
    '700': '#15803d',
  },
  violet: {
    '100': '#ede9fe',
    '200': '#ddd6fe',
    '300': '#c4b5fd',
    '400': '#a78bfa',
    '500': '#8b5cf6',
    '600': '#7c3aed',
    '700': '#6d28d9',
  },
  cyan: {
    '100': '#cffafe',
    '200': '#a5f3fc',
    '300': '#67e8f9',
    '400': '#22d3ee',
    '500': '#06b6d4',
    '600': '#0891b2',
    '700': '#0e7490',
  },
  yellow: {
    '100': '#fef9c3',
    '200': '#fef08a',
    '300': '#fde047',
    '400': '#facc15',
    '500': '#eab308',
  },
};

function tokenizeClassName(className: string): string[] {
  return className
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function isArbitraryValue(value: string): boolean {
  return value.startsWith('[') && value.endsWith(']');
}

function unwrapArbitraryValue(value: string): string {
  return value.slice(1, -1).replaceAll('_', ' ');
}

function resolveFraction(value: string): string | null {
  const [numerator, denominator] = value.split('/');
  const top = Number(numerator);
  const bottom = Number(denominator);
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom === 0) {
    return null;
  }
  return `${(top / bottom) * 100}%`;
}

function resolveSpacingLikeValue(value: string, axis: 'width' | 'height'): string | null {
  if (isArbitraryValue(value)) {
    return unwrapArbitraryValue(value);
  }
  if (value === 'px') return '1px';
  if (value === 'auto') return 'auto';
  if (value === 'full') return '100%';
  if (value === 'fit') return 'fit-content';
  if (value === 'min') return 'min-content';
  if (value === 'max') return 'max-content';
  if (value === 'screen') return axis === 'width' ? '100vw' : '100vh';
  if (value.includes('/')) {
    return resolveFraction(value);
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `${numeric / 4}rem`;
  }
  return null;
}

function resolveRadiusValue(token: string): string | null {
  if (token === 'rounded') return '0.25rem';
  const suffix = token.slice('rounded-'.length);
  if (isArbitraryValue(suffix)) {
    return unwrapArbitraryValue(suffix);
  }
  const radiusBySuffix: Record<string, string> = {
    none: '0px',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  };
  return radiusBySuffix[suffix] ?? null;
}

function resolveOpacityValue(token: string): number | null {
  const value = token.slice('opacity-'.length);
  if (isArbitraryValue(value)) {
    const parsed = Number(unwrapArbitraryValue(value));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(1, numeric / 100));
}

function resolveWidthValue(token: string): { property: string; value: string } | null {
  const mappings: Array<[prefix: string, property: string, axis: 'width' | 'height']> = [
    ['min-w-', 'minWidth', 'width'],
    ['max-w-', 'maxWidth', 'width'],
    ['min-h-', 'minHeight', 'height'],
    ['max-h-', 'maxHeight', 'height'],
    ['w-', 'width', 'width'],
    ['h-', 'height', 'height'],
  ];

  for (const [prefix, property, axis] of mappings) {
    if (!token.startsWith(prefix)) continue;
    const rawValue = token.slice(prefix.length);
    const resolved = resolveSpacingLikeValue(rawValue, axis);
    if (!resolved) return null;
    return { property, value: resolved };
  }

  return null;
}

function resolveColorValue(rawToken: string): string | null {
  const [baseToken, alphaToken] = rawToken.split('/');
  if (isArbitraryValue(rawToken)) {
    return unwrapArbitraryValue(rawToken);
  }
  if (baseToken === 'white' || baseToken === 'black' || baseToken === 'transparent' || baseToken === 'current') {
    if (!alphaToken) {
      return baseToken;
    }
    const named = baseToken === 'white' ? '#ffffff' : baseToken === 'black' ? '#000000' : null;
    if (!named) return baseToken;
    const alpha = Number(alphaToken);
    if (!Number.isFinite(alpha)) return named;
    const normalizedAlpha = Math.max(0, Math.min(1, alpha / 100));
    return `rgba(${baseToken === 'white' ? '255, 255, 255' : '0, 0, 0'}, ${normalizedAlpha})`;
  }

  const segments = baseToken.split('-');
  const paletteName = segments[0];
  const shade = segments.slice(1).join('-');
  const palette = COLOR_PALETTES[paletteName];

  if (typeof palette === 'string' && shade.length === 0) {
    if (!alphaToken) {
      return palette;
    }
    const alpha = Number(alphaToken);
    if (!Number.isFinite(alpha) || !palette.startsWith('#')) {
      return palette;
    }
    const normalizedAlpha = Math.max(0, Math.min(1, alpha / 100));
    const r = parseInt(palette.slice(1, 3), 16);
    const g = parseInt(palette.slice(3, 5), 16);
    const b = parseInt(palette.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
  }

  if (palette && typeof palette === 'object') {
    const candidate = (palette as Record<string, string>)[shade];
    if (typeof candidate === 'string') {
      if (!alphaToken) {
        return candidate;
      }
      const alpha = Number(alphaToken);
      if (!Number.isFinite(alpha) || !candidate.startsWith('#')) {
        return candidate;
      }
      const normalizedAlpha = Math.max(0, Math.min(1, alpha / 100));
      const r = parseInt(candidate.slice(1, 3), 16);
      const g = parseInt(candidate.slice(3, 5), 16);
      const b = parseInt(candidate.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
    }
  }

  return null;
}

function resolveBorderWidthValue(token: string): string | null {
  if (token === 'border') return '1px';
  const suffix = token.slice('border-'.length);
  if (isArbitraryValue(suffix)) {
    return unwrapArbitraryValue(suffix);
  }
  if (suffix === 'px') return '1px';
  const numeric = Number(suffix);
  if (Number.isFinite(numeric)) {
    return `${numeric}px`;
  }
  return null;
}

function resolveDirectionalBorderWidth(token: string): { property: string; value: string } | null {
  const mappings: Array<[prefix: string, property: string]> = [
    ['border-l-', 'borderLeftWidth'],
    ['border-r-', 'borderRightWidth'],
    ['border-t-', 'borderTopWidth'],
    ['border-b-', 'borderBottomWidth'],
  ];
  for (const [prefix, property] of mappings) {
    if (!token.startsWith(prefix)) continue;
    const suffix = token.slice(prefix.length);
    if (isArbitraryValue(suffix)) {
      return { property, value: unwrapArbitraryValue(suffix) };
    }
    const numeric = Number(suffix);
    if (Number.isFinite(numeric)) {
      return { property, value: `${numeric}px` };
    }
  }
  return null;
}

function resolveOutlineWidthValue(token: string): string | null {
  if (token === 'outline') return '1px';
  const suffix = token.slice('outline-'.length);
  if (isArbitraryValue(suffix)) {
    return unwrapArbitraryValue(suffix);
  }
  const numeric = Number(suffix);
  if (Number.isFinite(numeric)) {
    return `${numeric}px`;
  }
  return null;
}

function resolveRingWidthValue(token: string): number | null {
  if (token === 'ring') return 3;
  const suffix = token.slice('ring-'.length);
  if (isArbitraryValue(suffix)) {
    const numeric = Number(unwrapArbitraryValue(suffix).replace('px', ''));
    return Number.isFinite(numeric) ? numeric : null;
  }
  const numeric = Number(suffix);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveRingOffsetValue(token: string): number | null {
  const suffix = token.slice('ring-offset-'.length);
  if (isArbitraryValue(suffix)) {
    const numeric = Number(unwrapArbitraryValue(suffix).replace('px', ''));
    return Number.isFinite(numeric) ? numeric : null;
  }
  const numeric = Number(suffix);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveShadowValue(token: string): string | undefined {
  const shadowByToken: Record<string, string | undefined> = {
    shadow: '0 1px 3px 0 rgba(15, 23, 42, 0.12), 0 1px 2px -1px rgba(15, 23, 42, 0.12)',
    'shadow-sm': '0 1px 2px 0 rgba(15, 23, 42, 0.08)',
    'shadow-md': '0 4px 6px -1px rgba(15, 23, 42, 0.12), 0 2px 4px -2px rgba(15, 23, 42, 0.12)',
    'shadow-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.14), 0 4px 6px -4px rgba(15, 23, 42, 0.14)',
    'shadow-xl': '0 20px 25px -5px rgba(15, 23, 42, 0.16), 0 8px 10px -6px rgba(15, 23, 42, 0.16)',
    'shadow-2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    'shadow-none': 'none',
  };

  return shadowByToken[token];
}

function ensureBorderStyle(style: Record<string, string | number>): void {
  if (!('borderStyle' in style)) {
    style.borderStyle = 'solid';
  }
  if (!('borderWidth' in style)) {
    style.borderWidth = '1px';
  }
}

function applySizeToken(accumulator: StyleAccumulator, token: string): void {
  const resolved = resolveWidthValue(token);
  if (!resolved) return;
  accumulator.style[resolved.property] = resolved.value;
}

function applyBasicVisualToken(accumulator: StyleAccumulator, token: string): void {
  if (token.startsWith('bg-')) {
    const color = resolveColorValue(token.slice('bg-'.length));
    if (color) accumulator.style.backgroundColor = color;
    return;
  }

  if (token.startsWith('text-')) {
    const sizeToken = token.slice('text-'.length);
    const fontSizeByToken: Record<string, string> = {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    };
    if (fontSizeByToken[sizeToken]) {
      accumulator.style.fontSize = fontSizeByToken[sizeToken];
      return;
    }
    const color = resolveColorValue(token.slice('text-'.length));
    if (color) accumulator.style.color = color;
    return;
  }

  if (token.startsWith('font-')) {
    const weight = token.slice('font-'.length);
    const fontWeightByToken: Record<string, string | number> = {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
      mono: 'monospace',
      serif: 'serif',
      sans: 'sans-serif',
    };
    const resolved = fontWeightByToken[weight];
    if (resolved !== undefined) {
      if (typeof resolved === 'number') {
        accumulator.style.fontWeight = resolved;
      } else {
        accumulator.style.fontFamily = resolved;
      }
    }
    return;
  }

  if (token === 'italic' || token === 'not-italic') {
    accumulator.style.fontStyle = token === 'italic' ? 'italic' : 'normal';
    return;
  }

  if (token.startsWith('tracking-')) {
    const trackingToken = token.slice('tracking-'.length);
    const trackingByToken: Record<string, string> = {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    };
    const resolved = isArbitraryValue(trackingToken)
      ? unwrapArbitraryValue(trackingToken)
      : trackingByToken[trackingToken];
    if (resolved) {
      accumulator.style.letterSpacing = resolved;
    }
    return;
  }

  if (token.startsWith('gap-')) {
    const gap = resolveSpacingLikeValue(token.slice('gap-'.length), 'width');
    if (gap) accumulator.style.gap = gap;
    return;
  }

  const directionalSpacingMappings: Array<[prefix: string, properties: string[]]> = [
    ['px-', ['paddingLeft', 'paddingRight']],
    ['py-', ['paddingTop', 'paddingBottom']],
    ['pt-', ['paddingTop']],
    ['pr-', ['paddingRight']],
    ['pb-', ['paddingBottom']],
    ['pl-', ['paddingLeft']],
    ['p-', ['padding']],
    ['mx-', ['marginLeft', 'marginRight']],
    ['my-', ['marginTop', 'marginBottom']],
    ['mt-', ['marginTop']],
    ['mr-', ['marginRight']],
    ['mb-', ['marginBottom']],
    ['ml-', ['marginLeft']],
    ['m-', ['margin']],
  ];
  for (const [prefix, properties] of directionalSpacingMappings) {
    if (!token.startsWith(prefix)) continue;
    const resolved = resolveSpacingLikeValue(token.slice(prefix.length), 'width');
    if (!resolved) return;
    properties.forEach((property) => {
      accumulator.style[property] = resolved;
    });
    return;
  }

  if (token.startsWith('border')) {
    const directional = resolveDirectionalBorderWidth(token);
    if (directional) {
      accumulator.style[directional.property] = directional.value;
      accumulator.style.borderStyle = 'solid';
      return;
    }
    if (token === 'border-dashed' || token === 'border-solid' || token === 'border-dotted') {
      accumulator.style.borderStyle = token.slice('border-'.length);
      if (!('borderWidth' in accumulator.style)) {
        accumulator.style.borderWidth = '1px';
      }
      return;
    }
    const borderWidth = resolveBorderWidthValue(token);
    if (borderWidth) {
      accumulator.style.borderWidth = borderWidth;
      ensureBorderStyle(accumulator.style);
      return;
    }

    const color = token === 'border' ? null : resolveColorValue(token.slice('border-'.length));
    if (color) {
      accumulator.style.borderColor = color;
      ensureBorderStyle(accumulator.style);
    }
    return;
  }

  if (token.startsWith('rounded')) {
    const radius = resolveRadiusValue(token);
    if (radius) accumulator.style.borderRadius = radius;
    return;
  }

  if (token.startsWith('opacity-')) {
    const opacity = resolveOpacityValue(token);
    if (opacity !== null) accumulator.style.opacity = opacity;
  }
}

function applyShadowToken(accumulator: StyleAccumulator, token: string): void {
  const shadowValue = resolveShadowValue(token);
  if (shadowValue !== undefined) {
    accumulator.shadowValue = shadowValue;
  }
}

function applyOutlineToken(accumulator: StyleAccumulator, token: string): void {
  if (token.startsWith('outline')) {
    const outlineWidth = resolveOutlineWidthValue(token);
    if (outlineWidth) {
      accumulator.style.outlineStyle = 'solid';
      accumulator.style.outlineWidth = outlineWidth;
      return;
    }

    const color = token === 'outline' ? null : resolveColorValue(token.slice('outline-'.length));
    if (color) {
      accumulator.style.outlineStyle = 'solid';
      accumulator.style.outlineColor = color;
    }
    return;
  }

  if (token.startsWith('ring-offset-')) {
    const offsetWidth = resolveRingOffsetValue(token);
    if (offsetWidth !== null) {
      accumulator.ringOffsetWidth = offsetWidth;
      return;
    }

    const color = resolveColorValue(token.slice('ring-offset-'.length));
    if (color) {
      accumulator.ringOffsetColor = color;
    }
    return;
  }

  if (token.startsWith('ring')) {
    const ringWidth = resolveRingWidthValue(token);
    if (ringWidth !== null) {
      accumulator.ringWidth = ringWidth;
      return;
    }

    const color = token === 'ring' ? null : resolveColorValue(token.slice('ring-'.length));
    if (color) {
      accumulator.ringColor = color;
    }
  }
}

function finalizeStyle(accumulator: StyleAccumulator): Record<string, string | number> {
  const boxShadows: string[] = [];
  if (accumulator.ringOffsetWidth > 0) {
    boxShadows.push(`0 0 0 ${accumulator.ringOffsetWidth}px ${accumulator.ringOffsetColor}`);
  }
  if (accumulator.ringWidth > 0) {
    boxShadows.push(
      `0 0 0 ${accumulator.ringOffsetWidth + accumulator.ringWidth}px ${accumulator.ringColor}`,
    );
  }
  if (accumulator.shadowValue && accumulator.shadowValue !== 'none') {
    boxShadows.push(accumulator.shadowValue);
  }
  if (accumulator.shadowValue === 'none' && boxShadows.length === 0) {
    accumulator.style.boxShadow = 'none';
  } else if (boxShadows.length > 0) {
    accumulator.style.boxShadow = boxShadows.join(', ');
  }
  return accumulator.style;
}

function buildPayload(appliedTokensByCategory: Map<WorkspaceStyleCategory, string[]>): ResolvedStylePayload {
  const categories = [...appliedTokensByCategory.keys()].sort(
    (left, right) => getCategoryPriority(left) - getCategoryPriority(right),
  );

  const tokensByCategory: Partial<Record<WorkspaceStyleCategory, string[]>> = {};
  categories.forEach((category) => {
    tokensByCategory[category] = [...(appliedTokensByCategory.get(category) ?? [])];
  });

  const orderedTokens = categories.flatMap((category) => tokensByCategory[category] ?? []);
  const accumulator: StyleAccumulator = {
    style: {},
    ringWidth: 0,
    ringColor: '#6366f1',
    ringOffsetWidth: 0,
    ringOffsetColor: '#ffffff',
  };

  orderedTokens.forEach((token) => {
    if (
      token.startsWith('w-')
      || token.startsWith('h-')
      || token.startsWith('min-w-')
      || token.startsWith('min-h-')
      || token.startsWith('max-w-')
      || token.startsWith('max-h-')
    ) {
      applySizeToken(accumulator, token);
      return;
    }
    if (
      token.startsWith('bg-')
      || token.startsWith('text-')
      || token.startsWith('font-')
      || token === 'italic'
      || token === 'not-italic'
      || token.startsWith('tracking-')
      || token.startsWith('gap-')
      || token.startsWith('p-')
      || token.startsWith('px-')
      || token.startsWith('py-')
      || token.startsWith('pt-')
      || token.startsWith('pr-')
      || token.startsWith('pb-')
      || token.startsWith('pl-')
      || token.startsWith('m-')
      || token.startsWith('mx-')
      || token.startsWith('my-')
      || token.startsWith('mt-')
      || token.startsWith('mr-')
      || token.startsWith('mb-')
      || token.startsWith('ml-')
      || token.startsWith('border')
      || token.startsWith('rounded')
      || token.startsWith('opacity-')
    ) {
      applyBasicVisualToken(accumulator, token);
      return;
    }
    if (token.startsWith('shadow')) {
      applyShadowToken(accumulator, token);
      return;
    }
    if (token.startsWith('outline') || token.startsWith('ring')) {
      applyOutlineToken(accumulator, token);
    }
  });

  return {
    className: orderedTokens.join(' '),
    categories,
    tokensByCategory,
    style: finalizeStyle(accumulator),
  };
}

function createUnsupportedResult(objectId: string): InterpretedStyleResult {
  return {
    objectId,
    status: 'unsupported',
    appliedCategories: [],
    appliedTokens: [],
    ignoredTokens: [],
  };
}

export function interpretWorkspaceStyle(input: {
  styleInput: WorkspaceStyleInput;
  eligibleProfile: EligibleObjectProfile;
}): { result: InterpretedStyleResult; diagnostics: StylingDiagnostic[] } {
  const { styleInput, eligibleProfile } = input;
  const diagnostics: StylingDiagnostic[] = [];

  if (!eligibleProfile.isEligible) {
    diagnostics.push(createOutOfScopeObjectDiagnostic({
      objectId: styleInput.objectId,
      revision: styleInput.sourceRevision,
      reason: eligibleProfile.reasonIfIneligible,
    }));
    return {
      result: createUnsupportedResult(styleInput.objectId),
      diagnostics,
    };
  }

  const tokens = tokenizeClassName(styleInput.className);
  if (tokens.length === 0) {
    return {
      result: {
        objectId: styleInput.objectId,
        status: 'reset',
        appliedCategories: [],
        appliedTokens: [],
        ignoredTokens: [],
      },
      diagnostics: [],
    };
  }

  const classified = classifyTokens(tokens);
  const appliedTokensByCategory = new Map<WorkspaceStyleCategory, string[]>();
  const ignoredTokens: string[] = [];

  classified.forEach((item) => {
    if (!item.supported || !item.category) {
      ignoredTokens.push(item.token);
      if (item.category) {
        diagnostics.push(createUnsupportedTokenDiagnostic({
          objectId: styleInput.objectId,
          revision: styleInput.sourceRevision,
          category: item.category,
          token: item.token,
        }));
      } else {
        diagnostics.push(createUnsupportedCategoryDiagnostic({
          objectId: styleInput.objectId,
          revision: styleInput.sourceRevision,
          token: item.token,
        }));
      }
      return;
    }

    const current = appliedTokensByCategory.get(item.category) ?? [];
    current.push(item.token);
    appliedTokensByCategory.set(item.category, current);
  });

  const payload = buildPayload(appliedTokensByCategory);
  const appliedTokens = payload.className.length > 0 ? payload.className.split(/\s+/) : [];
  const hasApplied = appliedTokens.length > 0;
  const hasIgnored = ignoredTokens.length > 0;

  if (hasApplied && hasIgnored) {
    diagnostics.push(createMixedInputDiagnostic({
      objectId: styleInput.objectId,
      revision: styleInput.sourceRevision,
      ignoredTokenCount: ignoredTokens.length,
    }));
  }

  const status: InterpretedStyleResult['status'] = hasApplied
    ? (hasIgnored ? 'partial' : 'applied')
    : 'unsupported';

  return {
    result: {
      objectId: styleInput.objectId,
      status,
      appliedCategories: payload.categories,
      appliedTokens,
      ignoredTokens,
      ...(hasApplied ? { resolvedStylePayload: payload } : {}),
    },
    diagnostics: dedupeDiagnostics(diagnostics),
  };
}
