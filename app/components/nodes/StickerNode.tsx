import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { toAssetApiUrl } from '@/utils/imageSource';
import { useGraphStore } from '@/store/graph';
import { normalizeStickerData } from '@/utils/stickerDefaults';

type StickerKind = 'image' | 'text' | 'emoji';

interface StickerNodeData {
  kind?: StickerKind;
  src?: string;
  alt?: string;
  text?: string;
  emoji?: string;
  width?: number;
  height?: number;
  rotation?: number;
  outlineWidth?: number;
  outlineColor?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  padding?: number;
}

const SHADOW_MAP: Record<NonNullable<StickerNodeData['shadow']>, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

const StickerNode = ({ data, selected }: NodeProps<StickerNodeData>) => {
  const currentFile = useGraphStore((state) => state.currentFile);

  const normalized = normalizeStickerData(data as Record<string, any>);
  const kind = normalized.kind;
  const outlineWidth = normalized.outlineWidth;
  const outlineColor = normalized.outlineColor;
  const padding = normalized.padding;
  const shadowClass = SHADOW_MAP[normalized.shadow];

  const imageSrc = data.src ? toAssetApiUrl(currentFile, data.src) : '';
  const isJpgLike = /\.(jpe?g)(\?.*)?$/i.test(data.src || '');

  const commonStyle: React.CSSProperties = {
    border: `${Math.max(1, outlineWidth)}px solid ${outlineColor}`,
    padding,
    background: normalized.bgColor,
    borderRadius: 16,
    minWidth: data.width || 80,
    minHeight: data.height || 56,
  };

  return (
    <BaseNode
      selected={selected}
      className={`rounded-2xl ${shadowClass}`}
      style={{ transform: data.rotation ? `rotate(${data.rotation}deg)` : undefined }}
      startHandle
      endHandle
    >
      <div style={commonStyle} className="flex items-center justify-center">
        {kind === 'image' && imageSrc ? (
          <img
            src={imageSrc}
            alt={data.alt || ''}
            className="max-w-full max-h-64"
            style={{
              width: data.width || 'auto',
              height: data.height || 'auto',
              borderRadius: isJpgLike ? 12 : 20,
              filter: isJpgLike
                ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))'
                : 'drop-shadow(0 2px 5px rgba(0,0,0,0.12))',
            }}
          />
        ) : kind === 'emoji' ? (
          <span
            style={{
              fontSize: normalized.fontSize,
              lineHeight: 1,
            }}
          >
            {data.emoji || '✨'}
          </span>
        ) : (
          <span
            style={{
              color: normalized.textColor,
              fontSize: normalized.fontSize,
              fontWeight: normalized.fontWeight,
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: data.width ? Math.max(40, data.width - padding * 2) : 220,
              overflowWrap: 'anywhere',
            }}
          >
            {data.text || 'Sticker'}
          </span>
        )}
      </div>
    </BaseNode>
  );
};

export default memo(StickerNode);
