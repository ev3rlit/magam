import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CanvasService } from '../../application/canvas.service';
import { LayoutService } from '../../application/layout.service';
import { CanvasGateway } from '../websocket/canvas.gateway';
import { v4 as uuidv4 } from 'uuid';
import { NodeType } from '../../domain/types';

@Injectable()
export class McpService implements OnModuleInit {
    private server: Server;
    private currentCanvasId = 'default';

    constructor(
        private readonly canvasService: CanvasService,
        private readonly layoutService: LayoutService,
        @Inject(forwardRef(() => CanvasGateway))
        private readonly canvasGateway: CanvasGateway
    ) { }

    onModuleInit() {
        this.server = new Server(
            { name: 'graphwrite-server', version: '1.0.0' },
            { capabilities: { tools: {} } }
        );

        this.setupTools();

        const transport = new StdioServerTransport();
        this.server.connect(transport);
    }

    private setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'get_canvas_state',
                    description: 'Get the current state of the canvas including all nodes and edges',
                    inputSchema: { type: 'object', properties: {} },
                },
                {
                    name: 'add_node',
                    description: 'Add a new node to the canvas. Supports sticky notes and shapes.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            type: {
                                type: 'string',
                                enum: ['sticky', 'shape', 'text'],
                                description: 'Type of node (default: sticky)',
                            },
                            content: { type: 'string', description: 'Text content or label' },
                            shape: {
                                type: 'string',
                                enum: ['rectangle', 'circle', 'diamond'],
                                description: 'Shape type (only for type=shape)',
                            },
                            x: { type: 'number', description: 'X position' },
                            y: { type: 'number', description: 'Y position' },
                            backgroundColor: { type: 'string', description: 'Background color' },
                        },
                        required: ['content'],
                    },
                },
                {
                    name: 'delete_node',
                    description: 'Delete a node from the canvas',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            nodeId: { type: 'string', description: 'ID of the node to delete' },
                        },
                        required: ['nodeId'],
                    },
                },
                {
                    name: 'add_edge',
                    description: 'Add a connection (edge) between two nodes',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            source: { type: 'string', description: 'ID of the source node' },
                            target: { type: 'string', description: 'ID of the target node' },
                            label: { type: 'string', description: 'Optional label for the edge' },
                        },
                        required: ['source', 'target'],
                    },
                },
                {
                    name: 'update_node',
                    description: 'Update the content or position of an existing node',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            nodeId: { type: 'string', description: 'ID of the node to update' },
                            content: { type: 'string', description: 'New text content' },
                            x: { type: 'number', description: 'New X position' },
                            y: { type: 'number', description: 'New Y position' },
                        },
                        required: ['nodeId'],
                    },
                },
                {
                    name: 'addChildNode',
                    description: 'Add a child node to an existing node (Mindmap style). Creates a new node and an edge from parent.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            parentId: { type: 'string', description: 'ID of the parent node' },
                            content: { type: 'string', description: 'Content of the child node' },
                            type: { type: 'string', enum: ['sticky', 'shape', 'text'], description: 'Type of child node (default: sticky)' },
                        },
                        required: ['parentId', 'content'],
                    },
                },
                {
                    name: 'applyLayout',
                    description: 'Apply automatic tree layout to organizing the mindmap nodes.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            rootId: { type: 'string', description: 'ID of the root node to start layout from' },
                        },
                        required: ['rootId'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            switch (name) {
                case 'get_canvas_state': {
                    const canvas = await this.canvasService.getCanvas(this.currentCanvasId);
                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify({ nodes: canvas.nodes, edges: canvas.edges }, null, 2),
                        }],
                    };
                }

                case 'add_node': {
                    const canvas = await this.canvasService.getCanvas(this.currentCanvasId);
                    const type = (args as any).type || 'sticky';
                    const shape = (args as any).shape || 'rectangle';

                    const newNode = {
                        id: uuidv4(),
                        type: type as NodeType,
                        position: {
                            x: (args as any).x ?? Math.random() * 500,
                            y: (args as any).y ?? Math.random() * 400,
                        },
                        data: {
                            content: (args as any).content,
                            backgroundColor: (args as any).backgroundColor,
                            shape: type === 'shape' ? shape : undefined,
                            width: type === 'shape' ? 150 : undefined,
                            height: type === 'shape' ? 150 : undefined,
                        },
                    };
                    canvas.addNode(newNode);
                    await this.canvasService.saveCanvas(canvas);
                    this.canvasGateway.broadcastCanvasUpdate(canvas.nodes, canvas.edges);
                    return {
                        content: [{
                            type: 'text',
                            text: `Node added with ID: ${newNode.id}`,
                        }],
                    };
                }

                case 'delete_node': {
                    const canvas = await this.canvasService.getCanvas(this.currentCanvasId);
                    canvas.deleteNode((args as any).nodeId);
                    await this.canvasService.saveCanvas(canvas);
                    this.canvasGateway.broadcastCanvasUpdate(canvas.nodes, canvas.edges);
                    return {
                        content: [{
                            type: 'text',
                            text: `Node ${(args as any).nodeId} deleted`,
                        }],
                    };
                }

                case 'add_edge': {
                    const canvas = await this.canvasService.getCanvas(this.currentCanvasId);
                    const newEdge = {
                        id: uuidv4(),
                        source: (args as any).source,
                        target: (args as any).target,
                        type: 'arrow' as const,
                        label: (args as any).label,
                    };
                    canvas.addEdge(newEdge);
                    await this.canvasService.saveCanvas(canvas);
                    this.canvasGateway.broadcastCanvasUpdate(canvas.nodes, canvas.edges);
                    return {
                        content: [{
                            type: 'text',
                            text: `Edge added from ${newEdge.source} to ${newEdge.target}`,
                        }],
                    };
                }

                case 'update_node': {
                    const canvas = await this.canvasService.getCanvas(this.currentCanvasId);
                    const updates: any = {};
                    if ((args as any).content) {
                        updates.data = { content: (args as any).content };
                    }
                    if ((args as any).x !== undefined || (args as any).y !== undefined) {
                        const node = canvas.nodes.find(n => n.id === (args as any).nodeId);
                        if (node) {
                            updates.position = {
                                x: (args as any).x ?? node.position.x,
                                y: (args as any).y ?? node.position.y,
                            };
                        }
                    }
                    canvas.updateNode((args as any).nodeId, updates);
                    await this.canvasService.saveCanvas(canvas);
                    this.canvasGateway.broadcastCanvasUpdate(canvas.nodes, canvas.edges);
                    return {
                        content: [{
                            type: 'text',
                            text: `Node ${(args as any).nodeId} updated`,
                        }],
                    };
                }

                case 'addChildNode': {
                    const canvas = await this.canvasService.getCanvas(this.currentCanvasId);
                    const parentId = (args as any).parentId;
                    const parentNode = canvas.nodes.find(n => n.id === parentId);

                    if (!parentNode) {
                        throw new Error(`Parent node ${parentId} not found`);
                    }

                    const type = (args as any).type || 'sticky';
                    const newNodeId = uuidv4();

                    // Simple logic: place roughly near parent for now, rely on layout later
                    const newPos = {
                        x: parentNode.position.x + 200,
                        y: parentNode.position.y, // simple overlap, layout will fix
                    };

                    const newNode = {
                        id: newNodeId,
                        type: type as NodeType,
                        position: newPos,
                        data: {
                            content: (args as any).content,
                            parentId: parentId,
                        },
                    };

                    const newEdge = {
                        id: uuidv4(),
                        source: parentId,
                        target: newNodeId,
                        type: 'arrow' as const,
                    };

                    canvas.addNode(newNode);
                    canvas.addEdge(newEdge);

                    await this.canvasService.saveCanvas(canvas);
                    this.canvasGateway.broadcastCanvasUpdate(canvas.nodes, canvas.edges);

                    return {
                        content: [{
                            type: 'text',
                            text: `Child node added: ${newNodeId} (Parent: ${parentId})`,
                        }],
                    };
                }

                case 'applyLayout': {
                    const canvas = await this.canvasService.getCanvas(this.currentCanvasId);
                    const rootId = (args as any).rootId;

                    // Calculate layout
                    const updatedNodes = this.layoutService.applyTreeLayout(
                        canvas.nodes,
                        canvas.edges,
                        rootId
                    );

                    // Update canvas nodes with new positions
                    canvas.nodes = updatedNodes;

                    await this.canvasService.saveCanvas(canvas);
                    this.canvasGateway.broadcastCanvasUpdate(canvas.nodes, canvas.edges);

                    return {
                        content: [{
                            type: 'text',
                            text: `Layout applied starting from root: ${rootId}`,
                        }],
                    };
                }

                default:
                    throw new Error(`Tool not found: ${name}`);
            }
        });
    }
}

