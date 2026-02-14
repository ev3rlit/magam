#!/usr/bin/env node

import { createCoreInterceptor } from '@graphwrite/shared';

// Set up module resolution for monorepo/local dev environment
// From dist/libs/cli/src/bin.js -> dist/libs/core
createCoreInterceptor(__dirname, '../../core');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init') {
    const { initProject } = await import('./commands/init');
    await initProject(process.cwd());
  } else if (command === 'dev') {
    const { startDevServer } = await import('./commands/dev');
    await startDevServer(process.cwd());
  } else if (command === 'render') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Usage: graphwrite render <file>');
      process.exit(1);
    }
    const { renderCommand } = await import('./commands/render');
    await renderCommand(filePath);
  } else if (command === 'validate') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Usage: graphwrite validate <file>');
      process.exit(1);
    }
    const { validateCommand } = await import('./commands/validate');
    await validateCommand(filePath);
  } else if (command === 'mcp') {
    const targetDir = args[1] || process.cwd();
    const { startMcpServer } = await import('./server/mcp');
    await startMcpServer(targetDir);
  } else if (command === 'serve') {
    // Start HTTP render server only (used by root cli.ts)
    const targetDir = args[1] || process.cwd();
    const { startHttpServer } = await import('./server/http');
    const server = await startHttpServer({ targetDir });
    console.log(`HTTP render server started on port ${server.port}`);
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\nShutting down HTTP server...');
      await server.close();
      process.exit(0);
    });
  } else {
    console.log('Usage: graphwrite <command>');
    console.log('Commands:');
    console.log('  init             Initialize a new project');
    console.log('  dev              Start development server');
    console.log('  render <file>    Render TSX file to Graph AST JSON');
    console.log('  validate <file>  Validate TSX file syntax and execution');
    console.log('  serve [dir]      Start HTTP render server only');
    console.log('  mcp [dir]        Start MCP server (stdio transport)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
