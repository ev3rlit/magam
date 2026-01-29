import { Canvas } from './canvas.entity';
import { Node } from './types';

describe('Canvas Entity', () => {
    it('should add a node', () => {
        const canvas = new Canvas('test-id');
        const node: Node = {
            id: '1',
            type: 'sticky',
            position: { x: 0, y: 0 },
            data: { content: 'hello' },
        };
        canvas.addNode(node);
        expect(canvas.nodes).toHaveLength(1);
        expect(canvas.nodes[0]).toEqual(node);
    });

    it('should delete a node and connected edges', () => {
        const canvas = new Canvas('test-id');
        const node1: Node = {
            id: '1',
            type: 'sticky',
            position: { x: 0, y: 0 },
            data: { content: '1' },
        };
        const node2: Node = {
            id: '2',
            type: 'sticky',
            position: { x: 10, y: 10 },
            data: { content: '2' },
        };
        canvas.addNode(node1);
        canvas.addNode(node2);
        canvas.addEdge({
            id: 'e1',
            source: '1',
            target: '2',
            type: 'arrow',
        });

        expect(canvas.nodes).toHaveLength(2);
        expect(canvas.edges).toHaveLength(1);

        canvas.deleteNode('1');

        expect(canvas.nodes).toHaveLength(1);
        expect(canvas.nodes[0].id).toBe('2');
        expect(canvas.edges).toHaveLength(0);
    });
});
