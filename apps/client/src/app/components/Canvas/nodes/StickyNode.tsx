import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StickyNodeData {
  label: string;
  color?: string;
}

const StickyNode = ({ data, selected }: NodeProps<StickyNodeData>) => {
  return (
    <div
      className={twMerge(
        clsx(
          'relative w-40 h-40 p-4 shadow-lg flex flex-col justify-center items-center transition-all duration-200',
          'bg-yellow-200 text-slate-800 font-handwriting',
          {
            'ring-2 ring-blue-500 shadow-xl scale-105': selected,
            'hover:shadow-xl hover:scale-[1.02]': !selected,
          },
          data.color,
        ),
      )}
      style={{
        fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-slate-400 opacity-0 hover:opacity-100 transition-opacity"
      />

      <div className="w-full h-full flex items-center justify-center text-center break-words overflow-hidden">
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

export default memo(StickyNode);
