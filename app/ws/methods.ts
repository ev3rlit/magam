/**
 * JSON-RPC Method Handlers
 */

import { patchFile, NodeProps } from './filePatcher';
import { RPC_ERRORS } from './rpc';

export interface RpcContext {
    ws: unknown; // WebSocket instance
    subscriptions: Set<string>;
}

type RpcHandler = (params: Record<string, unknown>, ctx: RpcContext) => Promise<unknown>;

/**
 * Subscribe to file changes
 */
async function handleFileSubscribe(
    params: Record<string, unknown>,
    ctx: RpcContext
): Promise<{ success: boolean }> {
    const filePath = params.filePath as string;

    if (!filePath || typeof filePath !== 'string') {
        throw { ...RPC_ERRORS.INVALID_PARAMS, data: 'filePath is required' };
    }

    ctx.subscriptions.add(filePath);
    console.log(`[RPC] Subscribed to: ${filePath}`);

    return { success: true };
}

/**
 * Unsubscribe from file changes
 */
async function handleFileUnsubscribe(
    params: Record<string, unknown>,
    ctx: RpcContext
): Promise<{ success: boolean }> {
    const filePath = params.filePath as string;

    if (!filePath || typeof filePath !== 'string') {
        throw { ...RPC_ERRORS.INVALID_PARAMS, data: 'filePath is required' };
    }

    ctx.subscriptions.delete(filePath);
    console.log(`[RPC] Unsubscribed from: ${filePath}`);

    return { success: true };
}

/**
 * Update node properties in a file
 */
async function handleNodeUpdate(
    params: Record<string, unknown>,
    _ctx: RpcContext
): Promise<{ success: boolean }> {
    const { filePath, nodeId, props } = params as {
        filePath: string;
        nodeId: string;
        props: NodeProps;
    };

    if (!filePath || typeof filePath !== 'string') {
        throw { ...RPC_ERRORS.INVALID_PARAMS, data: 'filePath is required' };
    }
    if (!nodeId || typeof nodeId !== 'string') {
        throw { ...RPC_ERRORS.INVALID_PARAMS, data: 'nodeId is required' };
    }
    if (!props || typeof props !== 'object') {
        throw { ...RPC_ERRORS.INVALID_PARAMS, data: 'props is required' };
    }

    try {
        await patchFile(filePath, nodeId, props);
        console.log(`[RPC] Updated node ${nodeId} in ${filePath}:`, props);
        return { success: true };
    } catch (error) {
        console.error(`[RPC] Failed to patch file:`, error);
        throw { ...RPC_ERRORS.PATCH_FAILED, data: (error as Error).message };
    }
}

/**
 * All registered RPC methods
 */
export const methods: Record<string, RpcHandler> = {
    'file.subscribe': handleFileSubscribe,
    'file.unsubscribe': handleFileUnsubscribe,
    'node.update': handleNodeUpdate,
};
