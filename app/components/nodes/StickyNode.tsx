import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BaseNode } from './BaseNode';
import { getLucideIconByName } from '@/utils/lucideRegistry';

interface StickyNodeData {
  label: string;
  color?: string;
  className?: string; // Support custom Tailwind classes
  icon?: string;
}

const StickyNode = ({ data, selected }: NodeProps<StickyNodeData>) => {
  const Icon = getLucideIconByName(data.icon);

  return (
    <BaseNode
      className={twMerge(
        clsx(
          'w-40 h-40 p-6 flex flex-col justify-center items-center transition-all duration-300',
          'bg-node-sticky text-node-text',
          'shadow-node rounded-lg',
          // Only apply hover effects if NOT selected
          !selected && 'hover:shadow-node-hover hover:-translate-y-1',
          {
            'shadow-node-selected scale-105': selected,
          },
          data.color,
          data.className
        ),
      )}
    >
      <div className="w-full h-full flex items-center justify-center text-center break-words overflow-hidden pointer-events-none select-none">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-600 shrink-0" />}
          <span className="text-base leading-relaxed font-medium text-slate-800">
            {data.label}
          </span>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(StickyNode);
