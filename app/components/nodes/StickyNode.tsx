import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StickyNodeData {
  label: string;
  color?: string;
  className?: string; // Support custom Tailwind classes
}

const StickyNode = ({ data, selected }: NodeProps<StickyNodeData>) => {
  return (
    <div
      className={twMerge(
        clsx(
          'relative w-40 h-40 p-6 flex flex-col justify-center items-center transition-all duration-300',
          'bg-node-sticky text-node-text',
          'shadow-node transition-all duration-300',
          'hover:shadow-node-hover hover:-translate-y-1',
          {
            'shadow-node-selected scale-105': selected,
          },
          data.color,
          data.className
        ),
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-slate-400/50 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div className="w-full h-full flex items-center justify-center text-center break-words overflow-hidden pointer-events-none select-none">
        <span className="text-base leading-relaxed font-medium text-slate-800">
          {data.label}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-slate-400/50 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

export default memo(StickyNode);
