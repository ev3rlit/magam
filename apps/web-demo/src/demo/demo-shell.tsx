'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type {
  DemoDiagnostic,
  DemoExampleNode,
  DemoHomeModel,
  DemoPreviewState,
  DemoSourceTarget,
  DemoUiMode,
  ScratchDocument,
  ScratchWorkspace,
} from '@/src/demo/contracts';
import { findExampleNode } from '@/src/demo/example-repository';
import { DemoPreviewShell } from '@/src/demo/preview/preview-shell';
import { buildDemoPreviewCanvasState } from '@/src/demo/preview/parse-preview-graph';
import type { DemoPreviewCanvasState } from '@/src/demo/preview/types';
import {
  createDemoRenderEngine,
  DemoRenderStaleResultError,
} from '@/src/demo/render/demo-render-engine';
import {
  readScratchDocumentSnapshot,
  writeScratchDocumentSnapshot,
} from '@/src/demo/scratch-session-storage';
import { createDemoScratchWorkspace } from '@/src/demo/scratch-workspace';

const LazyScratchEditor = dynamic(
  () => import('@/src/demo/editor/scratch-editor').then((module) => module.ScratchEditor),
  {
    ssr: false,
    loading: () => <div className="demo-editor-loading">Loading scratch editor...</div>,
  },
);

interface DemoShellProps {
  initialModel: DemoHomeModel;
}

type SidebarPanel = 'explorer' | 'code';

