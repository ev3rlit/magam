import React, { ReactNode, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useZoom } from '@/contexts/ZoomContext';

/** Maximum length for bubble text before truncation */
const BUBBLE_MAX_LENGTH = 40;

/**
 * Extract first line from text, removing markdown syntax.
 */
function extractFirstLine(text: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    const firstLine = lines[0] || '';

    // Clean markdown syntax
    return firstLine
        .replace(/^#+\s*/, '')      // Remove heading markers
        .replace(/\*\*|__/g, '')    // Remove bold
        .replace(/\*|_/g, '')       // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .trim();
}

interface BaseNodeProps {
    children: ReactNode;
    className?: string;
    handleColor?: string;
    selected?: boolean;
    startHandle?: boolean;
    endHandle?: boolean;
    /** 
     * Enable bubble overlay when zoomed out.
     * Text is auto-extracted from `label` prop.
     */
    bubble?: boolean;
    /**
     * Label text used for bubble display.
     * First line is extracted and shown when bubble=true and zoomed out.
     */
    label?: string;
}

export const BaseNode = ({
    children,
    className,
    handleColor,
    selected,
    startHandle = true,
    endHandle = true,
    bubble = false,
    label,
}: BaseNodeProps) => {
    const { isBubbleMode, inverseScale } = useZoom();

    const handleClasses = clsx(
        '!w-3 !h-3 !border-0 transition-opacity duration-200',
        '!bg-transparent !opacity-0',
        handleColor && `!bg-[${handleColor}]`
    );

    // Extract and truncate bubble text
    const bubbleText = useMemo(() => {
        if (!label) return '';
        const text = extractFirstLine(label);
        if (text.length > BUBBLE_MAX_LENGTH) {
            return text.slice(0, BUBBLE_MAX_LENGTH) + '...';
        }
        return text;
    }, [label]);

    // Show floating bubble only if: 1) bubble=true AND 2) in bubble mode
    const showBubble = bubble && isBubbleMode;

    return (
        <div className={twMerge("relative group", className)}>
            {/* Target handle */}
            {endHandle && (
                <Handle
                    type="target"
                    position={Position.Left}
                    id="center-target"
                    className={handleClasses}
                    style={{ opacity: 0 }}
                />
            )}

            {/* Original node content - always rendered */}
            {children}

            {/* Floating bubble overlay - only when bubble=true AND zoomed out */}
            {showBubble && (
                <div
                    className="bubble-label"
                    style={{
                        transform: `scale(${inverseScale}) translate(-50%, -50%)`,
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        zIndex: 100,
                        transformOrigin: 'top left',
                    }}
                >
                    {bubbleText}
                </div>
            )}

            {/* Source handle */}
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
