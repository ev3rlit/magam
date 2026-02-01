import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BaseNode } from './BaseNode';

interface ShapeNodeData {
  type: 'rectangle' | 'circle' | 'triangle';
  label?: string;
  // Shape styling
  color?: string;
  // Rich text styling
  labelColor?: string;
  labelFontSize?: number;
  labelBold?: boolean;
  className?: string;
}

const ShapeNode = ({ data, selected }: NodeProps<ShapeNodeData>) => {
  const shapeClasses = clsx(
    'flex items-center justify-center transition-all duration-200',
    {
      'rounded-md': data.type === 'rectangle',
      'rounded-full': data.type === 'circle',
      'clip-triangle': data.type === 'triangle',
    },
  );

  const containerClasses = twMerge(
    clsx(
      'min-w-36 min-h-20 w-auto h-auto flex items-center justify-center p-4',
      'bg-white border-2 border-node-border text-node-text transition-all duration-300',
      'shadow-node rounded-lg',
      'hover:shadow-node-hover hover:-translate-y-1 hover:border-brand-100', // Subtle interaction
      {
        'border-brand-500 shadow-node-selected scale-105': selected,
      },
      data.color, // Assuming this is a class string for background
      shapeClasses,
      data.className, // Apply custom className (can override defaults)
    ),
  );

  const labelStyle = {
    color: data.labelColor,
    fontSize: data.labelFontSize,
    fontWeight: data.labelBold ? 'bold' : 'normal',
  };

  if (data.type === 'triangle') {
    return (
      <BaseNode className="w-32 h-32 flex items-center justify-center">
        <div
          className={twMerge(
            clsx(
              'w-full h-full transition-all duration-300 filter drop-shadow-md',
              {
                'drop-shadow-xl scale-105': selected,
                'hover:drop-shadow-lg hover:scale-105': !selected,
              },
            ),
          )}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <polygon
              points="50,0 100,100 0,100"
              className={twMerge(
                clsx(
                  'fill-white stroke-slate-200 stroke-2',
                  data.color?.replace('bg-', 'fill-'),
                ),
              )}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pt-8 pointer-events-none select-none">
            <span
              className="text-sm font-medium leading-tight text-center px-4 text-slate-700 whitespace-pre-wrap"
              style={labelStyle}
            >
              {data.label}
            </span>
          </div>
        </div>
      </BaseNode>
    );
  }

  return (
    <BaseNode className={containerClasses}>
      <div className="w-full flex items-start justify-center text-left break-words p-4 pointer-events-none select-none">
        <span
          className="text-sm font-medium leading-relaxed text-slate-700 whitespace-pre-wrap"
          style={labelStyle}
        >
          {data.label}
        </span>
      </div>
    </BaseNode>
  );
};

export default memo(ShapeNode);
