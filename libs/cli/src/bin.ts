#!/usr/bin/env node
import { initProject } from './commands/init';
import { startDevServer } from './commands/dev';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init') {
    await initProject(process.cwd());
  } else if (command === 'dev') {
    await startDevServer(process.cwd());
  } else {
    console.log('Usage: graphwrite <command>');
    console.log('Commands:');
    console.log('  init  Initialize a new project');
    console.log('  dev   Start development server');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
