import React from 'react';
import { useGraphStore } from '@/store/graph';
import { XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export const ErrorOverlay: React.FC = () => {
  const { error, setError } = useGraphStore();

  if (!error) return null;

  return (
    <div className="absolute top-4 right-4 z-50 max-w-lg w-full animate-in slide-in-from-top-2 fade-in duration-300 pointer-events-none">
      <div
        className={clsx(
          'relative rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg pointer-events-auto',
          'dark:border-red-900/50 dark:bg-red-950/90 dark:backdrop-blur-sm',
        )}
      >
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />

          <div className="flex-1 space-y-1 overflow-hidden">
            <h3 className="font-medium text-red-900 dark:text-red-200">
              {error.type || 'Error'}
            </h3>
            <div className="text-sm text-red-800 dark:text-red-300 font-mono whitespace-pre-wrap break-words max-h-[80vh] overflow-y-auto">
              {error.message}
            </div>
          </div>

          <button
            onClick={() => setError(null)}
            className="shrink-0 rounded hover:bg-red-100 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
