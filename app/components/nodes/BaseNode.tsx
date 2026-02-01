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
    // Common handle styles
    // We use group-hover on the node so handles appear when checking the node.
    // Note: The parent/consumer must add 'group' class to the container if they want hover effects!
    // But ReactFlow nodes usually don't have 'group' on the wrapper by default unless we add it to this wrapper.

    const handleClasses = clsx(
        '!w-3 !h-3 !border-0 transition-opacity duration-200',
        '!bg-slate-400/50', // Default color
        'opacity-0 group-hover:opacity-100', // Hover effect
        handleColor && `!bg-[${handleColor}]` // Custom color if provided
    );

    return (
        <div className={twMerge("relative group", className)}>
            {endHandle && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className={handleClasses}
                />
            )}

            {children}

            {startHandle && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className={handleClasses}
                />
            )}
        </div>
    );
};
