'use client';

import React from 'react';
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useGraphStore, FileTreeNode } from '@/store/graph';

interface FolderTreeItemProps {
    node: FileTreeNode;
    depth?: number;
    onOpenFile?: (filePath: string) => boolean | void;
}

export const FolderTreeItem: React.FC<FolderTreeItemProps> = ({ node, depth = 0, onOpenFile }) => {
    const { currentFile, openTab, expandedFolders, toggleFolder } = useGraphStore();

    const isExpanded = expandedFolders.has(node.path);
    const isDirectory = node.type === 'directory';
    const isActive = currentFile === node.path;

    const handleClick = () => {
        if (isDirectory) {
            toggleFolder(node.path);
            return;
        }

        if (onOpenFile) {
            onOpenFile(node.path);
        } else {
            openTab(node.path);
        }
    };

    const paddingLeft = depth * 12 + 8;

    return (
        <div>
            <button
                onClick={handleClick}
                style={{ paddingLeft: `${paddingLeft}px` }}
                className={clsx(
                    'w-full flex items-center gap-1.5 py-1 pr-2 text-sm transition-colors duration-150 text-left',
                    'cursor-pointer outline-none hover:bg-slate-200/60 dark:hover:bg-slate-800/60',
                    'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-inset',
                    isActive && !isDirectory && 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                )}
            >
                {/* Chevron for folders */}
                {isDirectory ? (
                    <span className="w-4 h-4 flex items-center justify-center text-slate-400">
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                    </span>
                ) : (
                    <span className="w-4 h-4" /> // Spacer for alignment
                )}

                {/* Icon */}
                {isDirectory ? (
                    isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : (
                        <FolderIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )
                ) : (
                    <FileIcon className={clsx(
                        'w-4 h-4 flex-shrink-0',
                        isActive ? 'text-blue-500' : 'text-slate-400'
                    )} />
                )}

                {/* Name */}
                <span className={clsx(
                    'truncate font-mono text-xs',
                    isDirectory ? 'font-medium text-slate-700 dark:text-slate-300' : '',
                )}>
                    {node.name}
                </span>
            </button>

            {/* Children */}
            {isDirectory && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FolderTreeItem
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            onOpenFile={onOpenFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
