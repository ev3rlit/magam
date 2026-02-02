import React, { ReactNode } from 'react';
import { Handle, Position } from 'reactflow';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BaseNodeProps {
    children: ReactNode;
    className?: string; // Wrapper class
    handleColor?: string; // Optional custom handle color override
    selected?: boolean; // For styling active state on wrapper if needed
    startHandle?: boolean; // Show source handle? Default true
    endHandle?: boolean; // Show target handle? Default true
}

export const BaseNode = ({
    children,
    className,
    handleColor,
    selected,
    startHandle = true,
    endHandle = true,
}: BaseNodeProps) => {
    // For Floating Edge: invisible handles positioned anywhere (we use top/bottom but they're invisible)
    // The actual edge path calculation ignores handle positions and uses node boundaries instead.
    // These handles are just needed for React Flow to recognize the node as connectable.
    const handleClasses = clsx(
        '!w-3 !h-3 !border-0 transition-opacity duration-200',
        '!bg-transparent !opacity-0', // Invisible for Floating Edge mode
        handleColor && `!bg-[${handleColor}]`
    );

    return (
        <div className={twMerge("relative group", className)}>
            {/* Target handle - invisible, for React Flow connectivity */}
            {endHandle && (
                <Handle
                    type="target"
                    position={Position.Left}
                    id="center-target"
                    className={handleClasses}
                    style={{ opacity: 0 }}
                />
            )}

            {children}

            {/* Source handle - invisible, for React Flow connectivity */}
            {startHandle && (
                <Handle
                    type="source"
                    position={Position.Right}
                    id="center-source"
                    className={handleClasses}
                    style={{ opacity: 0 }}
                />
            )}
        </div>
    );
};
