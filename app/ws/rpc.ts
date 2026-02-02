/**
 * JSON-RPC 2.0 Types and Utilities
 */

export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id?: number | string;
    method: string;
    params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: number | string;
    result?: unknown;
    error?: JsonRpcError;
}

export interface JsonRpcNotification {
    jsonrpc: '2.0';
    method: string;
    params?: Record<string, unknown>;
}

export interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}

// Standard JSON-RPC Error Codes
export const RPC_ERRORS = {
    PARSE_ERROR: { code: -32700, message: 'Parse error' },
    INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
    METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
    INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
    INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
    // Custom errors
    FILE_NOT_FOUND: { code: -32000, message: 'File not found' },
    NODE_NOT_FOUND: { code: -32001, message: 'Node not found' },
    PATCH_FAILED: { code: -32002, message: 'Patch failed' },
} as const;

export function createResponse(id: number | string, result: unknown): JsonRpcResponse {
    return { jsonrpc: '2.0', id, result };
}

export function createErrorResponse(
    id: number | string,
    code: number,
    message: string,
    data?: unknown
): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message, data } };
}

export function createNotification(
    method: string,
    params?: Record<string, unknown>
): JsonRpcNotification {
    return { jsonrpc: '2.0', method, params };
}

export function isValidRequest(data: unknown): data is JsonRpcRequest {
    if (typeof data !== 'object' || data === null) return false;
    const req = data as Record<string, unknown>;
    return req.jsonrpc === '2.0' && typeof req.method === 'string';
}
