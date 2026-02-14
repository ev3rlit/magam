# Phase 1: Core Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Initialize the project repository, set up the NestJS backend architecture, implement local file storage for canvas state, and establish real-time (WebSocket) and AI (MCP) communication channels.

**Architecture:** Monorepo structure containing `apps/server` (NestJS) and `apps/web` (React - scaffolded later). The server follows Domain-Driven Design (DDD) principles with clear separation of Transport (MCP/WS), Application, Domain, and Infrastructure layers.

**Tech Stack:** Node.js, NestJS, Socket.io, @modelcontextprotocol/sdk, TypeScript.

## Proposed Directory Structure

```
magam/
├── package.json
├── pnpm-workspace.yaml
├── apps/
│   ├── server/          # NestJS Backend
│   │   ├── src/
│   │   │   ├── domain/       # Entities (Node, Edge, Canvas)
│   │   │   ├── application/  # Services, Commands
│   │   │   ├── infra/        # FileRepository, LayoutEngine
│   │   │   └── interface/    # Gateways (WS), Controllers (HTTP), MCP
│   │   └── ...
│   └── web/             # React Frontend (Phase 2)
└── docs/
    └── plans/
```

---

### Task 1: Project Scaffolding & Monorepo Setup

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `apps/server/` (via Nest CLI)

**Step 1: Initialize Git and Root Configuration**
Initialize the git repository and create the pnpm workspace configuration.

```bash
git init
echo "packages:\n  - 'apps/*'" > pnpm-workspace.yaml
npm init -y
```

**Step 2: Install NestJS CLI and Scaffold Server**
Create the server application using NestJS CLI.

```bash
npm install -g @nestjs/cli
nest new apps/server --package-manager pnpm --strict --skip-git
```
*(Note: If `nest` command fails, use `npx @nestjs/cli new ...`)*

**Step 3: Verify Server Startup**
Run the server to ensure basic scaffolding is correct.

```bash
cd apps/server && pnpm start:dev
```
Expected Output: NestJS application starts on port 3000.

**Step 4: Commit**
```bash
git add .
git commit -m "chore: initial project scaffolding with nestjs server"
```

---

### Task 2: Domain Layer Definition

**Files:**
- Create: `apps/server/src/domain/types.ts`
- Create: `apps/server/src/domain/canvas.entity.ts`
- Test: `apps/server/src/domain/canvas.entity.spec.ts`

**Step 1: Define Interfaces**
Create the core domain types based on the PRD.

```typescript
// apps/server/src/domain/types.ts
export type NodeType = 'sticky' | 'shape' | 'text';
export type EdgeType = 'arrow' | 'line';

export interface Node {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: { content: string };
  // ... other fields from PRD
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  // ... other fields from PRD
}
```

**Step 2: Create Canvas Aggregate Root**
Implement the `Canvas` class which will manage the state.

```typescript
// apps/server/src/domain/canvas.entity.ts
import { Node, Edge } from './types';

export class Canvas {
  constructor(
    public readonly id: string,
    public nodes: Node[] = [],
    public edges: Edge[] = []
  ) {}

  addNode(node: Node) {
    this.nodes.push(node);
  }
  // ... basic methods
}
```

**Step 3: Write Unit Test**
Ensure the domain logic works.

```typescript
// apps/server/src/domain/canvas.entity.spec.ts
import { Canvas } from './canvas.entity';

describe('Canvas Entity', () => {
  it('should add a node', () => {
    const canvas = new Canvas('test-id');
    const node = { id: '1', type: 'sticky' as const, position: { x: 0, y: 0 }, data: { content: 'hello' } };
    canvas.addNode(node);
    expect(canvas.nodes).toHaveLength(1);
  });
});
```

**Step 4: Run Test & Commit**
```bash
cd apps/server && pnpm test
git add . && git commit -m "feat(domain): define canvas, node, and edge entities"
```

---

### Task 3: Infrastructure Layer (File Repository)

**Files:**
- Create: `apps/server/src/infra/file.repository.ts`
- Test: `apps/server/src/infra/file.repository.spec.ts`

**Step 1: Write Test for File Operations**
We need a repository that saves/loads JSON files.

