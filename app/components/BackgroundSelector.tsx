'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Grid3x3, StretchHorizontal, Square } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useGraphStore } from '@/store/graph';

type PresetValue = 'dots' | 'lines' | 'solid';
const options: { value: PresetValue; label: string; icon: React.ReactNode }[] = [
  { value: 'dots', label: 'Dots', icon: <Grid3x3 className="w-4 h-4" /> },
  { value: 'lines', label: 'Lines', icon: <StretchHorizontal className="w-4 h-4" /> },
  { value: 'solid', label: 'Solid', icon: <Square className="w-4 h-4" /> },
];

export const BackgroundSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const canvasBackground = useGraphStore((s) => s.canvasBackground);
  const setCanvasBackground = useGraphStore((s) => s.setCanvasBackground);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const currentOption = (typeof canvasBackground === 'string'
    ? options.find((o) => o.value === canvasBackground)
    : undefined) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Background Style"
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          isOpen
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
            : 'text-slate-500 dark:text-slate-400',
        )}
      >
        {currentOption.icon}
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setCanvasBackground(option.value);
                setIsOpen(false);
              }}
              title={option.label}
              className={cn(
                'p-2 rounded-md transition-all duration-200',
                'hover:bg-slate-100 dark:hover:bg-slate-800',
                typeof canvasBackground === 'string' && canvasBackground === option.value
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {option.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
