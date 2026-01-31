import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { twMerge } from 'tailwind-merge';

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
        <div
            className={twMerge(
                "relative p-2 min-w-[50px] text-center pointer-events-none select-none",
                selected && "ring-1 ring-brand-500/50 rounded bg-brand-50/50",
                data.className
            )}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-2 h-2 !bg-indigo-400/50 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />

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

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-2 h-2 !bg-indigo-400/50 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
        </div>
    );
};

export default memo(TextNode);
