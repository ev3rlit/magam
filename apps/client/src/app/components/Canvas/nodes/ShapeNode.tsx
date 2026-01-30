import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ShapeNodeData {
  type: 'rectangle' | 'circle' | 'triangle';
  label?: string;
  color?: string;
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
      'relative w-32 h-32 flex items-center justify-center',
      'bg-slate-200 text-slate-800',
      {
        'ring-2 ring-blue-500 shadow-lg scale-105': selected,
        'hover:shadow-md hover:scale-[1.02]': !selected,
      },
      data.color,
      shapeClasses,
    ),
  );

  if (data.type === 'triangle') {
    return (
      <div className="relative w-32 h-32 flex items-center justify-center">
        <Handle
          type="target"
          position={Position.Top}
          className="w-2 h-2 !bg-slate-400 opacity-0 hover:opacity-100 transition-opacity"
          style={{ top: 0 }}
        />

        <div
          className={twMerge(
            clsx('w-full h-full transition-all duration-200', {
              'filter drop-shadow-lg scale-105': selected,
              'filter drop-shadow-md hover:scale-[1.02]': !selected,
            }),
          )}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <polygon
              points="50,0 100,100 0,100"
              className={twMerge(
                clsx(
                  'fill-slate-200 stroke-none',
                  data.color?.replace('bg-', 'fill-'),
                ),
              )}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <span className="text-sm font-medium leading-tight text-center px-4">
              {data.label}
            </span>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2 h-2 !bg-slate-400 opacity-0 hover:opacity-100 transition-opacity"
          style={{ bottom: 0 }}
        />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-slate-400 opacity-0 hover:opacity-100 transition-opacity"
      />

      <div className="w-full h-full flex items-center justify-center text-center break-words overflow-hidden p-2">
        <span className="text-sm font-medium leading-tight">{data.label}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-slate-400 opacity-0 hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

export default memo(ShapeNode);
