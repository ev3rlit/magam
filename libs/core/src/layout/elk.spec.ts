
import { applyLayout } from './elk';
import { Container } from '../reconciler/hostConfig';

describe('ELK Layout', () => {
    it('should successfully apply layout without throwing Worker error', async () => {
        const graph: Container = {
            type: 'root',
            children: [
                {
                    type: 'graph-mindmap',
                    props: { id: 'root' },
                    children: [
                        { type: 'graph-sticky', props: { id: 'n1', width: 100, height: 50 }, children: [] },
                        { type: 'graph-sticky', props: { id: 'n2', width: 100, height: 50 }, children: [] },
                        { type: 'graph-edge', props: { id: 'e1', from: 'n1', to: 'n2' }, children: [] }
                    ]
                }
            ]
        };

        const result = await applyLayout(graph);

        // Basic check that layout modified coordinates
        const mindmap = result.children[0];
        const n1 = mindmap.children.find((c: any) => c.props.id === 'n1');
        const n2 = mindmap.children.find((c: any) => c.props.id === 'n2');

        if (!n1 || !n2) {
            throw new Error('Nodes not found in layout result');
        }

        expect(n1.props['x']).toBeDefined();
        expect(n1.props['y']).toBeDefined();
        expect(n2.props['x']).toBeDefined();
        expect(n2.props['y']).toBeDefined();

        // Ensure they aren't at the exact same position (proving layout logic ran)
        expect(n1.props['x'] !== n2.props['x'] || n1.props['y'] !== n2.props['y']).toBe(true);
    });
});
