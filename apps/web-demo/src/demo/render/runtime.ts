import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import * as MagamCore from '@magam/core';
import { renderToGraph } from '@magam/core';
import ts from 'typescript';
import type { DemoRenderRequest, DemoRenderResponse } from '@/src/demo/contracts';
import { isRelativeDemoImport, resolveDemoImportDependency } from '@/src/demo/import-resolver';
import {
  createDemoDiagnostic,
  DemoDiagnosticsError,
  normalizeTypeScriptDiagnostics,
  normalizeUnknownRenderError,
} from '@/src/demo/render/diagnostics';
import { createDemoSourceVersion } from '@/src/demo/render/source-version';

interface RenderDemoSourceGraphInput {
  request: DemoRenderRequest;
  exampleSourceByPath: Record<string, string>;
}

interface DemoModuleRecord {
  exports: Record<string, unknown>;
}

export async function renderDemoSourceGraph(
  input: RenderDemoSourceGraphInput,
): Promise<DemoRenderResponse> {
  try {
    const runtime = createDemoRuntime(input);
    const entryExports = runtime.loadModule(input.request.filename, input.request.source);
    const rootElement = resolveDemoRootElement(entryExports, input.request.filename);
    const renderResult = await renderToGraph(rootElement);

    return renderResult.match(
      (graph) => ({
        graph,
        sourceVersion: createDemoSourceVersion(runtime.moduleSources),
        diagnostics: [],
      }),
      (error) => ({
        graph: null,
        sourceVersion: null,
        diagnostics: normalizeUnknownRenderError(
          getOriginalError(error) ?? error,
          input.request.filename,
        ),
      }),
    );
  } catch (error) {
    return {
      graph: null,
      sourceVersion: null,
      diagnostics: normalizeUnknownRenderError(error, input.request.filename),
    };
  }
}

function createDemoRuntime(input: RenderDemoSourceGraphInput): {
  moduleSources: ReadonlyMap<string, string>;
  loadModule: (modulePath: string, sourceOverride?: string) => Record<string, unknown>;
} {
  const moduleCache = new Map<string, DemoModuleRecord>();
  const moduleSources = new Map<string, string>();

  const resolverOptions = {
    exampleSourceByPath: input.exampleSourceByPath,
    entryPath: input.request.filename,
    entrySource: input.request.source,
  };

  function loadModule(modulePath: string, sourceOverride?: string): Record<string, unknown> {
    const cachedModule = moduleCache.get(modulePath);

    if (cachedModule) {
      return cachedModule.exports;
    }

    const source = sourceOverride ?? readModuleSource(modulePath);
    const moduleRecord: DemoModuleRecord = {
      exports: {},
    };

    moduleCache.set(modulePath, moduleRecord);
    moduleSources.set(modulePath, source);

    try {
      const transpiledSource = transpileDemoModule(source, modulePath);
      const evaluateModule = new Function(
        'require',
        'module',
        'exports',
        '__filename',
        '__dirname',
        `${transpiledSource}\n//# sourceURL=${modulePath}`,
      ) as (
        require: (specifier: string) => unknown,
        module: DemoModuleRecord,
        exports: Record<string, unknown>,
        __filename: string,
        __dirname: string,
      ) => void;

      evaluateModule(
        (specifier) => loadRequiredModule(specifier, modulePath),
        moduleRecord,
        moduleRecord.exports,
        modulePath,
        getDemoDirectory(modulePath),
      );

      return moduleRecord.exports;
    } catch (error) {
      moduleCache.delete(modulePath);
      throw error;
    }
  }

  function loadRequiredModule(specifier: string, importerPath: string): unknown {
    if (specifier === '@magam/core') {
      return MagamCore;
    }

    if (specifier === 'react') {
      return React;
    }

    if (specifier === 'react/jsx-runtime') {
      return jsxRuntime;
    }

    if (specifier === 'react/jsx-dev-runtime') {
      return jsxDevRuntime;
    }

    if (!isRelativeDemoImport(specifier)) {
      throw new DemoDiagnosticsError([
        createDemoDiagnostic(
          `Unsupported import specifier "${specifier}". Only relative imports and @magam/core are supported in the demo renderer.`,
          {
            fileName: importerPath,
          },
        ),
      ]);
    }

    const dependency = resolveDemoImportDependency({
      ...resolverOptions,
      importerPath,
      specifier,
    });

    if (!dependency) {
      throw new DemoDiagnosticsError([
        createDemoDiagnostic(`Unable to resolve "${specifier}" from "${importerPath}".`, {
          fileName: importerPath,
        }),
      ]);
    }

    return loadModule(dependency.path, dependency.source);
  }

  function readModuleSource(modulePath: string): string {
    if (modulePath === input.request.filename) {
      return input.request.source;
    }

    const source = input.exampleSourceByPath[modulePath];

    if (source) {
      return source;
    }

    throw new DemoDiagnosticsError([
      createDemoDiagnostic(`Unknown demo module "${modulePath}".`, {
        fileName: modulePath,
      }),
    ]);
  }

  return {
    moduleSources,
    loadModule,
  };
}

function transpileDemoModule(source: string, fileName: string): string {
  if (/\bimport\s*\(/.test(source)) {
    throw new DemoDiagnosticsError([
      createDemoDiagnostic('Dynamic import is not supported in the demo renderer.', {
        fileName,
      }),
    ]);
  }

  const transpileResult = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      importHelpers: false,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      sourceMap: false,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const diagnostics = normalizeTypeScriptDiagnostics(transpileResult.diagnostics ?? []);

  if (diagnostics.length > 0) {
    throw new DemoDiagnosticsError(diagnostics);
  }

  return transpileResult.outputText;
}

function resolveDemoRootElement(
  exports: Record<string, unknown>,
  fileName: string,
): React.ReactNode {
  const defaultExport = 'default' in exports ? exports.default : exports;
  const rootElement = typeof defaultExport === 'function' ? defaultExport() : defaultExport;

  if (rootElement === null || rootElement === undefined) {
    throw new DemoDiagnosticsError([
      createDemoDiagnostic(
        'Default export must return a React element or directly export one.',
        {
          fileName,
        },
      ),
    ]);
  }

  if (typeof rootElement === 'object' && 'then' in rootElement) {
    throw new DemoDiagnosticsError([
      createDemoDiagnostic('Async default exports are not supported in the demo renderer.', {
        fileName,
      }),
    ]);
  }

  return rootElement;
}

function getDemoDirectory(modulePath: string): string {
  const segments = modulePath.split('/');

  return segments.slice(0, -1).join('/');
}

function getOriginalError(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('originalError' in error)) {
    return null;
  }

  return (error as { originalError?: unknown }).originalError ?? null;
}
