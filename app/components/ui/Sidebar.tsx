import React from 'react';
import { useGraphStore } from '@/store/graph';
import { FileIcon, FolderOpen, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { files, currentFile, setCurrentFile } = useGraphStore();

  const handleFileClick = (file: string) => {
    setCurrentFile(file);
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">
          Files
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin opacity-20" />
            <span>No files detected</span>
          </div>
        ) : (
          <ul className="space-y-0.5 px-2">
            {files.map((file) => {
              const isActive = currentFile === file;
              return (
                <li key={file}>
                  <button
                    onClick={() => handleFileClick(file)}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors duration-200 text-left',
                      'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
                      isActive
                        ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
                        : 'text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <FileIcon
                      className={clsx(
                        'w-4 h-4 flex-shrink-0',
                        isActive ? 'text-blue-500' : 'text-slate-400',
                      )}
                    />
                    <span className="truncate font-mono">{file}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Programmatic Whiteboard
        </div>
      </div>
    </aside>
  );
};
