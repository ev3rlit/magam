import type { CSSProperties } from 'react';
import type { FontFamilyPreset } from '@magam/core';
import type { DemoPreviewBackground } from '@/src/demo/preview/types';

const COLOR_MAP: Record<string, string> = {
  'bg-green-50': '#ecfdf3',
  'bg-yellow-50': '#fffbeb',
  'bg-red-50': '#fff1f2',
  'bg-indigo-50': '#eef2ff',
  'bg-sky-50': '#f0f9ff',
  'bg-cyan-50': '#ecfeff',
  'bg-teal-50': '#f0fdfa',
  'bg-white': '#ffffff',
  'bg-white/50': 'rgba(255,255,255,0.5)',
  'border-green-400': '#4ade80',
  'border-yellow-400': '#facc15',
  'border-red-400': '#f87171',
  'border-indigo-300': '#a5b4fc',
  'border-indigo-500': '#6366f1',
  'border-gray-200': '#e5e7eb',
  'border-gray-400': '#9ca3af',
  'border-sky-300': '#7dd3fc',
  'border-cyan-300': '#67e8f9',
  'border-teal-300': '#5eead4',
  'text-green-700': '#15803d',
  'text-yellow-700': '#a16207',
  'text-red-700': '#be123c',
  'text-indigo-700': '#4338ca',
  'text-sky-700': '#0369a1',
  'text-cyan-700': '#0f766e',
  'text-teal-700': '#0f766e',
  'text-white': '#ffffff',
  'from-blue-400': '#60a5fa',
  'to-purple-500': '#a855f7',
};

const FONT_FAMILY_MAP: Record<string, string> = {
  'sans-inter': 'var(--font-sans), sans-serif',
  'sans-system': 'var(--font-sans), sans-serif',
  'mono-jetbrains': 'var(--font-mono), monospace',
  'mono-geist': 'var(--font-mono), monospace',
};

function getTokenSet(className?: string): Set<string> {
  return new Set(
    (className ?? '')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function toDataUri(svg: string, gap: number): string {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${gap}" height="${gap}" viewBox="0 0 ${gap} ${gap}">${svg}</svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
}

export function resolveDemoCanvasBackground(
  background: DemoPreviewBackground | undefined,
): CSSProperties {
  if (!background || background === 'solid') {
    return {
      backgroundColor: '#fbfaf7',
      backgroundImage:
        'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
      backgroundPosition: '-1px -1px',
      backgroundSize: '32px 32px',
    };
  }

  if (background === 'dots') {
    return {
      backgroundColor: '#f8fafc',
      backgroundImage:
        'radial-gradient(circle at 1px 1px, rgba(100,116,139,0.28) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    };
  }

  if (background === 'lines') {
    return {
      backgroundColor: '#f8fafc',
      backgroundImage:
        'linear-gradient(rgba(100,116,139,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.12) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    };
  }

  return {
    backgroundColor: '#f8fafc',
    backgroundImage: toDataUri(background.svg, background.gap),
    backgroundSize: `${background.gap}px ${background.gap}px`,
  };
}

export function resolveDemoFontFamily(fontFamily?: FontFamilyPreset): string | undefined {
  if (!fontFamily) {
    return undefined;
  }

  if (fontFamily in FONT_FAMILY_MAP) {
    return FONT_FAMILY_MAP[fontFamily];
  }

  if (fontFamily.startsWith('mono')) {
    return 'var(--font-mono), monospace';
  }

  if (fontFamily.startsWith('serif')) {
    return 'Iowan Old Style, Georgia, serif';
  }

  return 'var(--font-sans), sans-serif';
}

export function resolveDemoNodeStyle(input: {
  className?: string;
  bubble?: boolean;
  fontFamily?: FontFamilyPreset;
}): CSSProperties {
  const tokens = getTokenSet(input.className);
  const style: CSSProperties = {
    color: '#1d1f20',
    background: 'rgba(255, 255, 255, 0.96)',
    border: '1px solid rgba(31, 41, 55, 0.16)',
    borderRadius: input.bubble ? 26 : 18,
    boxShadow: '0 12px 24px rgba(31, 41, 55, 0.12)',
    fontFamily: resolveDemoFontFamily(input.fontFamily),
  };

  for (const token of tokens) {
    if (token.startsWith('bg-') && COLOR_MAP[token]) {
      style.background = COLOR_MAP[token];
    }

    if (token.startsWith('text-') && COLOR_MAP[token]) {
      style.color = COLOR_MAP[token];
    }

    if (token.startsWith('border-') && COLOR_MAP[token]) {
      style.borderColor = COLOR_MAP[token];
    }

    if (token === 'border-dashed') {
      style.borderStyle = 'dashed';
    }

    if (token === 'border-dotted') {
      style.borderStyle = 'dotted';
    }

    if (token === 'border-none') {
      style.border = 'none';
    }

    if (token === 'border-2') {
      style.borderWidth = 2;
    }

    if (token === 'border-4') {
      style.borderWidth = 4;
    }

    if (token === 'rounded-full') {
      style.borderRadius = 999;
    }

    if (token === 'shadow-xl') {
      style.boxShadow = '0 18px 32px rgba(15, 23, 42, 0.18)';
    }

    if (token === 'backdrop-blur-sm') {
      style.backdropFilter = 'blur(8px)';
    }
  }

  if (tokens.has('bg-gradient-to-r')) {
    style.backgroundImage = `linear-gradient(90deg, ${COLOR_MAP['from-blue-400']}, ${COLOR_MAP['to-purple-500']})`;
    style.backgroundColor = COLOR_MAP['from-blue-400'];
  }

  return style;
}
