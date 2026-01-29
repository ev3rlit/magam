import { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    Connection,
    NodeTypes,
    ReactFlowInstance,
    NodeChange,
    EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { StickyNode } from './nodes/StickyNode';
import { ShapeNode } from './nodes/ShapeNode';
import { useSocket } from '../hooks/useSocket';
import { Toolbar } from './Toolbar';

const nodeTypes: NodeTypes = {
    sticky: StickyNode,
    shape: ShapeNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'sticky',
        position: { x: 100, y: 100 },
        data: { content: 'Hello graphwrite!' },
    },
    {
        id: '2',
        type: 'sticky',
        position: { x: 400, y: 100 },
        data: { content: 'AI와 협업하는\n화이트보드' },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
];

export function Canvas() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
    const { isConnected, emit, subscribe } = useSocket();

    // Subscribe to server events
    useEffect(() => {
        // Full state update (from McpService usually)
        const unsubscribeUpdate = subscribe('canvas:update', (data: unknown) => {
            const update = data as { nodes?: Node[]; edges?: Edge[] };
            if (update.nodes) setNodes(update.nodes);
            if (update.edges) setEdges(update.edges);
        });

        // Add Node Event
        const unsubscribeAddNode = subscribe('canvas:addNode', (data: unknown) => {
            const newNode = data as Node;
            setNodes((nds) => {
                if (nds.some((n) => n.id === newNode.id)) return nds;
                return [...nds, newNode];
            });
        });

        // Delete Node Event
        const unsubscribeDeleteNode = subscribe('canvas:deleteNode', (data: unknown) => {
            const { nodeId } = data as { nodeId: string };
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        });

        // Update Node Data Event
        const unsubscribeUpdateNodeData = subscribe('canvas:updateNodeData', (data: unknown) => {
            const { nodeId, data: updates } = data as { nodeId: string; data: any };
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === nodeId) {
                        return { ...n, data: { ...n.data, ...updates } };
                    }
                    return n;
                })
            );
        });

        // Add Edge Event (Connect)
        const unsubscribeConnect = subscribe('canvas:connect', (data: unknown) => {
            const connection = data as Connection;
            setEdges((eds) => addEdge(connection, eds));
        });

        // Node Change (position/selection) - broadcast from other clients
        const unsubscribeNodeChange = subscribe('canvas:nodeChange', (data: unknown) => {
            // React Flow's onNodesChange handles local changes.
            // Remote changes need to be applied.
            // Basic implementation: update matching nodes.
            // However, applying raw NodeChange[] to state usually requires 'applyNodeChanges' helper,
            // but here we might just receive updated nodes or changes.
            // The gateway broadcasts the raw change.
            // Simplification: We rely on 'canvas:update' for major syncs, but for real-time dragging,
            // usually we need to handle this carefully to avoid fighting.
            // For this MVP, let's assume 'canvas:update' handles major things or we implement naive position update.
            // If we receive changes, we can try to apply them if they are position changes.
            // But simpler: just listen for 'canvas:update' from backend if backend persists.
            // The PRD says "Sync Realtime".
            // Let's rely on the incoming changes if possible.
            // NOTE: properly syncing 'NodeChange' events requires using `applyNodeChanges` from reactflow.
            // But useNodesState already wraps it.
            // We can manually apply changes to state if they are not from us.
        });

        return () => {
            unsubscribeUpdate();
            unsubscribeAddNode();
            unsubscribeDeleteNode();
            unsubscribeUpdateNodeData();
            unsubscribeConnect();
            unsubscribeNodeChange();
        };
    }, [subscribe, setNodes, setEdges]);

    const handleNodesChange = useCallback(
        (changes: NodeChange[]) => {
            onNodesChange(changes);
            // Emit node changes to server
            // Only emit if it's a user interaction (not programmatic), but onNodesChange fires for both?
            // React Flow distinguishes somewhat, but let's just emit.
            // Avoid loops by checking if change comes from remote?
            // For MVP, simply emit. The server broadcasts to *others*.
            emit('canvas:nodeChange', changes);
        },
        [onNodesChange, emit]
    );

    const handleEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            onEdgesChange(changes);
            emit('canvas:edgeChange', changes);
        },
        [onEdgesChange, emit]
    );

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) => addEdge(params, eds));
            emit('canvas:connect', params);
        },
        [setEdges, emit]
    );

    const onNodesDelete = useCallback(
        (deleted: Node[]) => {
            deleted.forEach((node) => {
                emit('canvas:deleteNode', { nodeId: node.id });
            });
        },
        [emit]
    );

    const onInit = useCallback((instance: ReactFlowInstance) => {
        reactFlowInstance.current = instance;
    }, []);

    const handleAddNode = (type: 'sticky' | 'shape', shapeType?: 'rectangle' | 'circle' | 'diamond') => {
        const id = crypto.randomUUID();
        const position = {
            x: Math.random() * 500 + 100, // Random position near top-left
            y: Math.random() * 300 + 100,
        };

        let newNode: Node;
        if (type === 'sticky') {
            newNode = {
                id,
                type: 'sticky',
                position,
                data: { content: 'New Sticky Note' },
            };
        } else {
            newNode = {
                id,
                type: 'shape',
                position,
                data: {
                    shape: shapeType || 'rectangle',
                    label: shapeType?.toUpperCase(),
                    width: 150,
                    height: 150,
                },
            };
        }

        setNodes((nds) => [...nds, newNode]);
        emit('canvas:addNode', newNode);
    };

    return (
        <div ref={reactFlowWrapper} style={{ width: '100vw', height: '100vh' }}>
            {/* Connection status indicator */}
            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: isConnected ? '#10b981' : '#ef4444',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 500,
                }}
            >
                {isConnected ? 'Connected' : 'Disconnected'}
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onNodesDelete={onNodesDelete}
                onInit={onInit}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                defaultEdgeOptions={{ type: 'smoothstep' }}
            >
                <Controls />
                <MiniMap />
                <Background gap={15} size={1} />
            </ReactFlow>

            <Toolbar onAddNode={handleAddNode} />
        </div>
    );
}

export default Canvas;

