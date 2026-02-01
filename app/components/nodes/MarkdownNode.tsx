import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import { twMerge } from 'tailwind-merge';
import { BaseNode } from './BaseNode';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../ui/CodeBlock';

interface MarkdownNodeData {
    label: string;
    className?: string;
    variant?: 'default' | 'minimal';
}

const MarkdownNode = ({ data, selected }: NodeProps<MarkdownNodeData>) => {
    return (
        <BaseNode
            className={twMerge(
                "min-w-64 min-h-20 w-auto h-auto flex flex-col justify-center p-6 text-left",
                "bg-white border-2 border-slate-200 text-slate-800 transition-all duration-300",
                "shadow-lg rounded-xl",
                !selected && "hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1",
                selected && "border-brand-500 ring-2 ring-brand-500/20 shadow-xl",
                data.className
            )}
        >
            <div className="prose prose-sm prose-slate max-w-none pointer-events-none select-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        // Remove the default pre wrapper which causes the "Navy" background (prose style)
                        pre: ({ children }) => <>{children}</>,

                        a: ({ node, ...props }) => (
                            <a
                                className="text-blue-500 hover:underline cursor-pointer pointer-events-auto"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                {...props}
                            />
                        ),
                        code: ({ node, className, children, ...props }) => {
                            // @ts-ignore
                            const match = /language-(\w+)/.exec(className || '');
                            // @ts-ignore
                            const { inline } = props;

                            return !inline && match ? (
                                <CodeBlock
                                    language={match[1]}
                                    value={String(children).replace(/\n$/, '')}
                                    className="not-prose" // Prevent prose styles from messing up external highlighter
                                />
                            ) : (
                                <code className="bg-slate-100 rounded px-1.5 py-0.5 text-[0.9em] font-mono text-pink-600 border border-slate-200" {...props}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {data.label}
                </ReactMarkdown>
            </div>
        </BaseNode>
    );
};

export default memo(MarkdownNode);
