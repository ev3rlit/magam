/**
 * useFileSync Hook - WebSocket client for file synchronization
 */

import { useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';
const REQUEST_TIMEOUT = 5000;

interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: number;
    method: string;
    params?: Record<string, unknown>;
}

interface JsonRpcResponse {
    jsonrpc: '2.0';
    id?: number;
    method?: string;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
    params?: Record<string, unknown>;
}

let requestIdCounter = 0;

export function useFileSync(
    filePath: string | null,
    onFileChange: () => void,
    onFilesChange?: () => void
) {
    const wsRef = useRef<WebSocket | null>(null);
    const pendingRequestsRef = useRef<Map<number, {
        resolve: (result: unknown) => void;
        reject: (error: Error) => void;
    }>>(new Map());
    const currentFileRef = useRef<string | null>(null);

    /**
     * Send a JSON-RPC request and wait for response
     */
    const sendRequest = useCallback(
        async (method: string, params: Record<string, unknown>): Promise<unknown> => {
            return new Promise((resolve, reject) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }

                const id = ++requestIdCounter;

                const request: JsonRpcRequest = {
                    jsonrpc: '2.0',
                    id,
                    method,
                    params,
                };

                pendingRequestsRef.current.set(id, { resolve, reject });

                // Timeout
                setTimeout(() => {
                    if (pendingRequestsRef.current.has(id)) {
                        pendingRequestsRef.current.delete(id);
                        reject(new Error(`Request timeout: ${method}`));
                    }
                }, REQUEST_TIMEOUT);

                wsRef.current.send(JSON.stringify(request));
            });
        },
        []
    );

    /**
     * Handle incoming WebSocket messages
     */
    const handleMessage = useCallback(
        (event: MessageEvent) => {
            let data: JsonRpcResponse;
            try {
                data = JSON.parse(event.data);
            } catch {
                console.error('[FileSync] Failed to parse message:', event.data);
                return;
            }

            // Response to a request
            if (data.id !== undefined) {
                const pending = pendingRequestsRef.current.get(data.id);
                if (pending) {
                    pendingRequestsRef.current.delete(data.id);
                    if (data.error) {
                        pending.reject(new Error(data.error.message));
                    } else {
                        pending.resolve(data.result);
                    }
                }
                return;
            }

            // Notification from server: file content changed
            if (data.method === 'file.changed') {
                const changedFile = data.params?.filePath as string;
                if (changedFile === currentFileRef.current) {
                    console.log('[FileSync] File changed, triggering reload...');
                    onFileChange();
                }
            }

            // Notification from server: file list changed (add/delete)
            if (data.method === 'files.changed') {
                const eventType = data.params?.event as string;
                const changedFile = data.params?.filePath as string;
                console.log(`[FileSync] Files changed: ${eventType} - ${changedFile}`);
                onFilesChange?.();
            }
        },
        [onFileChange, onFilesChange]
    );

    /**
     * Connect to WebSocket and subscribe to file
     */
    useEffect(() => {
        if (!filePath) return;

        currentFileRef.current = filePath;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[FileSync] Connected to server');
            sendRequest('file.subscribe', { filePath })
                .then(() => console.log(`[FileSync] Subscribed to: ${filePath}`))
                .catch((err) => console.error('[FileSync] Subscribe failed:', err));
        };

        ws.onmessage = handleMessage;

        ws.onerror = (error) => {
            console.error('[FileSync] WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('[FileSync] Disconnected from server');
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                sendRequest('file.unsubscribe', { filePath }).catch(() => { });
            }
            ws.close();
            wsRef.current = null;
        };
    }, [filePath, sendRequest, handleMessage]);

    /**
     * Update node properties in the file
     */
    const updateNode = useCallback(
        async (nodeId: string, props: Record<string, unknown>) => {
            if (!filePath) return;

            try {
                await sendRequest('node.update', { filePath, nodeId, props });
                console.log(`[FileSync] Updated node ${nodeId}:`, props);
            } catch (error) {
                console.error('[FileSync] Failed to update node:', error);
            }
        },
        [filePath, sendRequest]
    );

    return { updateNode };
}