export function DemoShell({ initialModel }: DemoShellProps) {
  const [selectedPath, setSelectedPath] = useState(initialModel.selectedPath);
  const [activeMode, setActiveMode] = useState<DemoUiMode>(initialModel.uiMode);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>('explorer');
  const [scratchDocument, setScratchDocument] = useState<ScratchDocument | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() =>
    getInitialOpenFolders(initialModel.tree, initialModel.selectedPath),
  );
  const [scratchWorkspace] = useState<ScratchWorkspace>(() => createDemoScratchWorkspace());
  const [renderEngine, setRenderEngine] = useState<ReturnType<typeof createDemoRenderEngine> | null>(
    null,
  );
  const [previewState, setPreviewState] = useState<DemoPreviewState>(() => ({
    status: initialModel.previewStatus,
    activeTarget: {
      mode: 'example-view',
      path: initialModel.selectedPath,
      source: initialModel.exampleSourceByPath[initialModel.selectedPath] ?? '',
    },
    lastCompletedTarget: null,
    graph: null,
    sourceVersion: null,
    diagnostics: [],
  }));
  const [lastGoodPreview, setLastGoodPreview] = useState<DemoPreviewCanvasState | null>(null);
  const [previewParseDiagnostics, setPreviewParseDiagnostics] = useState<DemoDiagnostic[]>([]);

  const activeNode = findExampleNode(initialModel.tree, selectedPath);
  const selectedSource = initialModel.exampleSourceByPath[selectedPath] ?? '';
  const availablePaths = useMemo(
    () => new Set(Object.keys(initialModel.exampleSourceByPath)),
    [initialModel.exampleSourceByPath],
  );
  const scratchMatchesSelection = scratchDocument?.sourcePath === selectedPath;
  const sourceTarget = getSourceTarget({
    selectedPath,
    selectedSource,
    activeMode,
    scratchDocument,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const restoredDocument = readScratchDocumentSnapshot(window.sessionStorage, availablePaths);

    if (!restoredDocument) {
      setHasHydratedStorage(true);

      return;
    }

    void restoreScratchDocument({
      workspace: scratchWorkspace,
      document: restoredDocument,
      onRestore: (document) => {
        setScratchDocument(document);
        setSelectedPath(document.sourcePath);
        setActiveMode('scratch-edit');
      },
    }).finally(() => {
      setHasHydratedStorage(true);
    });
  }, [availablePaths, scratchWorkspace]);

  useEffect(() => {
    if (!hasHydratedStorage || typeof window === 'undefined') {
      return;
    }

    writeScratchDocumentSnapshot(window.sessionStorage, scratchDocument);
  }, [hasHydratedStorage, scratchDocument]);

  useEffect(() => {
    if (!copyStatus) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyStatus(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyStatus]);

  useEffect(() => {
    const engine = createDemoRenderEngine({
      exampleSourceByPath: initialModel.exampleSourceByPath,
    });

    setRenderEngine(engine);

    return () => {
      engine.dispose();
    };
  }, [initialModel.exampleSourceByPath]);

  useEffect(() => {
    if (!renderEngine) {
      return;
    }

    const nextTarget = cloneSourceTarget(sourceTarget);
    const debounceDelay = nextTarget.mode === 'scratch-edit' ? 350 : 0;
    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      setPreviewParseDiagnostics([]);
      setPreviewState((currentState) => ({
        ...currentState,
        activeTarget: nextTarget,
        status: 'loading',
      }));

      void renderEngine
        .render({
          filename: nextTarget.path,
          mode: nextTarget.mode,
          source: nextTarget.source,
        })
        .then((response) => {
          if (isCancelled) {
            return;
          }

          if (response.diagnostics.length > 0) {
            console.error('[web-demo] render diagnostics', {
              path: nextTarget.path,
              mode: nextTarget.mode,
              diagnostics: response.diagnostics,
            });
          }

          setPreviewState((currentState) => ({
            ...currentState,
            activeTarget: nextTarget,
            lastCompletedTarget: response.graph ? nextTarget : currentState.lastCompletedTarget,
            graph: response.graph ?? currentState.graph,
            sourceVersion: response.sourceVersion ?? currentState.sourceVersion,
            diagnostics: response.diagnostics,
            status:
              response.graph && response.diagnostics.length === 0
                ? 'ready'
                : response.graph
                  ? 'ready'
                  : 'error',
          }));
        })
        .catch((error) => {
          if (isCancelled || error instanceof DemoRenderStaleResultError) {
            return;
          }

          console.error('[web-demo] render request failed', {
            path: nextTarget.path,
            mode: nextTarget.mode,
            error,
          });

          setPreviewState((currentState) => ({
            ...currentState,
            activeTarget: nextTarget,
            diagnostics: [toUnhandledDiagnostic(error, nextTarget.path)],
            status: 'error',
          }));
        });
    }, debounceDelay);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    renderEngine,
    sourceTarget.mode,
    sourceTarget.path,
    sourceTarget.source,
    'documentId' in sourceTarget ? sourceTarget.documentId : '',
  ]);

  useEffect(() => {
    if (!previewState.graph || !previewState.lastCompletedTarget) {
      return;
    }

    let isCancelled = false;

    void buildDemoPreviewCanvasState({
      graph: previewState.graph,
      sourceVersion: previewState.sourceVersion,
    })
      .then((parsedPreview) => {
        if (isCancelled) {
          return;
        }

        setLastGoodPreview(parsedPreview);
        setPreviewParseDiagnostics([]);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error('[web-demo] preview parse failed', {
          path: previewState.lastCompletedTarget?.path ?? selectedPath,
          error,
        });

        setPreviewParseDiagnostics([
          toUnhandledDiagnostic(error, previewState.lastCompletedTarget?.path ?? selectedPath),
        ]);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    previewState.graph,
    previewState.sourceVersion,
    previewState.lastCompletedTarget?.path,
    previewState.lastCompletedTarget?.mode,
    selectedPath,
  ]);

  function handleExampleSelect(node: DemoExampleNode) {
    if (node.children?.length) {
      return;
    }

    setSelectedPath(node.path);
    setActiveMode('example-view');
    setIsSidebarOpen(false);
  }

  function handleFolderToggle(nodeId: string) {
    setOpenFolders((currentState) => ({
      ...currentState,
      [nodeId]: !currentState[nodeId],
    }));
  }

  async function handleEditInScratch() {
    if (scratchMatchesSelection && scratchDocument) {
      setActiveMode('scratch-edit');
      setSidebarPanel('code');
      setIsSidebarOpen(false);

      return;
    }

    const document = await scratchWorkspace.startFromExample({
      path: selectedPath,
      source: selectedSource,
    });

    setScratchDocument(document);
    setActiveMode('scratch-edit');
    setSidebarPanel('code');
    setIsSidebarOpen(false);
  }

  async function handleResetScratch() {
    if (!scratchMatchesSelection || !scratchDocument) {
      return;
    }

    await scratchWorkspace.reset(scratchDocument.documentId, selectedSource);
    setScratchDocument({
      ...scratchDocument,
      source: selectedSource,
    });
    setActiveMode('scratch-edit');
    setSidebarPanel('code');
  }

  function handleScratchChange(nextSource: string) {
    if (!scratchMatchesSelection || !scratchDocument) {
      return;
    }

    const nextDocument = {
      ...scratchDocument,
      source: nextSource,
    } satisfies ScratchDocument;

    setScratchDocument(nextDocument);
    void scratchWorkspace.update(nextDocument.documentId, nextSource);
  }

  function handleShowExampleSource() {
    setActiveMode('example-view');
    setSidebarPanel('code');
  }

  async function handleCopySource() {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyStatus('Clipboard unavailable in this browser.');

      return;
    }

    try {
      await navigator.clipboard.writeText(sourceTarget.source);
      setCopyStatus(
        sourceTarget.mode === 'scratch-edit' ? 'Scratch source copied.' : 'Example source copied.',
      );
    } catch (error) {
      setCopyStatus(error instanceof Error ? `Copy failed: ${error.message}` : 'Copy failed.');
    }
  }

  const scratchActionLabel = scratchMatchesSelection ? 'Resume Scratch' : 'Edit in Scratch';

  return (
    <main className="demo-page">
      <div className="demo-shell">
        <div
          className="demo-mobile-scrim"
          data-open={isSidebarOpen}
          onClick={() => setIsSidebarOpen(false)}
        />

        <div className="demo-workspace">
          <section className="demo-main">
            <button
              type="button"
              className="demo-drawer-trigger"
              onClick={() => setIsSidebarOpen(true)}
            >
              Panels
            </button>

            <DemoPreviewShell
              previewState={previewState}
              lastGoodPreview={lastGoodPreview}
              parseDiagnostics={previewParseDiagnostics}
            />
          </section>

          <aside
            className="demo-sidebar"
            data-open={isSidebarOpen}
          >
            <div className="demo-sidebar-head">
              <div className="demo-sidebar-title">
                <span className="demo-sidebar-title-icon">{sidebarPanel === 'code' ? '</>' : '[]'}</span>
                <strong>{sidebarPanel === 'code' ? 'Code' : 'Explorer'}</strong>
              </div>

              <div className="demo-sidebar-controls">
                <button
                  type="button"
                  className="demo-sidebar-icon-button"
                  onClick={() => setIsSidebarOpen(false)}
                  title="Close panels"
                >
                  x
                </button>
              </div>
            </div>

            <div className="demo-sidebar-tabs" role="tablist" aria-label="Sidebar panels">
              <button
                type="button"
                className="demo-sidebar-tab"
                data-active={sidebarPanel === 'explorer'}
                onClick={() => setSidebarPanel('explorer')}
                role="tab"
                aria-selected={sidebarPanel === 'explorer'}
              >
                Explorer
              </button>
              <button
                type="button"
                className="demo-sidebar-tab"
                data-active={sidebarPanel === 'code'}
                onClick={() => setSidebarPanel('code')}
                role="tab"
                aria-selected={sidebarPanel === 'code'}
              >
                Code
              </button>
            </div>

            <div className="demo-sidebar-body">
              {sidebarPanel === 'explorer' ? (
                <div className="demo-explorer-panel">
                  <div className="demo-explorer-root">examples</div>
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
              ) : (
                <div className="demo-code-panel">
                  <div className="demo-code-toolbar">
                    <div className="demo-code-toolbar-actions">
                      <button
                        type="button"
                        className="demo-toolbar-button"
                        onClick={handleEditInScratch}
                        disabled={sourceTarget.mode === 'scratch-edit'}
                      >
                        {scratchActionLabel}
                      </button>
                      {sourceTarget.mode === 'scratch-edit' ? (
                        <button
                          type="button"
                          className="demo-toolbar-button"
                          onClick={handleShowExampleSource}
                        >
                          Show Example
                        </button>
                      ) : null}
                      {scratchMatchesSelection ? (
                        <button
                          type="button"
                          className="demo-toolbar-button"
                          onClick={handleResetScratch}
                        >
                          Reset
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="demo-toolbar-button"
                        onClick={handleCopySource}
                      >
                        Copy
                      </button>
                    </div>
                    {copyStatus ? <span className="demo-status-pill">{copyStatus}</span> : null}
                  </div>

                  {activeNode?.description ? (
                    <p className="demo-source-description">{activeNode.description}</p>
                  ) : null}

                  <div
                    className="demo-editor-shell"
                    data-readonly={sourceTarget.mode === 'example-view'}
                  >
                    <div className="demo-editor-meta">
                      <span>
                        {sourceTarget.mode === 'scratch-edit'
                          ? scratchDocument?.documentId ?? 'scratch session'
                          : 'read-only example'}
                      </span>
                    </div>
                    <LazyScratchEditor
                      value={sourceTarget.source}
                      onChange={sourceTarget.mode === 'scratch-edit' ? handleScratchChange : undefined}
                      readOnly={sourceTarget.mode === 'example-view'}
                      autoFocus={sourceTarget.mode === 'scratch-edit'}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function cloneSourceTarget(sourceTarget: DemoSourceTarget): DemoSourceTarget {
  if (sourceTarget.mode === 'scratch-edit') {
    return {
      mode: sourceTarget.mode,
      path: sourceTarget.path,
      documentId: sourceTarget.documentId,
      source: sourceTarget.source,
    };
  }

  return {
    mode: sourceTarget.mode,
    path: sourceTarget.path,
    source: sourceTarget.source,
  };
}

function toUnhandledDiagnostic(error: unknown, fileName: string): DemoDiagnostic {
  return {
    message: error instanceof Error ? error.message : 'Demo render failed.',
    fileName,
  };
}

function getSourceTarget(input: {
  selectedPath: string;
  selectedSource: string;
  activeMode: DemoUiMode;
  scratchDocument: ScratchDocument | null;
}): DemoSourceTarget {
  if (
    input.activeMode === 'scratch-edit' &&
    input.scratchDocument &&
    input.scratchDocument.sourcePath === input.selectedPath
  ) {
    return {
      mode: 'scratch-edit',
      path: input.selectedPath,
      documentId: input.scratchDocument.documentId,
      source: input.scratchDocument.source,
    };
  }

  return {
    mode: 'example-view',
    path: input.selectedPath,
    source: input.selectedSource,
  };
}

async function restoreScratchDocument(input: {
  workspace: ScratchWorkspace;
  document: ScratchDocument;
  onRestore: (document: ScratchDocument) => void;
}): Promise<void> {
  const document = await input.workspace.startFromExample({
    path: input.document.sourcePath,
    source: input.document.source,
  });

  input.onRestore(document);
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
          <span className="demo-tree-chevron">{isOpen ? 'v' : '>'}</span>
          <span className="demo-tree-glyph demo-tree-glyph-folder" />
          <span className="demo-label">
            <strong>{node.title}</strong>
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
      <span className="demo-tree-chevron" />
      <span className="demo-tree-glyph demo-tree-glyph-file" />
      <span className="demo-label">
        <strong>{node.title}</strong>
        <span>{node.path}</span>
      </span>
    </button>
  );
}
