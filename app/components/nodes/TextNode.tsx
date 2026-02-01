import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { twMerge } from 'tailwind-merge';
import { BaseNode } from './BaseNode';

interface TextNodeData {
    label: string;
    fontSize?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    className?: string;
}

const TextNode = ({ data, selected }: NodeProps<TextNodeData>) => {
    return (
        <BaseNode
            className={twMerge(
                "p-2 min-w-[50px] text-center pointer-events-none select-none",
                selected && "ring-1 ring-brand-500/50 rounded bg-brand-50/50",
                data.className
            )}
        >
            <div
                className="text-center whitespace-pre-wrap leading-tight"
                style={{
                    fontSize: data.fontSize || 16,
                    color: data.color || '#374151', // text-gray-700
                    fontWeight: data.bold ? 'bold' : 'normal',
                    fontStyle: data.italic ? 'italic' : 'normal',
                }}
            >
                {data.label || 'Text'}
            </div>
        </BaseNode>
    );
};

export default memo(TextNode);