```typescript
// apps/server/src/infra/file.repository.spec.ts
import { FileRepository } from './file.repository';
import * as fs from 'fs/promises';

describe('FileRepository', () => {
  const repo = new FileRepository('./test-storage');
  
  it('should save and load a canvas', async () => {
    const data = { id: 'test', nodes: [], edges: [] };
    await repo.saveCanvas('test', data);
    const result = await repo.loadCanvas('test');
    expect(result).toEqual(data);
    await fs.rm('./test-storage', { recursive: true, force: true });
  });
});
```

**Step 2: Implement FileRepository**
Implement the JSON file writing logic using `fs/promises`.

```typescript
// apps/server/src/infra/file.repository.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileRepository {
  constructor(private storagePath: string = './canvases') {}

  private getFilePath(id: string) {
    return path.join(this.storagePath, `${id}.json`);
  }

  async saveCanvas(id: string, data: any): Promise<void> {
    await fs.mkdir(this.storagePath, { recursive: true });
    await fs.writeFile(this.getFilePath(id), JSON.stringify(data, null, 2));
  }

  async loadCanvas(id: string): Promise<any> {
    try {
      const data = await fs.readFile(this.getFilePath(id), 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
```

**Step 3: Run Test & Commit**
```bash
cd apps/server && pnpm test
git add . && git commit -m "feat(infra): implement local json file repository"
```

---

### Task 4: Application Layer (Canvas Service)

**Files:**
- Create: `apps/server/src/application/canvas.service.ts`
- Modify: `apps/server/src/app.module.ts` (Register providers)

**Step 1: Implement CanvasService**
Orchestrate domain and infrastructure.

```typescript
// apps/server/src/application/canvas.service.ts
import { Injectable } from '@nestjs/common';
import { FileRepository } from '../infra/file.repository';
import { Canvas } from '../domain/canvas.entity';

@Injectable()
export class CanvasService {
  constructor(private readonly fileRepo: FileRepository) {}

  async getCanvas(id: string): Promise<Canvas> {
    const data = await this.fileRepo.loadCanvas(id);
    if (!data) return new Canvas(id);
    return new Canvas(id, data.nodes, data.edges);
  }

  async saveCanvas(canvas: Canvas): Promise<void> {
    await this.fileRepo.saveCanvas(canvas.id, canvas);
  }
}
```

**Step 2: Register in Module**
Update `app.module.ts` to include `CanvasService` and `FileRepository`.

**Step 3: Commit**
```bash
git add . && git commit -m "feat(app): implement canvas service"
```

---

### Task 5: WebSocket Gateway

**Files:**
- Create: `apps/server/src/interface/websocket/canvas.gateway.ts`
- Install: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`

**Step 1: Install Dependencies**
```bash
cd apps/server && pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

**Step 2: Implement Gateway**
Setup a basic gateway that handles connections and echoes events.

```typescript
// apps/server/src/interface/websocket/canvas.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class CanvasGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: any): void {
    this.server.emit('events', data); // Broadcast to all
  }
}
```

**Step 3: Register in Module and Commit**
Register `CanvasGateway` in `AppModule`.
```bash
git add . && git commit -m "feat(gateway): setup websocket gateway with socket.io"
```

---

### Task 6: Basic MCP Module

**Files:**
- Create: `apps/server/src/interface/mcp/mcp.service.ts`
- Create: `apps/server/src/interface/mcp/mcp.module.ts`
- Install: `@modelcontextprotocol/sdk`

**Step 1: Install MCP SDK**
```bash
cd apps/server && pnpm add @modelcontextprotocol/sdk zod
```

**Step 2: Implement MCP Service**
Initialize the MCP server on stdio.

```typescript
// apps/server/src/interface/mcp/mcp.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

@Injectable()
export class McpService implements OnModuleInit {
  private server: Server;

  onModuleInit() {
    this.server = new Server({ name: 'magam-server', version: '1.0.0' }, { capabilities: { tools: {} } });
    
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{ name: 'get_server_status', description: 'Check if server is running', inputSchema: { type: 'object' } }]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'get_server_status') {
        return { content: [{ type: 'text', text: 'Server is running' }] };
      }
      throw new Error('Tool not found');
    });

    const transport = new StdioServerTransport();
    this.server.connect(transport);
  }
}
```

**Step 3: Register and Commit**
Register in `AppModule`.
```bash
git add . && git commit -m "feat(mcp): setup basic mcp server over stdio"
```
