function getJsxName(node) {
  if (!node) return null;
  if (node.type === 'JSXIdentifier') return node.name;
  if (node.type === 'JSXMemberExpression') return null;
  if (node.type === 'JSXNamespacedName') return null;
  return null;
}

function getStaticStringAttribute(openingElement, attributeName) {
  for (const attribute of openingElement.attributes) {
    if (attribute.type !== 'JSXAttribute') continue;
    if (getJsxName(attribute.name) !== attributeName) continue;
    if (!attribute.value) return null;

    if (attribute.value.type === 'Literal' && typeof attribute.value.value === 'string') {
      return attribute.value.value;
    }

    if (
      attribute.value.type === 'JSXExpressionContainer'
      && attribute.value.expression.type === 'Literal'
      && typeof attribute.value.expression.value === 'string'
    ) {
      return attribute.value.expression.value;
    }
  }

  return null;
}

function getAttributeNode(openingElement, attributeName) {
  for (const attribute of openingElement.attributes) {
    if (attribute.type !== 'JSXAttribute') continue;
    if (getJsxName(attribute.name) === attributeName) {
      return attribute;
    }
  }

  return null;
}

function qualifyCanvasId(rawId, canvasScope) {
  if (!rawId) return rawId;
  if (!canvasScope || rawId.includes('.')) return rawId;
  return `${canvasScope}.${rawId}`;
}

function isMindMapLocalId(id, localScope) {
  if (!localScope) return false;
  return id === localScope || id.startsWith(`${localScope}.`);
}

function qualifyMindMapId(rawId, mindMapId, localScope) {
  if (!rawId || !mindMapId) return rawId;

  const scopedLocalId = rawId.includes('.')
    ? rawId
    : (localScope ? `${localScope}.${rawId}` : rawId);

  if (scopedLocalId.includes('.') && !isMindMapLocalId(scopedLocalId, localScope)) {
    return scopedLocalId;
  }

  return `${mindMapId}.${scopedLocalId}`;
}

const MAGAM_IMPORT_SOURCES = new Set(['@magam/core', 'magam']);
const GRAPH_ID_COMPONENTS = new Set([
  'MindMap',
  'Node',
  'Shape',
  'Sticky',
  'Sticker',
  'WashiTape',
  'Text',
  'Image',
  'Group',
  'Sequence',
]);
const CONTENT_PARENT_COMPONENTS = new Set([
  'Node',
  'Shape',
  'Sticky',
  'Sticker',
  'WashiTape',
  'Text',
  'Image',
  'Sequence',
  'Code',
  'Table',
  'Markdown',
]);

function createDuplicateIdRule() {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: 'Detect duplicate Magam graph IDs after EmbedScope and MindMap scoping are applied.',
      },
      schema: [],
      messages: {
        duplicateId:
          'Duplicate Magam id "{{finalId}}". This resolves to the same graph id as the earlier {{component}} declaration on line {{line}}.',
      },
    },
    create(context) {
      const magamImports = new Map();
      const seenIds = new Map();
      const elementStack = [];
      let anonymousMindMapIndex = 0;

      function getParentState() {
        return elementStack.length > 0
          ? elementStack[elementStack.length - 1]
          : {
              componentKind: null,
              canvasScope: undefined,
              mindMapId: undefined,
              mindMapEmbedScope: undefined,
            };
      }

      function resolveComponentKind(node) {
        const localName = getJsxName(node.openingElement.name);
        if (!localName) return null;
        return magamImports.get(localName) || null;
      }

      function shouldRegisterId(componentKind, parentKind) {
        if (!componentKind || !GRAPH_ID_COMPONENTS.has(componentKind)) return false;
        if (!parentKind) return true;
        return !CONTENT_PARENT_COMPONENTS.has(parentKind);
      }

      function registerId(finalId, componentKind, attributeNode) {
        if (!finalId || !attributeNode) return;

        const existing = seenIds.get(finalId);
        if (existing) {
          context.report({
            node: attributeNode,
            messageId: 'duplicateId',
            data: {
              finalId,
              component: existing.componentKind,
              line: String(existing.line),
            },
          });
          return;
        }

        seenIds.set(finalId, {
          componentKind,
          line: attributeNode.loc?.start.line ?? 1,
        });
      }

      return {
        ImportDeclaration(node) {
          if (!MAGAM_IMPORT_SOURCES.has(node.source.value)) {
            return;
          }

          for (const specifier of node.specifiers) {
            if (specifier.type !== 'ImportSpecifier') continue;
            const importedName = specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : null;
            const localName = specifier.local.name;
            if (!importedName) continue;
            magamImports.set(localName, importedName);
          }
        },

        JSXElement(node) {
          const parentState = getParentState();
          const componentKind = resolveComponentKind(node);
          const rawId = getStaticStringAttribute(node.openingElement, 'id');
          const idAttribute = getAttributeNode(node.openingElement, 'id');

          const nextState = {
            componentKind,
            canvasScope: parentState.canvasScope,
            mindMapId: parentState.mindMapId,
            mindMapEmbedScope: parentState.mindMapEmbedScope,
          };

          if (componentKind === 'EmbedScope' && !parentState.mindMapId) {
            const scopeId = rawId;
            if (scopeId) {
              nextState.canvasScope = parentState.canvasScope
                ? `${parentState.canvasScope}.${scopeId}`
                : scopeId;
            }
          }

          if (componentKind === 'MindMap') {
            nextState.mindMapId = rawId
              ? qualifyCanvasId(rawId, parentState.canvasScope)
              : `mindmap-${anonymousMindMapIndex++}`;
            nextState.mindMapEmbedScope = undefined;
          } else if (componentKind === 'MindMapEmbed' && parentState.mindMapId) {
            const scopeId = rawId;
            if (scopeId) {
              nextState.mindMapEmbedScope = parentState.mindMapEmbedScope
                ? `${parentState.mindMapEmbedScope}.${scopeId}`
                : scopeId;
            }
          }

          if (shouldRegisterId(componentKind, parentState.componentKind) && rawId && idAttribute) {
            const finalId = componentKind === 'MindMap'
              ? nextState.mindMapId
              : (
                parentState.mindMapId
                  ? qualifyMindMapId(rawId, parentState.mindMapId, parentState.mindMapEmbedScope)
                  : qualifyCanvasId(rawId, parentState.canvasScope)
              );

            registerId(finalId, componentKind, idAttribute);
          }

          elementStack.push(nextState);
        },

        'JSXElement:exit'() {
          elementStack.pop();
        },
      };
    },
  };
}

const magamPlugin = {
  meta: {
    name: 'magam',
  },
  rules: {
    'no-duplicate-ids': createDuplicateIdRule(),
  },
};

export default magamPlugin;
