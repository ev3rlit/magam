import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class CanvasGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(CanvasGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('canvas:nodeChange')
    handleNodeChange(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket
    ): void {
        // Broadcast to all clients except sender
        client.broadcast.emit('canvas:nodeChange', data);
        this.logger.debug(`Node change from ${client.id}`, data);
    }

    @SubscribeMessage('canvas:edgeChange')
    handleEdgeChange(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket
    ): void {
        client.broadcast.emit('canvas:edgeChange', data);
        this.logger.debug(`Edge change from ${client.id}`, data);
    }

    @SubscribeMessage('canvas:connect')
    handleConnect(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket
    ): void {
        client.broadcast.emit('canvas:connect', data);
        this.logger.debug(`New connection from ${client.id}`, data);
    }

    @SubscribeMessage('canvas:addNode')
    handleAddNode(
        @MessageBody() data: any,
        @ConnectedSocket() client: Socket
    ): void {
        // Broadcast new node to all clients
        this.server.emit('canvas:addNode', data);
        this.logger.log(`Node added by ${client.id}`, data);
    }

    @SubscribeMessage('canvas:deleteNode')
    handleDeleteNode(
        @MessageBody() data: { nodeId: string },
        @ConnectedSocket() client: Socket
    ): void {
        this.server.emit('canvas:deleteNode', data);
        this.logger.log(`Node deleted by ${client.id}`, data);
    }

    @SubscribeMessage('canvas:updateNodeData')
    handleUpdateNodeData(
        @MessageBody() data: { nodeId: string; data: any },
        @ConnectedSocket() client: Socket
    ): void {
        // Broadcast to all clients (including sender to confirm, or exclude sender?)
        // Usually sender updates optimistically. Let's broadcast to others.
        client.broadcast.emit('canvas:updateNodeData', data);
        this.logger.debug(`Node data updated by ${client.id}`, data);
    }

    // Broadcast canvas update to all clients (called from MCP service)
    broadcastCanvasUpdate(nodes: any[], edges: any[]) {
        this.server.emit('canvas:update', { nodes, edges });
    }
}

