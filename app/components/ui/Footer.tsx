import React from 'react';
import { useGraphStore } from '@/store/graph';
import { Layers, MousePointer2 } from 'lucide-react';
import { clsx } from 'clsx';

export const Footer: React.FC = () => {
  const { selectedNodeIds } = useGraphStore();
  const count = selectedNodeIds.length;

  return (
    <footer className="h-8 px-4 border-t border-slate-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between text-xs select-none">
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            'flex items-center gap-1.5 transition-colors',
            count > 0
              ? 'text-blue-600 dark:text-blue-400 font-medium'
              : 'text-slate-500',
          )}
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          <span>
            {count === 0
              ? 'No selection'
              : `Selected: ${count} node${count === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-slate-400">
        <div className="flex items-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-default">
          <Layers className="w-3.5 h-3.5" />
          <span>Master</span>
        </div>
        <span>UTF-8</span>
        <span>TypeScript React</span>
      </div>
    </footer>
  );
};
