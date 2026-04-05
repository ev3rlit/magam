'use client';

import { useState } from 'react';
import type { DemoExampleNode, DemoHomeModel } from '@/src/demo/contracts';
import { findExampleNode } from '@/src/demo/example-repository';

interface DemoShellProps {
  initialModel: DemoHomeModel;
}

export function DemoShell({ initialModel }: DemoShellProps) {
  const [selectedPath, setSelectedPath] = useState(initialModel.selectedPath);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() =>
    getInitialOpenFolders(initialModel.tree, initialModel.selectedPath),
  );

  const activeNode = findExampleNode(initialModel.tree, selectedPath);
  const selectedSource = initialModel.exampleSourceByPath[selectedPath] ?? '';

  function handleExampleSelect(node: DemoExampleNode) {
    if (node.children?.length) {
      return;
    }

    setSelectedPath(node.path);
  }

  function handleFolderToggle(nodeId: string) {
    setOpenFolders((currentState) => ({
      ...currentState,
      [nodeId]: !currentState[nodeId],
    }));
  }

  return (
    <main className="demo-page">
      <div className="demo-shell">
        <section className="demo-hero">
          <div className="demo-kicker">002 Example Registry Explorer</div>
          <h1>Curated examples, generated at build time.</h1>
          <p>
            `apps/web-demo` now reads a generated example manifest instead of placeholder source.
            The explorer and source panel are backed by curated `examples/` files captured during
            build, without importing the existing `app` shell or calling any local API and
            websocket flow.
          </p>
          <div className="demo-chip-row">
            <div className="demo-chip">
              <strong>Allowed reuse</strong>
              <span>{initialModel.allowedPackages.join(' + ')}</span>
            </div>
            <div className="demo-chip">
              <strong>Preview status</strong>
              <span>{initialModel.previewStatus}</span>
            </div>
            <div className="demo-chip">
              <strong>Mode</strong>
              <span>{initialModel.uiMode}</span>
            </div>
          </div>
        </section>

        <section className="demo-shell-grid">
          <article className="demo-panel">
            <div className="demo-panel-header">
              <h2>Explorer</h2>
              <span>read-only registry tree</span>
            </div>
            <div className="demo-panel-body">
              <div className="demo-stack">
                <div className="demo-badge">No `/api/file-tree`</div>
                <div className="demo-tree-list">
                  {initialModel.tree.map((node) => (
                    <ExplorerNode
                      key={node.id}
                      node={node}
                      activePath={selectedPath}
                      openFolders={openFolders}
                      onFolderToggle={handleFolderToggle}
                      onExampleSelect={handleExampleSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="demo-panel">
            <div className="demo-panel-header">
              <h2>Source</h2>
              <span>{activeNode?.title ?? 'Unknown example'}</span>
            </div>
            <div className="demo-panel-body">
              <div className="demo-source-meta">
                <span>{selectedPath}</span>
                <span>read-only example</span>
                <span>{activeNode?.category ?? 'Uncategorized'}</span>
              </div>
              {activeNode?.description ? (
                <p className="demo-source-description">{activeNode.description}</p>
              ) : null}
              <pre className="demo-code">
                <code>{selectedSource}</code>
              </pre>
            </div>
          </article>

          <article className="demo-panel">
            <div className="demo-panel-header">
              <h2>Preview Target</h2>
              <span>future 004 renderer</span>
            </div>
            <div className="demo-panel-body">
              <div className="demo-stack">
                <div className="demo-preview-card">
                  <strong>{activeNode?.title ?? 'Boundary locked'}</strong>
                  <p>
                    The current render target is identified by the selected example path so `004`
                    can attach the browser renderer without changing how selection state flows
                    through the demo shell.
                  </p>
                </div>

                <section>
                  <h3 className="demo-section-title">Render target</h3>
                  <div className="demo-rule-list">
                    <div className="demo-rule">
                      <strong>{selectedPath}</strong>
                      <span>Selected entry file from the generated example registry.</span>
                    </div>
                    <div className="demo-rule">
                      <strong>{initialModel.previewStatus}</strong>
                      <span>Placeholder preview status until the browser render engine lands.</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="demo-section-title">Blocked capabilities</h3>
                  <div className="demo-rule-list">
                    {initialModel.blockedCapabilities.map((capability) => (
                      <div className="demo-rule" key={capability}>
                        <strong>{capability}</strong>
                        <span>Not available in the demo app boundary.</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="demo-section-title">Next tracks</h3>
                  <ul className="demo-list">
                    {initialModel.followupTracks.map((track) => (
                      <li key={track}>{track}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function getInitialOpenFolders(
  nodes: DemoExampleNode[],
  activePath: string,
): Record<string, boolean> {
  const openFolders: Record<string, boolean> = {
    'examples-root': true,
  };

  markAncestorFolders(nodes, activePath, openFolders);

  return openFolders;
}

function markAncestorFolders(
  nodes: DemoExampleNode[],
  activePath: string,
  openFolders: Record<string, boolean>,
): boolean {
  for (const node of nodes) {
    if (node.path === activePath) {
      return true;
    }

    if (!node.children?.length) {
      continue;
    }

    if (markAncestorFolders(node.children, activePath, openFolders)) {
      openFolders[node.id] = true;

      return true;
    }
  }

  return false;
}

interface ExplorerNodeProps {
  node: DemoExampleNode;
  activePath: string;
  openFolders: Record<string, boolean>;
  onFolderToggle: (nodeId: string) => void;
  onExampleSelect: (node: DemoExampleNode) => void;
}

function ExplorerNode({
  node,
  activePath,
  openFolders,
  onFolderToggle,
  onExampleSelect,
}: ExplorerNodeProps) {
  const hasChildren = Boolean(node.children?.length);
  const isOpen = hasChildren ? openFolders[node.id] ?? false : false;

  if (hasChildren) {
    return (
      <div className="demo-tree-node">
        <button
          type="button"
          className="demo-tree-toggle"
          onClick={() => onFolderToggle(node.id)}
          aria-expanded={isOpen}
        >
          <span className="demo-tree-icon">{isOpen ? '-' : '+'}</span>
          <span className="demo-label">
            <strong>{node.title}</strong>
            <span>{node.path}</span>
          </span>
        </button>

        {isOpen ? (
          <div className="demo-tree-children">
            {node.children?.map((childNode) => (
              <ExplorerNode
                key={childNode.id}
                node={childNode}
                activePath={activePath}
                openFolders={openFolders}
                onFolderToggle={onFolderToggle}
                onExampleSelect={onExampleSelect}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="demo-tree-leaf"
      data-active={node.path === activePath}
      onClick={() => onExampleSelect(node)}
    >
      <span className="demo-tree-icon">TS</span>
      <span className="demo-label">
        <strong>{node.title}</strong>
        <span>{node.path}</span>
      </span>
    </button>
  );
}
