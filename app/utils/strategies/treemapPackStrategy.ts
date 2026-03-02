import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import type { Node } from 'reactflow';
import { findRootNode, collectDescendants, getNodeDimensions } from '../layoutUtils';
import { runFlextreeLayout } from './flextreeUtils';
import type { LayoutStrategy, LayoutContext } from './types';

interface TmDatum {
    id: string;
    area?: number;
    children?: TmDatum[];
}

/**
 * TreemapPackStrategy:
 *   L1 children → d3-treemap for proportional area allocation
 *   L2+ descendants → shelf bin-packing within each treemap cell
 *   Root → placed left of the treemap grid, vertically centered
 */
export class TreemapPackStrategy implements LayoutStrategy {
    async layoutGroup(context: LayoutContext): Promise<Map<string, { x: number; y: number }>> {
        const { nodes, edges, spacing } = context;
        const rootNode = findRootNode(nodes, edges);
        if (!rootNode) return runFlextreeLayout(nodes, edges, spacing);

        const l1ChildIds = edges
            .filter(e => e.source === rootNode.id)
            .map(e => e.target);

        if (l1ChildIds.length < 2) return runFlextreeLayout(nodes, edges, spacing);

        // Gather subtree info for each L1 child
        const subtrees = l1ChildIds.map(childId => {
            const nodeIds = collectDescendants([childId], edges);
            const subtreeNodes = nodes.filter(n => nodeIds.has(n.id));
            const totalArea = subtreeNodes.reduce((sum, n) => {
                const { width, height } = getNodeDimensions(n);
                return sum + width * height;
            }, 0);
            return { childId, subtreeNodes, totalArea };
        });

        // Container size: based on total node area with packing density factor
        const totalNodeArea = subtrees.reduce((sum, s) => sum + s.totalArea, 0);
        const containerArea = totalNodeArea * 3;
        const containerWidth = Math.sqrt(containerArea * 1.5);
        const containerHeight = containerArea / containerWidth;

        // d3-treemap: divide container proportionally among L1 children
        const tmData: TmDatum = {
            id: 'root',
            children: subtrees.map(s => ({ id: s.childId, area: s.totalArea })),
        };
        const tmRoot = hierarchy<TmDatum>(tmData).sum(d => d.area ?? 0);
        const tmLayout = treemap<TmDatum>()
            .size([containerWidth, containerHeight])
            .padding(spacing)
            .tile(treemapSquarify);
        const laid = tmLayout(tmRoot);

        const positions = new Map<string, { x: number; y: number }>();

        // Root: left of treemap, vertically centered
        const rootDims = getNodeDimensions(rootNode);
        positions.set(rootNode.id, {
            x: -(rootDims.width + spacing * 2),
            y: containerHeight / 2 - rootDims.height / 2,
        });

        // Bin-pack descendants within each treemap cell
        laid.children?.forEach(cell => {
            const subtree = subtrees.find(s => s.childId === cell.data.id)!;
            shelfPack(
                subtree.subtreeNodes,
                cell.x0, cell.y0,
                cell.x1 - cell.x0, cell.y1 - cell.y0,
                spacing, positions,
            );
        });

        return positions;
    }
}

/**
 * Shelf-based bin packing: sort nodes by area descending,
 * then fill rows left-to-right within the cell bounds.
 */
function shelfPack(
    nodes: Node[],
    cellX: number,
    cellY: number,
    cellW: number,
    _cellH: number,
    gap: number,
    positions: Map<string, { x: number; y: number }>,
) {
    const sorted = [...nodes].sort((a, b) => {
        const { width: wa, height: ha } = getNodeDimensions(a);
        const { width: wb, height: hb } = getNodeDimensions(b);
        return (wb * hb) - (wa * ha);
    });

    const pad = gap * 0.5;
    let curX = cellX + pad;
    let curY = cellY + pad;
    let rowHeight = 0;

    for (const node of sorted) {
        const { width, height } = getNodeDimensions(node);

        if (curX + width > cellX + cellW - pad && curX > cellX + pad) {
            curX = cellX + pad;
            curY += rowHeight + pad;
            rowHeight = 0;
        }

        positions.set(node.id, { x: curX, y: curY });
        curX += width + pad;
        rowHeight = Math.max(rowHeight, height);
    }
}
