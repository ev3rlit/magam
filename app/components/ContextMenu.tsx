import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import type { ContextMenuItem, ContextMenuContext } from '@/types/contextMenu';

interface ContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    items: ContextMenuItem[];
    context: ContextMenuContext;
    onClose: () => void;
}

export function ContextMenu({ isOpen, position, items, context, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [anchoredPosition, setAnchoredPosition] = useState(position);

    useEffect(() => {
        setAnchoredPosition(position);
    }, [position]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointer = (event: Event) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handlePointer);
        document.addEventListener('touchstart', handlePointer);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointer);
            document.removeEventListener('touchstart', handlePointer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !menuRef.current) {
            return;
        }
        const rect = menuRef.current.getBoundingClientRect();
        const safeX = Math.min(
            Math.max(8, position.x),
            Math.max(8, window.innerWidth - rect.width - 8),
        );
        const safeY = Math.min(
            Math.max(8, position.y),
            Math.max(8, window.innerHeight - rect.height - 8),
        );

        if (safeX !== anchoredPosition.x || safeY !== anchoredPosition.y) {
            setAnchoredPosition({ x: safeX, y: safeY });
        }
    }, [isOpen, position, anchoredPosition]);

    useEffect(() => {
        if (!isOpen || !menuRef.current) {
            return;
        }

        const firstAction = menuRef.current.querySelector<HTMLButtonElement>('[data-context-menu-action]');
        firstAction?.focus();
    }, [isOpen, items]);

    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div
            ref={menuRef}
            role="menu"
            className={cn(
                'fixed z-[200] min-w-[200px] py-1',
                'bg-white dark:bg-slate-900',
                'border border-slate-200 dark:border-slate-700',
                'rounded-lg shadow-xl',
                'animate-in fade-in zoom-in-95 duration-100',
            )}
            style={{ top: anchoredPosition.y, left: anchoredPosition.x }}
            onContextMenu={(event) => event.preventDefault()}
        >
            {items.map((item, idx) => {
                if (item.type === 'separator') {
                    return (
                        <div
                            key={`sep-${idx}`}
                            className="h-px mx-2 my-1 bg-slate-200 dark:bg-slate-700"
                        />
                    );
                }

                if (item.type === 'action') {
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="menuitem"
                            data-context-menu-action
                            className={cn(
                                'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                                'hover:bg-slate-100 dark:hover:bg-slate-800',
                                'text-slate-700 dark:text-slate-300',
                                'focus-visible:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800',
                            )}
                            onClick={async () => {
                                await item.handler(context);
                                onClose();
                            }}
                        >
                            {item.icon ? <item.icon className="w-4 h-4 text-slate-400" /> : null}
                            <span className="flex-1">{item.label}</span>
                            {item.shortcut ? (
                                <span className="text-xs text-slate-400 ml-4">{item.shortcut}</span>
                            ) : null}
                        </button>
                    );
                }

                // submenu support can be added in a follow-up step
                return null;
            })}
        </div>,
        document.body,
    );
}
