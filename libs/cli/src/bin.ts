#!/usr/bin/env node
import { initProject } from './commands/init';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init') {
    await initProject(process.cwd());
  } else {
    console.log('Usage: graphwrite init');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
