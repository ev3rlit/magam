import type { DemoRawRenderNode } from '@/src/demo/preview/types';

function readFallbackText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => readFallbackText(item)).filter(Boolean).join('\n');
  }

  return '';
}

function collectText(node: DemoRawRenderNode): string[] {
  if (node.type === 'text') {
    const text = node.props?.text;

    return typeof text === 'string' || typeof text === 'number' ? [String(text)] : [];
  }

  if (node.type === 'graph-markdown') {
    const content = node.props?.content;

    return typeof content === 'string' ? [content] : [];
  }

  if (node.type === 'graph-text') {
    const nestedText = (node.children ?? []).flatMap((child) => collectText(child));

    if (nestedText.length > 0) {
      return nestedText;
    }

    return [readFallbackText(node.props?.children)].filter(Boolean);
  }

  return (node.children ?? []).flatMap((child) => collectText(child));
}

export function extractPreviewContent(input: {
  rendererChildren: DemoRawRenderNode[];
  fallbackChildren?: unknown;
}): {
  label: string;
  markdown?: string;
} {
  const markdownChild = input.rendererChildren.find((child) => child.type === 'graph-markdown');
  const markdown =
    markdownChild && typeof markdownChild.props?.content === 'string'
      ? markdownChild.props.content
      : undefined;
  const rendererText = input.rendererChildren.flatMap((child) => collectText(child)).join('\n').trim();
  const fallbackText = readFallbackText(input.fallbackChildren).trim();
  const label = markdown ?? rendererText ?? fallbackText;

  return {
    label: label || fallbackText,
    ...(markdown ? { markdown } : {}),
  };
}
