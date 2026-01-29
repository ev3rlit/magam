import { Injectable } from '@nestjs/common';
import { Node, Edge } from '../domain/types';

@Injectable()
export class LayoutService {
    private readonly HORIZONTAL_SPACING = 250;
    private readonly VERTICAL_SPACING = 100;

    applyTreeLayout(nodes: Node[], edges: Edge[], rootId: string): Node[] {
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const adjacency = new Map<string, string[]>();

        // Build adjacency list (Parent -> Children) based on explicit edges or parentId?
        // PRD uses parentId for hierarchy, but edges visualize it.
        // Let's rely on 'parentId' property first if populated.
        // Actually typical MCP tool 'addChildNode' sets parentId.
        // Edges should exist too.
        // Let's use edges to determine structure if parentId is missing?
        // No, let's use parentId for the tree definition as per implementation plan.

        nodes.forEach(node => {
            if (node.data.parentId) {
                if (!adjacency.has(node.data.parentId)) adjacency.set(node.data.parentId, []);
                adjacency.get(node.data.parentId)!.push(node.id);
            }
        });

        // Traverse and assign positions
        // Simple algorithm:
        // Horizontal Layout: Root at Left.
        // DFS post-order traversal to determine subtree heights.

        let nextYByDepth: { [depth: number]: number } = {};

        // However, standard tidy tree needs post-order.
        // Let's do a simple "Leaf-driven" vertical spacing.

        const positions = new Map<string, { x: number, y: number }>();
        let globalY = 0;

        const traverse = (nodeId: string, depth: number) => {
            const children = adjacency.get(nodeId) || [];

            if (children.length === 0) {
                // Leaf
                positions.set(nodeId, {
                    x: depth * this.HORIZONTAL_SPACING,
                    y: globalY
                });
                globalY += this.VERTICAL_SPACING;
            } else {
                // Computed based on children
                let minY = Infinity;
                let maxY = -Infinity;

                children.forEach(childId => {
                    traverse(childId, depth + 1);
                    const childPos = positions.get(childId);
                    if (childPos) {
                        minY = Math.min(minY, childPos.y);
                        maxY = Math.max(maxY, childPos.y);
                    }
                });

                // My Y is average of children
                positions.set(nodeId, {
                    x: depth * this.HORIZONTAL_SPACING,
                    y: (minY + maxY) / 2
                });
            }
        };

        traverse(rootId, 0);

        // Apply new positions
        return nodes.map(n => {
            const pos = positions.get(n.id);
            if (pos) {
                // Keep existing style, update position
                return { ...n, position: pos };
            }
            return n;
        });
    }
}
