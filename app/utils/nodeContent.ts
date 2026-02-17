import { parseRenderableChildren, type RenderChildNode } from './childComposition';

export function extractNodeContent(
  rendererChildren: RenderChildNode[],
  fallbackChildren: unknown,
  options?: { textJoiner?: string },
): {
  label: string;
  icon?: string;
  parsedChildren: ReturnType<typeof parseRenderableChildren>;
} {
  const parsedChildren = parseRenderableChildren(rendererChildren, fallbackChildren);
  const textJoiner = options?.textJoiner ?? '';

  const label = parsedChildren
    .filter((content): content is { type: 'text'; text: string } =>
      content.type === 'text',
    )
    .map((content) => content.text)
    .join(textJoiner);

  const icon = parsedChildren.find(
    (content): content is { type: 'lucide-icon'; name: string } =>
      content.type === 'lucide-icon',
  )?.name;

  return { label, icon, parsedChildren };
}
