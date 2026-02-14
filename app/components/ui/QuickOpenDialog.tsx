import React, { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';

interface QuickOpenDialogProps {
  isOpen: boolean;
  files: string[];
  onClose: () => void;
  onOpenFile: (filePath: string) => boolean | void;
}

export const QuickOpenDialog: React.FC<QuickOpenDialogProps> = ({
  isOpen,
  files,
  onOpenFile,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files;
    return files.filter((file) => file.toLowerCase().includes(normalized));
  }, [files, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setQuery('');
    setFocusedIndex(0);
  }, [isOpen]);

  useEffect(() => {
    setFocusedIndex(0);
  }, [filteredFiles]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (filePath: string) => {
    const shouldClose = onOpenFile(filePath);
    if (shouldClose !== false) {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (filteredFiles.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % filteredFiles.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + filteredFiles.length) % filteredFiles.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const nextPath = filteredFiles[focusedIndex];
      if (nextPath) {
        handleSubmit(nextPath);
      }
    }
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center px-4 py-6"
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl"
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="파일 경로 검색..."
            autoFocus
            className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">검색 결과가 없습니다.</div>
          ) : (
            filteredFiles.map((file, index) => (
              <button
                key={file}
                type="button"
                onClick={() => handleSubmit(file)}
                className={clsx(
                  'w-full text-left px-3 py-2 text-sm',
                  index === focusedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200',
                )}
              >
                {file}
              </button>
            ))
          )}
        </div>

        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
          <span>Enter: open</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Esc
          </button>
        </div>
      </div>
    </div>
  );
};
