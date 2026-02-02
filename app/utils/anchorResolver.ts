import { Node } from 'reactflow';

export type AnchorPosition =
    | 'top' | 'bottom' | 'left' | 'right'
    | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface AnchorConfig {
    anchor: string;
    position: AnchorPosition;
    gap?: number;
    align?: 'start' | 'center' | 'end';
}

interface NodeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Calculate the position of a node relative to an anchor node
 */
export function calculateAnchoredPosition(
    config: AnchorConfig,
    anchorNode: NodeRect,
    targetSize: { width: number; height: number }
): { x: number; y: number } {
    const gap = config.gap ?? 40;
    const align = config.align ?? 'center';

    let x: number;
    let y: number;

    // Helper functions for alignment
    const alignX = (anchor: NodeRect, targetWidth: number, alignment: string): number => {
        switch (alignment) {
            case 'start':
                return anchor.x;
            case 'end':
                return anchor.x + anchor.width - targetWidth;
            case 'center':
            default:
                return anchor.x + (anchor.width - targetWidth) / 2;
        }
    };

    const alignY = (anchor: NodeRect, targetHeight: number, alignment: string): number => {
        switch (alignment) {
            case 'start':
                return anchor.y;
            case 'end':
                return anchor.y + anchor.height - targetHeight;
            case 'center':
            default:
                return anchor.y + (anchor.height - targetHeight) / 2;
        }
    };

    switch (config.position) {
        case 'right':
            x = anchorNode.x + anchorNode.width + gap;
            y = alignY(anchorNode, targetSize.height, align);
            break;
        case 'left':
            x = anchorNode.x - targetSize.width - gap;
            y = alignY(anchorNode, targetSize.height, align);
            break;
        case 'top':
            x = alignX(anchorNode, targetSize.width, align);
            y = anchorNode.y - targetSize.height - gap;
            break;
        case 'bottom':
            x = alignX(anchorNode, targetSize.width, align);
            y = anchorNode.y + anchorNode.height + gap;
            break;
        case 'top-left':
            x = anchorNode.x - targetSize.width - gap;
            y = anchorNode.y - targetSize.height - gap;
            break;
        case 'top-right':
            x = anchorNode.x + anchorNode.width + gap;
            y = anchorNode.y - targetSize.height - gap;
            break;
        case 'bottom-left':
            x = anchorNode.x - targetSize.width - gap;
            y = anchorNode.y + anchorNode.height + gap;
            break;
        case 'bottom-right':
            x = anchorNode.x + anchorNode.width + gap;
            y = anchorNode.y + anchorNode.height + gap;
            break;
        default:
            x = anchorNode.x + anchorNode.width + gap;
            y = alignY(anchorNode, targetSize.height, align);
    }

    return { x, y };
}

/**
 * Topological sort of nodes based on anchor dependencies
 * Returns nodes in order that respects dependencies
 * Throws error if circular reference detected
 */
export function topologicalSort(nodes: Node[]): Node[] {
    const nodeMap = new Map<string, Node>();
    const dependsOn = new Map<string, string>(); // nodeId -> anchorId
    const inDegree = new Map<string, number>();

    // Build maps
    nodes.forEach((node) => {
        nodeMap.set(node.id, node);
        inDegree.set(node.id, 0);

        // Check if this node has an anchor dependency
        const anchor = node.data?.anchor;
        if (anchor) {
            dependsOn.set(node.id, anchor);
        }
    });

    // Calculate in-degrees
    dependsOn.forEach((anchorId, nodeId) => {
        if (nodeMap.has(anchorId)) {
            inDegree.set(nodeId, (inDegree.get(nodeId) ?? 0) + 1);
        }
    });

    // Kahn's algorithm
    const queue: Node[] = [];
    const result: Node[] = [];

    // Start with nodes that have no dependencies (in-degree 0)
    inDegree.forEach((degree, nodeId) => {
        if (degree === 0) {
            const node = nodeMap.get(nodeId);
            if (node) queue.push(node);
        }
    });

    while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);

        // Find nodes that depend on current
        dependsOn.forEach((anchorId, nodeId) => {
            if (anchorId === current.id) {
                const newDegree = (inDegree.get(nodeId) ?? 1) - 1;
                inDegree.set(nodeId, newDegree);

                if (newDegree === 0) {
                    const node = nodeMap.get(nodeId);
                    if (node) queue.push(node);
                }
            }
        });
    }

    // Check for circular references
    if (result.length !== nodes.length) {
        const unprocessed = nodes.filter((n) => !result.includes(n));
        console.error('[AnchorResolver] Circular reference detected in:', unprocessed.map((n) => n.id));
        // Return original order for unprocessed nodes, appended at end
        return [...result, ...unprocessed];
    }

    return result;
}

/**
 * Resolve all anchor-based positions in the node array
 * Returns a new array with updated positions
 */
export function resolveAnchors(nodes: Node[]): Node[] {
    // First, topologically sort the nodes
    const sortedNodes = topologicalSort(nodes);

    // Map to store resolved positions
    const resolvedPositions = new Map<string, NodeRect>();

    // Process nodes in dependency order
    return sortedNodes.map((node) => {
        const anchor = node.data?.anchor as string | undefined;
        const position = node.data?.position as AnchorPosition | undefined;

        // Get node dimensions (use measured if available, otherwise fallback)
        // @ts-ignore - measured is added by React Flow after rendering
        const width = node.measured?.width ?? node.width ?? node.data?.width ?? 150;
        // @ts-ignore
        const height = node.measured?.height ?? node.height ?? node.data?.height ?? 50;

        // If this node has coordinates already (no anchor), store its position
        if (!anchor || node.position.x !== 0 || node.position.y !== 0) {
            // Node has explicit coordinates or already positioned
            if (node.position.x !== 0 || node.position.y !== 0) {
                resolvedPositions.set(node.id, {
                    x: node.position.x,
                    y: node.position.y,
                    width,
                    height,
                });
                return node;
            }
        }

        // If anchor is specified, calculate position
        if (anchor && position) {
            const anchorRect = resolvedPositions.get(anchor);

            if (anchorRect) {
                const config: AnchorConfig = {
                    anchor,
                    position,
                    gap: node.data?.gap,
                    align: node.data?.align,
                };

                const newPos = calculateAnchoredPosition(config, anchorRect, { width, height });

                // Store the resolved position
                resolvedPositions.set(node.id, {
                    x: newPos.x,
                    y: newPos.y,
                    width,
                    height,
                });

                // Return node with updated position
                return {
                    ...node,
                    position: newPos,
                };
            } else {
                console.warn(`[AnchorResolver] Anchor node "${anchor}" not found for node "${node.id}"`);
            }
        }

        // No anchor or missing anchor node - keep original position
        resolvedPositions.set(node.id, {
            x: node.position.x,
            y: node.position.y,
            width,
            height,
        });

        return node;
    });
}
