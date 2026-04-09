'use client';

import dynamic from 'next/dynamic';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  clampFloatingSidebarWidth,
  DEMO_FLOATING_SIDEBAR_DEFAULT_WIDTH,
  DEMO_MOBILE_SIDEBAR_MEDIA_QUERY,
  shouldAutoCloseFloatingSidebar,
} from '@/src/demo/sidebar-behavior';
import { createDemoScratchWorkspace, createScratchDocumentId } from '@/src/demo/scratch-workspace';

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

const DEMO_SIDEBAR_ID = 'demo-floating-panels';

export function DemoShell({ initialModel }: DemoShellProps) {
  const [selectedPath, setSelectedPath] = useState(initialModel.selectedPath);
  const [activeMode, setActiveMode] = useState<DemoUiMode>(initialModel.uiMode);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>('explorer');
  const [scratchDocument, setScratchDocument] = useState<ScratchDocument | null>(null);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEMO_FLOATING_SIDEBAR_DEFAULT_WIDTH);
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
  const sidebarResizeCleanupRef = useRef<(() => void) | null>(null);

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
  const sidebarStyle = useMemo(
    () =>
      ({
        '--demo-sidebar-width': `${sidebarWidth}px`,
      }) as CSSProperties,
    [sidebarWidth],
  );

  function isMobileSidebarViewport(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(DEMO_MOBILE_SIDEBAR_MEDIA_QUERY).matches;
  }

  function closeSidebarIfNeeded() {
    if (typeof window === 'undefined') {
      return;
    }

    if (shouldAutoCloseFloatingSidebar(window.innerWidth)) {
      setIsSidebarOpen(false);
    }
  }

  function handleSidebarResizeStart(event: React.PointerEvent<HTMLDivElement>) {
    if (typeof window === 'undefined' || isMobileSidebarViewport()) {
      return;
    }

    event.preventDefault();

    sidebarResizeCleanupRef.current?.();

    const startX = event.clientX;
    const startWidth = sidebarWidth;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    setIsSidebarResizing(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const finishResize = () => {
      setIsSidebarResizing(false);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishResize);
      sidebarResizeCleanupRef.current = null;
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setSidebarWidth(
        clampFloatingSidebarWidth(startWidth + moveEvent.clientX - startX, window.innerWidth),
      );
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishResize);
    sidebarResizeCleanupRef.current = finishResize;
  }

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
    if (!hasHydratedStorage) {
      return;
    }

    if (scratchDocument?.sourcePath === selectedPath) {
      if (activeMode !== 'scratch-edit') {
        setActiveMode('scratch-edit');
      }

      return;
    }

    let isCancelled = false;

    void ensureScratchDocument({
      workspace: scratchWorkspace,
      path: selectedPath,
      source: selectedSource,
      onReady: (document) => {
        if (isCancelled) {
          return;
        }

        setScratchDocument(document);
        setActiveMode('scratch-edit');
      },
    });

    return () => {
      isCancelled = true;
    };
  }, [
    activeMode,
    hasHydratedStorage,
    scratchDocument?.sourcePath,
    scratchWorkspace,
    selectedPath,
    selectedSource,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSidebarWidth = () => {
      setSidebarWidth((currentWidth) => clampFloatingSidebarWidth(currentWidth, window.innerWidth));
    };

    syncSidebarWidth();
    window.addEventListener('resize', syncSidebarWidth);

    return () => {
      window.removeEventListener('resize', syncSidebarWidth);
    };
  }, []);

  useEffect(() => {
    if (!isSidebarOpen || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    return () => {
      sidebarResizeCleanupRef.current?.();
    };
  }, []);

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
    closeSidebarIfNeeded();
  }

  function handleFolderToggle(nodeId: string) {
    setOpenFolders((currentState) => ({
      ...currentState,
      [nodeId]: !currentState[nodeId],
    }));
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
    const nextDocument = {
      documentId:
        scratchMatchesSelection && scratchDocument
          ? scratchDocument.documentId
          : createScratchDocumentId(selectedPath),
      sourcePath: selectedPath,
      source: nextSource,
    } satisfies ScratchDocument;

    setScratchDocument(nextDocument);
    setActiveMode('scratch-edit');
    void persistScratchDocument({
      workspace: scratchWorkspace,
      document: nextDocument,
      fallbackSource: selectedSource,
    });
  }

  return (
    <main className="demo-page">
      <div className="demo-shell">
        <div
          className="demo-mobile-scrim"
          data-open={isSidebarOpen}
          onClick={() => {
            if (isMobileSidebarViewport()) {
              setIsSidebarOpen(false);
            }
          }}
        />

        <div className="demo-workspace">
          <section className="demo-main">
            <button
              type="button"
              className="demo-drawer-trigger"
              data-open={isSidebarOpen}
              aria-expanded={isSidebarOpen}
              aria-controls={DEMO_SIDEBAR_ID}
              aria-label={isSidebarOpen ? 'Hide panels' : 'Show panels'}
              title={isSidebarOpen ? 'Hide panels' : 'Show panels'}
              onClick={() => setIsSidebarOpen((currentState) => !currentState)}
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
            id={DEMO_SIDEBAR_ID}
            className="demo-sidebar"
            data-open={isSidebarOpen}
            data-resizing={isSidebarResizing}
            aria-hidden={!isSidebarOpen}
            style={sidebarStyle}
          >
            <div
              className="demo-sidebar-resize-handle"
              aria-hidden="true"
              onPointerDown={handleSidebarResizeStart}
            />
            <div className="demo-sidebar-head">
              <div className="demo-sidebar-title">
                <span className="demo-sidebar-title-icon">{sidebarPanel === 'code' ? '</>' : '[]'}</span>
                <strong>{sidebarPanel === 'code' ? 'Code' : 'Explorer'}</strong>
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
                        onClick={handleResetScratch}
                        disabled={!scratchMatchesSelection}
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {activeNode?.description ? (
                    <p className="demo-source-description">{activeNode.description}</p>
                  ) : null}

                  <div
                    className="demo-editor-shell"
                    data-readonly={false}
                  >
                    <div className="demo-editor-meta">
                      <span>
                        {scratchMatchesSelection && scratchDocument
                          ? scratchDocument.documentId
                          : createScratchDocumentId(selectedPath)}
                      </span>
                    </div>
                    <LazyScratchEditor
                      value={scratchMatchesSelection ? scratchDocument.source : selectedSource}
                      onChange={handleScratchChange}
                      readOnly={false}
                      autoFocus
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

async function ensureScratchDocument(input: {
  workspace: ScratchWorkspace;
  path: string;
  source: string;
  onReady: (document: ScratchDocument) => void;
}): Promise<void> {
  const document = await input.workspace.startFromExample({
    path: input.path,
    source: input.source,
  });

  input.onReady(document);
}

async function persistScratchDocument(input: {
  workspace: ScratchWorkspace;
  document: ScratchDocument;
  fallbackSource: string;
}): Promise<void> {
  const existingDocument = await input.workspace.get(input.document.documentId);

  if (!existingDocument) {
    await input.workspace.startFromExample({
      path: input.document.sourcePath,
      source: input.fallbackSource,
    });
  }

  await input.workspace.update(input.document.documentId, input.document.source);
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
