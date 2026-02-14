#!/usr/bin/env node

import { createCoreInterceptor } from '@graphwrite/shared';

// Set up module resolution for monorepo/local dev environment
// From dist/libs/cli/src/bin.js -> dist/libs/core
createCoreInterceptor(__dirname, '../../core');

interface Command {
  usage: string;
  description: string;
  run: (args: string[]) => Promise<void>;
}

function requireArg(args: string[], _name: string, usage: string): string {
  const value = args[0];
  if (!value) {
    console.error(`Usage: graphwrite ${usage}`);
    process.exit(1);
  }
  return value;
}

const commands: Record<string, Command> = {
  init: {
    usage: 'init',
    description: 'Initialize a new project',
    run: async () => {
      const { initProject } = await import('./commands/init');
      await initProject(process.cwd());
    },
  },
  dev: {
    usage: 'dev',
    description: 'Start development server',
    run: async () => {
      const { startDevServer } = await import('./commands/dev');
      await startDevServer(process.cwd());
    },
  },
  new: {
    usage: 'new <filename>',
    description: 'Create a new diagram file',
    run: async (args) => {
      const fileName = requireArg(args, 'filename', 'new <filename>');
      const { newCommand } = await import('./commands/new');
      await newCommand(fileName);
    },
  },
  render: {
    usage: 'render <file>',
    description: 'Render TSX file to Graph AST JSON',
    run: async (args) => {
      const filePath = requireArg(args, 'file', 'render <file>');
      const { renderCommand } = await import('./commands/render');
      await renderCommand(filePath);
    },
  },
  validate: {
    usage: 'validate <file>',
    description: 'Validate TSX file syntax and execution',
    run: async (args) => {
      const filePath = requireArg(args, 'file', 'validate <file>');
      const { validateCommand } = await import('./commands/validate');
      await validateCommand(filePath);
    },
  },
  serve: {
    usage: 'serve [dir]',
    description: 'Start HTTP render server only',
    run: async (args) => {
      const targetDir = args[0] || process.cwd();
      const { startHttpServer } = await import('./server/http');
      const server = await startHttpServer({ targetDir });
      console.log(`HTTP render server started on port ${server.port}`);
      process.on('SIGINT', async () => {
        console.log('\nShutting down HTTP server...');
        await server.close();
        process.exit(0);
      });
    },
  },
  mcp: {
    usage: 'mcp [dir]',
    description: 'Start MCP server (stdio transport)',
    run: async (args) => {
      const targetDir = args[0] || process.cwd();
      const { startMcpServer } = await import('./server/mcp');
      await startMcpServer(targetDir);
    },
  },

  image: {
    usage: 'image insert --file <file> --source <path|url> --mode <node|markdown|canvas|shape> [--target <id>]',
    description: 'Insert an image into GraphWrite source by mode',
    run: async (args) => {
      const sub = args[0];
      if (sub !== 'insert') {
        console.error('Usage: graphwrite image insert ...');
        process.exit(1);
      }

      const { insertImageCommand } = await import('./commands/image');
      await insertImageCommand(args.slice(1));
    },
  },
};

commands['help'] = {
  usage: 'help',
  description: 'Show this help message',
  run: async () => printHelp(),
};

function printHelp() {
  console.log('Usage: graphwrite <command>\n');
  console.log('Commands:');
  const maxUsageLen = Math.max(...Object.values(commands).map((c) => c.usage.length));
  for (const cmd of Object.values(commands)) {
    console.log(`  ${cmd.usage.padEnd(maxUsageLen + 2)} ${cmd.description}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const cmd = command ? commands[command] : undefined;
  if (!cmd) {
    printHelp();
    if (command) {
      console.error(`\nUnknown command: ${command}`);
      process.exit(1);
    }
    return;
  }

  await cmd.run(args.slice(1));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
