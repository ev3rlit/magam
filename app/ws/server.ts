/**
 * WebSocket Server with JSON-RPC 2.0 and File Watching
 * 
 * Run: bun run app/ws/server.ts
 */

import { watch } from 'chokidar';
import { resolve } from 'path';
import {
    createResponse,
    createErrorResponse,
    createNotification,
    isValidRequest,
    RPC_ERRORS,
    type JsonRpcRequest,
} from './rpc';
import { methods, type RpcContext } from './methods';

const PORT = parseInt(process.env.GRAPHWRITE_WS_PORT || '3001', 10);
const WATCH_DIR = process.env.GRAPHWRITE_TARGET_DIR || './examples';

// Client connections with their subscriptions
const clients = new Map<unknown, Set<string>>();

console.log(`[WS] Starting JSON-RPC WebSocket server on port ${PORT}...`);

const server = Bun.serve({
    port: PORT,
    fetch(req, server) {
        // Upgrade HTTP to WebSocket
        const success = server.upgrade(req);
        if (success) return undefined;

        // Non-WebSocket request
        return new Response('GraphWrite File Sync Server (JSON-RPC 2.0)', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    },
    websocket: {
        open(ws) {
            clients.set(ws, new Set());
            console.log(`[WS] Client connected. Total: ${clients.size}`);
        },

        async message(ws, msg) {
            const msgStr = typeof msg === 'string' ? msg : msg.toString();

            let request: JsonRpcRequest;
            try {
                request = JSON.parse(msgStr);
            } catch {
                ws.send(JSON.stringify(createErrorResponse(0, RPC_ERRORS.PARSE_ERROR.code, RPC_ERRORS.PARSE_ERROR.message)));
                return;
            }

            if (!isValidRequest(request)) {
                ws.send(JSON.stringify(createErrorResponse(0, RPC_ERRORS.INVALID_REQUEST.code, RPC_ERRORS.INVALID_REQUEST.message)));
                return;
            }

            // Notification (no id) - no response needed
            if (request.id === undefined) {
                console.log(`[WS] Received notification: ${request.method}`);
                return;
            }

            // Find handler
            const handler = methods[request.method];
            if (!handler) {
                ws.send(JSON.stringify(createErrorResponse(
                    request.id,
                    RPC_ERRORS.METHOD_NOT_FOUND.code,
                    RPC_ERRORS.METHOD_NOT_FOUND.message
                )));
                return;
            }

            // Execute handler
            const ctx: RpcContext = {
                ws,
                subscriptions: clients.get(ws)!,
            };

            try {
                const result = await handler(request.params || {}, ctx);
                ws.send(JSON.stringify(createResponse(request.id, result)));
            } catch (error) {
                const err = error as { code?: number; message?: string; data?: unknown };
                ws.send(JSON.stringify(createErrorResponse(
                    request.id,
                    err.code || RPC_ERRORS.INTERNAL_ERROR.code,
                    err.message || RPC_ERRORS.INTERNAL_ERROR.message,
                    err.data
                )));
            }
        },

        close(ws) {
            clients.delete(ws);
            console.log(`[WS] Client disconnected. Total: ${clients.size}`);
        },
    },
});

console.log(`[WS] Server running at ws://localhost:${PORT}`);

// File watcher
const watchPath = resolve(process.cwd(), WATCH_DIR);
console.log(`[WS] Watching for file changes in: ${watchPath}`);

const watcher = watch(watchPath, {
    ignoreInitial: true,
    ignored: /(^|[\/\\])\../, // ignore dotfiles
});

/**
 * Broadcast file list update to all connected clients
 */
function broadcastFileListUpdate(event: 'add' | 'unlink', filePath: string) {
    // Extract relative path from the full path
    const relativePath = filePath.replace(watchPath + '/', '');

    const notification = createNotification('files.changed', {
        event,
        filePath: relativePath,
        timestamp: Date.now(),
    });

    const message = JSON.stringify(notification);

    clients.forEach((_, ws) => {
        (ws as { send: (data: string) => void }).send(message);
    });

    console.log(`[WS] Broadcasted files.changed: ${event} - ${relativePath}`);
}

watcher.on('change', (filePath) => {
    console.log(`[WS] File changed: ${filePath}`);

    // Broadcast to subscribed clients
    clients.forEach((subscriptions, ws) => {
        // Check if any subscription matches the changed file
        // Support both full path and filename matching
        let matchedSubscription: string | null = null;

        for (const sub of subscriptions) {
            if (filePath === sub || filePath.endsWith(sub) || sub.endsWith(filePath)) {
                matchedSubscription = sub;
                break;
            }
        }

        if (matchedSubscription) {
            const notification = createNotification('file.changed', {
                filePath: matchedSubscription, // Send back the subscription path
                timestamp: Date.now(),
            });
            (ws as { send: (data: string) => void }).send(JSON.stringify(notification));
            console.log(`[WS] Notified client about: ${matchedSubscription}`);
        }
    });
});

watcher.on('add', (filePath) => {
    // Only handle .tsx files
    if (!filePath.endsWith('.tsx')) return;
    console.log(`[WS] File added: ${filePath}`);
    broadcastFileListUpdate('add', filePath);
});

watcher.on('unlink', (filePath) => {
    // Only handle .tsx files
    if (!filePath.endsWith('.tsx')) return;
    console.log(`[WS] File deleted: ${filePath}`);
    broadcastFileListUpdate('unlink', filePath);
});

watcher.on('error', (error) => {
    console.error('[WS] Watcher error:', error);
});

console.log('[WS] File watcher initialized');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[WS] Shutting down...');
    watcher.close();
    server.stop();
    process.exit(0);
});
