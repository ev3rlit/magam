'use client';

import {
  isValidElement,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

type SyntaxModule = {
  Prism: typeof import('react-syntax-highlighter').Prism;
  style: Record<string, CSSProperties>;
};

interface MarkdownInlineCodeProps extends ComponentPropsWithoutRef<'code'> {
  node?: unknown;
}

interface MarkdownPreBlockProps extends ComponentPropsWithoutRef<'pre'> {
  node?: unknown;
}

const LANGUAGE_LABELS: Record<string, string> = {
  bash: 'Shell',
  json: 'JSON',
  javascript: 'JavaScript',
  jsx: 'JSX',
  markdown: 'Markdown',
  md: 'Markdown',
  shell: 'Shell',
  sh: 'Shell',
  text: 'Plain text',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
  yaml: 'YAML',
  yml: 'YAML',
};

let syntaxModulePromise: Promise<SyntaxModule> | null = null;

async function loadSyntaxModule(): Promise<SyntaxModule> {
  if (!syntaxModulePromise) {
    syntaxModulePromise = Promise.all([
      import('react-syntax-highlighter'),
      import('react-syntax-highlighter/dist/esm/styles/prism'),
    ]).then(([syntaxHighlighterModule, styleModule]) => ({
      Prism: syntaxHighlighterModule.Prism,
      style: styleModule.vscDarkPlus as Record<string, CSSProperties>,
    }));
  }

  return syntaxModulePromise;
}

function resolveCodeLanguage(className?: string): { id: string; label: string } {
  const languageMatch = /language-([\w-]+)/.exec(className ?? '');
  const id = languageMatch?.[1]?.toLowerCase() ?? 'text';

  return {
    id,
    label: LANGUAGE_LABELS[id] ?? id.toUpperCase(),
  };
}

export function MarkdownCodeBlock({
  className,
  children,
  node: _node,
  ...props
}: MarkdownInlineCodeProps) {
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

function getCodeBlockPayload(children: ReactNode): { className?: string; code: string } | null {
  const child = Array.isArray(children) ? children[0] : children;

  if (!isValidElement(child)) {
    return null;
  }

  const childProps = child.props as {
    className?: string;
    children?: ReactNode;
  };

  return {
    className: childProps.className,
    code: String(childProps.children ?? '').replace(/\n$/, ''),
  };
}

export function MarkdownPreBlock({ children, node: _node, ...props }: MarkdownPreBlockProps) {
  const [syntaxModule, setSyntaxModule] = useState<SyntaxModule | null>(null);
  const [copied, setCopied] = useState(false);
  const payload = getCodeBlockPayload(children);

  useEffect(() => {
    let mounted = true;

    void loadSyntaxModule()
      .then((module) => {
        if (mounted) {
          setSyntaxModule(module);
        }
      })
      .catch((error) => {
        console.error('[MarkdownPreBlock] Failed to load syntax highlighter:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!payload) {
    return <pre {...props}>{children}</pre>;
  }

  const { id: language, label } = resolveCodeLanguage(payload.className);
  const code = payload.code;

  function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      console.error('[MarkdownPreBlock] Clipboard API is unavailable.');

      return;
    }

    navigator.clipboard.writeText(code)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((error) => {
        console.error('[MarkdownPreBlock] Failed to copy code:', error);
      });
  }

  if (!syntaxModule) {
    return (
      <div className="demo-flow-markdown-code-block">
        <div className="demo-flow-markdown-code-header">
          <div className="demo-flow-markdown-code-header-main">
            <span className="demo-flow-markdown-code-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="demo-flow-markdown-code-language">{label}</span>
          </div>
          <button type="button" className="demo-flow-markdown-code-copy" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="demo-flow-markdown-code-body">
          <pre className="demo-flow-markdown-code-fallback">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );
  }

  const SyntaxHighlighter = syntaxModule.Prism;

  return (
    <div className="demo-flow-markdown-code-block">
      <div className="demo-flow-markdown-code-header">
        <div className="demo-flow-markdown-code-header-main">
          <span className="demo-flow-markdown-code-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="demo-flow-markdown-code-language">{label}</span>
        </div>
        <button type="button" className="demo-flow-markdown-code-copy" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="demo-flow-markdown-code-body">
        <SyntaxHighlighter
          language={language}
          style={syntaxModule.style}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: 'var(--demo-code-body-pad-y) var(--demo-code-body-pad-x)',
            background: 'transparent',
            borderRadius: 0,
            fontSize: '0.81rem',
            lineHeight: 1.78,
          }}
          codeTagProps={{
            className: 'demo-flow-markdown-code-content',
            style: {
              fontFamily: 'var(--font-mono), "SFMono-Regular", monospace',
              backgroundColor: 'transparent',
            },
          }}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
