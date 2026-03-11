import { describe, expect, it } from 'bun:test';
import { ESLint } from 'eslint';
import { join } from 'node:path';

const projectRoot = process.cwd();
const configPath = join(projectRoot, 'eslint.config.mjs');

async function lintText(code: string) {
  const eslint = new ESLint({
    cwd: projectRoot,
    overrideConfigFile: configPath,
  });

  const [result] = await eslint.lintText(code, {
    filePath: join(projectRoot, 'tmp', 'mindmap-duplicate-id.test.tsx'),
  });

  return result.messages.filter((message) => message.ruleId === 'magam/no-duplicate-ids');
}

describe('magam/no-duplicate-ids', () => {
  it('reports duplicate node ids within the same mindmap', async () => {
    const messages = await lintText(`
      import { Canvas, MindMap, Node } from '@magam/core';

      export default function Diagram() {
        return (
          <Canvas>
            <MindMap id="map">
              <Node id="root">Root</Node>
              <Node id="root" from="root">Duplicate</Node>
            </MindMap>
          </Canvas>
        );
      }
    `);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('map.root');
  });

  it('keeps separate MindMapEmbed namespaces isolated', async () => {
    const messages = await lintText(`
      import { Canvas, MindMap, MindMapEmbed, Node } from '@magam/core';

      export default function Diagram() {
        return (
          <Canvas>
            <MindMap id="system">
              <Node id="platform">Platform</Node>
              <MindMapEmbed id="auth" from="platform">
                <Node id="root">Auth</Node>
              </MindMapEmbed>
              <MindMapEmbed id="billing" from="platform">
                <Node id="root">Billing</Node>
              </MindMapEmbed>
            </MindMap>
          </Canvas>
        );
      }
    `);

    expect(messages).toHaveLength(0);
  });

  it('reports collisions between local and fully qualified ids inside the same MindMapEmbed scope', async () => {
    const messages = await lintText(`
      import { Canvas, MindMap, MindMapEmbed, Node } from '@magam/core';

      export default function Diagram() {
        return (
          <Canvas>
            <MindMap id="system">
              <Node id="platform">Platform</Node>
              <MindMapEmbed id="auth" from="platform">
                <Node id="root">Auth</Node>
                <Node id="auth.root" from="platform">Duplicate</Node>
              </MindMapEmbed>
            </MindMap>
          </Canvas>
        );
      }
    `);

    expect(messages).toHaveLength(1);
    expect(messages[0]?.message).toContain('system.auth.root');
  });

  it('does not flag Text ids used as nested node content', async () => {
    const messages = await lintText(`
      import { Canvas, MindMap, Node, Text } from '@magam/core';

      export default function Diagram() {
        return (
          <Canvas>
            <MindMap id="map">
              <Node id="root">
                <Text id="title">Root</Text>
              </Node>
              <Node id="child" from="root">
                <Text id="title">Child</Text>
              </Node>
            </MindMap>
          </Canvas>
        );
      }
    `);

    expect(messages).toHaveLength(0);
  });
});
