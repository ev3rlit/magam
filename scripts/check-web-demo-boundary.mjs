import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demoRoot = path.join(workspaceRoot, 'apps', 'web-demo');
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

const forbiddenChecks = [
  {
    label: 'existing WorkspaceClient import',
    test: (source) =>
      /from\s+['"][^'"]*WorkspaceClient['"]/.test(source) ||
      /\bWorkspaceClient\s*\(/.test(source) ||
      /<WorkspaceClient\b/.test(source),
  },
  {
    label: 'existing useFileSync dependency',
    test: (source) =>
      /from\s+['"][^'"]*useFileSync['"]/.test(source) ||
      /\buseFileSync\s*\(/.test(source),
  },
  {
    label: 'local render API call',
    test: (source) => /\b(fetch|axios(?:\.(?:get|post))?)\s*\(\s*['"]\/api\/render/.test(source),
  },
  {
    label: 'local files API call',
    test: (source) => /\b(fetch|axios(?:\.(?:get|post))?)\s*\(\s*['"]\/api\/files/.test(source),
  },
  {
    label: 'local file-tree API call',
    test: (source) => /\b(fetch|axios(?:\.(?:get|post))?)\s*\(\s*['"]\/api\/file-tree/.test(source),
  },
  {
    label: 'localhost websocket usage',
    test: (source) =>
      /new\s+WebSocket\s*\(\s*['"]ws:\/\/localhost/.test(source) ||
      /\bio\s*\(\s*['"]ws:\/\/localhost/.test(source),
  },
  {
    label: 'workspace websocket env usage',
    test: (source) => source.includes('NEXT_PUBLIC_MAGAM_WS_PORT'),
  },
  {
    label: 'socket.io client usage',
    test: (source) => source.includes('socket.io-client'),
  },
  {
    label: 'node websocket package usage',
    test: (source) => source.includes("from 'ws'") || source.includes('from "ws"'),
  },
  {
    label: 'runtime package usage',
    test: (source) => source.includes('@magam/runtime'),
  },
  {
    label: 'cli package usage',
    test: (source) => source.includes('@magam/cli'),
  },
  {
    label: 'cross-app import',
    test: (source) => /from\s+['"].*(?:\.\.\/)+app\//.test(source) || /from\s+['"]app\//.test(source),
  },
];

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.next' || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const files = await collectSourceFiles(demoRoot);
  const violations = [];

  for (const filePath of files) {
    const source = await readFile(filePath, 'utf8');

    for (const check of forbiddenChecks) {
      if (check.test(source)) {
        violations.push({
          filePath,
          label: check.label,
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error('web-demo boundary check failed:');

    for (const violation of violations) {
      console.error(`- ${path.relative(workspaceRoot, violation.filePath)}: ${violation.label}`);
    }

    process.exit(1);
  }

  console.log('web-demo boundary check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
