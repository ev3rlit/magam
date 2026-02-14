import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import glob from 'fast-glob';
import { transpile } from '../core/transpiler';
import { execute } from '../core/executor';

const DEFAULT_PORT = 3002;

export interface HttpServerConfig {
  targetDir: string;
  port?: number;
}

export interface HttpServerResult {
  port: number;
  close: () => Promise<void>;
}

/**
 * File tree node structure for folder tree view
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export async function startHttpServer(config: HttpServerConfig): Promise<HttpServerResult> {
  const port = config.port ?? (parseInt(process.env.MAGAM_HTTP_PORT || '') || DEFAULT_PORT);

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url!, `http://localhost:${port}`);

    try {
      if (req.method === 'POST' && url.pathname === '/render') {
        await handleRender(req, res, config.targetDir);
      } else if (req.method === 'GET' && url.pathname === '/files') {
        await handleFiles(req, res, config.targetDir);
      } else if (req.method === 'GET' && url.pathname === '/file-tree') {
        await handleFileTree(req, res, config.targetDir);
      } else if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', targetDir: config.targetDir }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error: any) {
      console.error('Server Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: error.message || 'Internal Server Error',
        type: 'SERVER_ERROR',
        details: error.stack
      }));
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      console.log(`HTTP render server listening on port ${port}`);
      resolve({
        port,
        close: () => new Promise((r) => server.close(() => r()))
      });
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

async function handleRender(req: http.IncomingMessage, res: http.ServerResponse, targetDir: string) {
  const body = await parseBody(req);
  if (!body || !body.filePath) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing filePath in body', type: 'VALIDATION_ERROR' }));
    return;
  }

  const absolutePath = path.resolve(targetDir, body.filePath);
  if (!fs.existsSync(absolutePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `File not found: ${body.filePath}`, type: 'FILE_NOT_FOUND' }));
    return;
  }

  try {
    const transpiled = await transpile(absolutePath);

    const result = await execute(transpiled);

    if (result.isOk()) {
      const graph = result.value;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ graph }));
    } else {
      console.error('[HttpServer] Execution failed:', result.error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: result.error.message,
        type: result.error.type || 'EXECUTION_ERROR',
        details: result.error.originalError
      }));
    }
  } catch (error: any) {
    console.error('Render Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: error.message,
      type: 'RENDER_ERROR',
      details: error.stack
    }));
  }
}

async function handleFiles(req: http.IncomingMessage, res: http.ServerResponse, targetDir: string) {
  try {
    const files = await glob('**/*.tsx', { cwd: targetDir });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ files }));
  } catch (error: any) {
    console.error('Files Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: error.message,
      type: 'FILES_ERROR'
    }));
  }
}


interface FileEntry {
  path: string;
  type: 'file' | 'directory';
}

/**
 * Build a tree structure from a flat list of file entries
 */
function buildFileTree(entries: FileEntry[], rootName: string = 'root'): FileTreeNode {
  const root: FileTreeNode = {
    name: rootName,
    path: '',
    type: 'directory',
    children: []
  };

  for (const entry of entries) {
    const parts = entry.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      // Find existing child or create new one
      let child = current.children?.find(c => c.name === part);

      if (!child) {
        const type = isLast ? entry.type : 'directory';
        child = {
          name: part,
          path: currentPath,
          type: type,
          children: type === 'directory' ? [] : undefined
        };
        current.children?.push(child);
      }

      if (child.type === 'directory') {
        current = child;
      }
    }
  }

  // Sort children: directories first, then files, both alphabetically
  const sortChildren = (node: FileTreeNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    }
  };
  sortChildren(root);

  return root;
}

async function handleFileTree(req: http.IncomingMessage, res: http.ServerResponse, targetDir: string) {
  try {
    const rawPaths = await glob(['**/*.tsx', '**/'], {
      cwd: targetDir,
      onlyFiles: false,
      markDirectories: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
    });

    const entries: FileEntry[] = rawPaths.map((p: string) => {
      const isDirectory = p.endsWith('/');
      return {
        path: isDirectory ? p.slice(0, -1) : p,
        type: isDirectory ? 'directory' : 'file'
      };
    });

    const tree = buildFileTree(entries, path.basename(targetDir));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tree }));
  } catch (error: any) {
    console.error('FileTree Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: error.message,
      type: 'FILE_TREE_ERROR'
    }));
  }
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}
