import { Node, Edge } from 'reactflow';
// @ts-ignore
import ELK from 'elkjs/lib/elk.bundled';
import { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk-api';

// Default options for ELK layout
export const DEFAULT_LAYOUT_OPTIONS = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.spacing.nodeNode': '20',
    'elk.layered.spacing.nodeNodeBetweenLayers': '40',
    // Preserve node/edge order as declared in the source code
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
};

/**
 * Find the root node (node with no incoming edges)
 */
export function findRootNode(nodes: Node[], edges: Edge[]): Node | null {
    const targetIds = new Set(edges.map(e => e.target));
    return nodes.find(n => !targetIds.has(n.id)) || null;
}

/**
 * Collect all descendant node IDs of given root IDs (BFS)
 */
export function collectDescendants(
    rootIds: string[],
    edges: Edge[]
): Set<string> {
    const descendants = new Set<string>(rootIds);
    const childrenMap = new Map<string, string[]>();

    edges.forEach(e => {
        if (!childrenMap.has(e.source)) childrenMap.set(e.source, []);
        childrenMap.get(e.source)!.push(e.target);
    });

    const queue = [...rootIds];
    while (queue.length > 0) {
        const current = queue.shift()!;
        const children = childrenMap.get(current) || [];
        children.forEach(child => {
            if (!descendants.has(child)) {
                descendants.add(child);
                queue.push(child);
            }
        });
    }

    return descendants;
}

/**
 * Get node dimensions from React Flow node
 */
export function getNodeDimensions(node: Node): { width: number; height: number } {
    // @ts-ignore
    const w = node.measured?.width ?? node.width ?? node.data?.width ?? 150;
    // @ts-ignore
    const h = node.measured?.height ?? node.height ?? node.data?.height ?? 50;
    return { width: w, height: h };
}

/**
 * Calculate the bounding box for a group of nodes
 */
export function calculateGroupBoundingBox(nodes: Node[]): { x: number; y: number; width: number; height: number } {
    if (nodes.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    nodes.forEach(node => {
        const { width, height } = getNodeDimensions(node);

        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + width);
        maxY = Math.max(maxY, node.position.y + height);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Run ELK layout on a subgraph
 * @returns Map of node IDs to their calculated positions
 */
export async function runElkLayout(
    nodes: Node[],
    edges: Edge[],
    direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN',
    spacing: number,
    additionalOptions: Record<string, string> = {}
): Promise<Map<string, { x: number; y: number }>> {
    const elk = new ELK();

    const elkNodes: ElkNode[] = nodes.map(node => {
        const { width, height } = getNodeDimensions(node);
        return { id: node.id, width, height };
    });

    const elkEdges: ElkExtendedEdge[] = edges.map(edge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
    }));

    const layoutOptions = {
        ...DEFAULT_LAYOUT_OPTIONS,
        'elk.direction': direction,
        'elk.spacing.nodeNode': String(spacing),
        ...additionalOptions,
    };

    const graph: ElkNode = {
        id: 'root',
        layoutOptions,
        children: elkNodes,
        edges: elkEdges,
    };

    const layoutedGraph = await elk.layout(graph);

    const positions = new Map<string, { x: number; y: number }>();
    layoutedGraph.children?.forEach(n => {
        positions.set(n.id, { x: n.x!, y: n.y! });
    });

    return positions;
}

/**
 * Calculate Y bounding box for positions, excluding a specific ID
 */
export function getYBounds(
    positions: Map<string, { x: number; y: number }>,
    excludeId: string
): { min: number; max: number; center: number } {
    let minY = Infinity;
    let maxY = -Infinity;

    positions.forEach((pos, nodeId) => {
        if (nodeId !== excludeId) {
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        }
    });

    return {
        min: minY,
        max: maxY,
        center: (minY + maxY) / 2
    };
}
