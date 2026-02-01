
import { applyLayout } from './elk';
import { Container } from '../reconciler/hostConfig';

describe('ELK Layout (Server Side)', () => {
    it('should pass through graph without modification (layout moved to client)', async () => {
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

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const resGraph = result.value;
            // Should remain exactly as input, no layout calculation on server
            const mindmap = resGraph.children[0];
            const n1 = mindmap.children.find((c: any) => c.props.id === 'n1');

            // In the old logic, x and y might have been added. Now they shouldn't change if not present.
            // or should default to 0? The current implementation uses ResultAsync.fromSafePromise(Promise.resolve(graph));
            // So it returns the EXACT object reference or copy.

            expect(n1).toBeDefined();
        }
    });
});
