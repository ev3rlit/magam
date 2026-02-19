/**
 * useFileSync Hook - WebSocket client for file synchronization
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGraphStore } from '@/store/graph';

const PORT = process.env.NEXT_PUBLIC_MAGAM_WS_PORT || '3001';
const WS_URL = `ws://localhost:${PORT}`;
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

export class RpcClientError extends Error {
    code: number;
    data?: unknown;

    constructor(code: number, message: string, data?: unknown) {
        super(message);
        this.name = 'RpcClientError';
        this.code = code;
        this.data = data;
    }
}

let requestIdCounter = 0;

export function shouldReloadForFileChange(input: {
    changedFile: string;
    currentFile: string | null;
    incomingOriginId?: unknown;
    incomingCommandId?: unknown;
    clientId: string;
    lastAppliedCommandId?: string;
}): boolean {
    if (input.changedFile !== input.currentFile) return false;

    const isSelfEvent =
        input.incomingOriginId === input.clientId &&
        typeof input.incomingCommandId === 'string' &&
        input.incomingCommandId === input.lastAppliedCommandId;

    return !isSelfEvent;
}

export function useFileSync(
    filePath: string | null,
    onFileChange: () => void,
    onFilesChange?: () => void,
) {
    const wsRef = useRef<WebSocket | null>(null);
    const pendingRequestsRef = useRef<Map<number, {
        resolve: (result: unknown) => void;
        reject: (error: Error) => void;
    }>>(new Map());
    const currentFileRef = useRef<string | null>(null);

    const sendRequest = useCallback(async (method: string, params: Record<string, unknown>): Promise<unknown> => {
        return new Promise((resolve, reject) => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const id = ++requestIdCounter;
            const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };
            pendingRequestsRef.current.set(id, { resolve, reject });

            setTimeout(() => {
                if (pendingRequestsRef.current.has(id)) {
                    pendingRequestsRef.current.delete(id);
                    reject(new Error(`Request timeout: ${method}`));
                }
            }, REQUEST_TIMEOUT);

            wsRef.current.send(JSON.stringify(request));
        });
    }, []);

    const handleMessage = useCallback((event: MessageEvent) => {
        let data: JsonRpcResponse;
        try {
            data = JSON.parse(event.data);
        } catch {
            console.error('[FileSync] Failed to parse message:', event.data);
            return;
        }

        if (data.id !== undefined) {
            const pending = pendingRequestsRef.current.get(data.id);
            if (pending) {
                pendingRequestsRef.current.delete(data.id);
                if (data.error) {
                    pending.reject(new RpcClientError(data.error.code, data.error.message, data.error.data));
                } else {
                    pending.resolve(data.result);
                }
            }
            return;
        }

        if (data.method === 'file.changed') {
            const changedFile = data.params?.filePath as string;
            if (changedFile === currentFileRef.current) {
                const incomingVersion = data.params?.version;
                const incomingOriginId = data.params?.originId;
                const incomingCommandId = data.params?.commandId;
                const { clientId, lastAppliedCommandId, setSourceVersion } = useGraphStore.getState();

                if (typeof incomingVersion === 'string') {
                    setSourceVersion(incomingVersion);
                }

                const shouldReload = shouldReloadForFileChange({
                    changedFile,
                    currentFile: currentFileRef.current,
                    incomingOriginId,
                    incomingCommandId,
                    clientId,
                    lastAppliedCommandId,
                });

                if (!shouldReload) {
                    console.log('[FileSync] Ignored self-origin file.changed');
                    return;
                }

                onFileChange();
            }
        }

        if (data.method === 'files.changed') {
            onFilesChange?.();
        }
    }, [onFileChange, onFilesChange]);

    useEffect(() => {
        if (!filePath) return;

        currentFileRef.current = filePath;
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            sendRequest('file.subscribe', { filePath }).catch((err) => console.error('[FileSync] Subscribe failed:', err));
        };

        ws.onmessage = handleMessage;
        ws.onerror = (error) => console.error('[FileSync] WebSocket error:', error);
        ws.onclose = () => console.log('[FileSync] Disconnected from server');

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                sendRequest('file.unsubscribe', { filePath }).catch(() => { });
            }
            ws.close();
            wsRef.current = null;
        };
    }, [filePath, sendRequest, handleMessage]);

    const withCommon = useCallback((params: Record<string, unknown>) => {
        const { sourceVersion, clientId } = useGraphStore.getState();
        if (!sourceVersion) {
            throw new Error('SOURCE_VERSION_NOT_READY');
        }
        const commandId = crypto.randomUUID();
        useGraphStore.getState().setLastAppliedCommandId(commandId);

        return {
            ...params,
            baseVersion: sourceVersion,
            originId: clientId,
            commandId,
        };
    }, []);

    const applyResultVersion = useCallback((result: unknown) => {
        const typed = result as { newVersion?: string; commandId?: string };
        if (typed?.newVersion) {
            useGraphStore.getState().setSourceVersion(typed.newVersion);
        }
        if (typed?.commandId) {
            useGraphStore.getState().setLastAppliedCommandId(typed.commandId);
        }
    }, []);

    const updateNode = useCallback(async (nodeId: string, props: Record<string, unknown>) => {
        if (!filePath) return;
        const result = await sendRequest('node.update', withCommon({ filePath, nodeId, props }));
        applyResultVersion(result);
    }, [filePath, sendRequest, withCommon, applyResultVersion]);

    const moveNode = useCallback(async (nodeId: string, x: number, y: number) => {
        if (!filePath) return;
        const result = await sendRequest('node.move', withCommon({ filePath, nodeId, x, y }));
        applyResultVersion(result);
    }, [filePath, sendRequest, withCommon, applyResultVersion]);

    const createNode = useCallback(async (node: Record<string, unknown>) => {
        if (!filePath) return;
        const result = await sendRequest('node.create', withCommon({ filePath, node }));
        applyResultVersion(result);
    }, [filePath, sendRequest, withCommon, applyResultVersion]);

    const reparentNode = useCallback(async (nodeId: string, newParentId?: string) => {
        if (!filePath) return;
        const result = await sendRequest('node.reparent', withCommon({ filePath, nodeId, newParentId }));
        applyResultVersion(result);
    }, [filePath, sendRequest, withCommon, applyResultVersion]);

    return { updateNode, moveNode, createNode, reparentNode };
}
