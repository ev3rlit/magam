import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Clipboard } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface CodeBlockProps {
    language: string;
    value: string;
    className?: string;
}

export const CodeBlock = ({ language, value, className }: CodeBlockProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent node selection
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={twMerge(
                "rounded-md overflow-hidden my-4 border border-slate-700/50 shadow-sm bg-[#1e1e1e]",
                "group relative pointer-events-auto", // Enable interactions
                className
            )}
        >
            {/* Header / Mac-style bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                    {/* Mac dots */}
                    <div className="flex gap-1.5 opacity-60">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    {language && (
                        <span className="text-[10px] font-mono font-medium text-slate-400 ml-2 uppercase tracking-wider">
                            {language}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                        </>
                    ) : (
                        <>
                            <Clipboard className="w-3 h-3" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Editor Area */}
            <div className="relative group/code text-xs sm:text-sm">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                        fontSize: 'inherit',
                        lineHeight: 1.6,
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace'
                        }
                    }}
                    wrapLongLines={true}
                >
                    {String(value).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};
