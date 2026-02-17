export interface RenderChildNode {
  type: string;
  props?: {
    text?: string;
    content?: string;
    className?: string;
    children?: unknown;
    [key: string]: unknown;
  };
  children?: RenderChildNode[];
}

export type RenderableChild =
  | { type: 'text'; text: string }
  | { type: 'lucide-icon'; name: string };

const LUCIDE_BASE_CLASS = 'lucide';

function toCamelCase(value: string): string {
  return value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

function getClassTokens(className?: string): string[] {
  if (!className) return [];
  return className
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function getLucideNameFromChild(node: RenderChildNode): string | null {
  if (node.type !== 'svg') return null;

  const classTokens = getClassTokens(node.props?.className);
  if (!classTokens.includes(LUCIDE_BASE_CLASS)) return null;

  const iconToken = classTokens.find(
    (token) => token.startsWith('lucide-') && token !== LUCIDE_BASE_CLASS,
  );

  if (!iconToken) return null;
  return toCamelCase(iconToken.replace(/^lucide-/, ''));
}

export function isLucideChild(node: RenderChildNode): boolean {
  return getLucideNameFromChild(node) !== null;
}

export function parseRenderableChildren(
  rendererChildren: RenderChildNode[],
  fallbackChildren?: unknown,
): RenderableChild[] {
  const parsed: RenderableChild[] = [];

  const pushText = (value: unknown) => {
    if (typeof value === 'string' || typeof value === 'number') {
      parsed.push({ type: 'text', text: String(value) });
    }
  };

  rendererChildren.forEach((child) => {
    const iconName = getLucideNameFromChild(child);
    if (iconName) {
      parsed.push({ type: 'lucide-icon', name: iconName });
      return;
    }

    if (child.type === 'text') {
      pushText(child.props?.text);
      return;
    }

    if (child.type === 'graph-text') {
      const textNode = child.children?.find((grandChild) => grandChild.type === 'text');
      if (textNode) {
        pushText(textNode.props?.text);
      } else {
        pushText(child.props?.children);
      }
      return;
    }

    if (child.type === 'graph-markdown') {
      pushText(child.props?.content);
    }
  });

  if (rendererChildren.length === 0 && fallbackChildren !== undefined) {
    const fallbackItems = Array.isArray(fallbackChildren)
      ? fallbackChildren
      : [fallbackChildren];

    fallbackItems.forEach((item) => pushText(item));
  }

  return parsed;
}
