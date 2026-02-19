import React, { memo, useCallback, useMemo } from 'react';
import { NodeProps } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import { twMerge } from 'tailwind-merge';
import { BaseNode } from './BaseNode';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../ui/CodeBlock';
import { useNodeNavigation } from '@/contexts/NavigationContext';
import { toAssetApiUrl } from '@/utils/imageSource';
import { useGraphStore } from '@/store/graph';
import type { RenderableChild } from '@/utils/childComposition';

interface MarkdownNodeData {
    label: string;
    /** Enable bubble overlay when zoomed out. Text auto-extracted from label. */
    bubble?: boolean;
    className?: string;
    variant?: 'default' | 'minimal';
    children?: RenderableChild[];
}

const MarkdownNode = ({ data, selected }: NodeProps<MarkdownNodeData>) => {
    const { navigateToNode } = useNodeNavigation();
    const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (href.startsWith('node:')) {
            const path = href.slice(5);
            navigateToNode(path);
        } else {
            window.open(href, '_blank', 'noopener,noreferrer');
        }
    }, [navigateToNode]);

    const components = useMemo(() => ({
        pre: ({ children }: any) => <>{children}</>,
        a: ({ node, href, children, ...props }: any) => {
            const actualHref = href || (node as any)?.properties?.href || '';
            const isNodeLink = actualHref?.startsWith('node:');
            return (
                <a
                    href={actualHref}
                    className={twMerge(
                        "cursor-pointer pointer-events-auto",
                        isNodeLink
                            ? "text-indigo-600 hover:text-indigo-800 font-medium underline decoration-indigo-300 hover:decoration-indigo-500"
                            : "text-blue-500 hover:underline"
                    )}
                    onClick={(e) => handleLinkClick(e, actualHref)}
                    {...props}
                >
                    {isNodeLink && <span className="mr-1">→</span>}
                    {children}
                </a>
            );
        },
        code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const { inline } = props;

            return !inline ? (
                <CodeBlock
                    language={match?.[1] ?? ''}
                    value={String(children).replace(/\n$/, '')}
                    className="not-prose"
                />
            ) : (
                <code className="bg-slate-100 rounded px-1.5 py-0.5 text-[0.9em] font-mono text-pink-600 border border-slate-200" {...props}>
                    {children}
                </code>
            );
        },
        img: ({ node, src, alt, ...props }: any) => {
            const currentFile = useGraphStore.getState().currentFile;
            const resolvedSrc = src ? toAssetApiUrl(currentFile, src) : '';
            return <img src={resolvedSrc} alt={alt || ''} {...props} />;
        },
    }), [handleLinkClick]);

    const markdownContent = useMemo(() => (
        <div className="prose prose-sm prose-slate max-w-none pointer-events-none select-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                urlTransform={(url) => url}
                components={components}
            >
                {data.label}
            </ReactMarkdown>
        </div>
    ), [data.label, components]);

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
            bubble={data.bubble}
            label={data.label}
        >
            {markdownContent}
        </BaseNode>
    );
};

export default memo(MarkdownNode);
