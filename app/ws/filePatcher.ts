/**
 * AST-based file patcher for updating node properties
 */

import { readFile, writeFile } from 'fs/promises';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export interface NodeProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    [key: string]: unknown;
}

/**
 * Update node properties in a TSX file using AST manipulation
 */
export async function patchFile(
    filePath: string,
    nodeId: string,
    props: NodeProps
): Promise<void> {
    const code = await readFile(filePath, 'utf-8');

    const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
    });

    let found = false;

    traverse(ast, {
        JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
            // Find the id attribute
            const idAttr = path.node.attributes.find(
                (attr: t.JSXAttribute | t.JSXSpreadAttribute): attr is t.JSXAttribute =>
                    t.isJSXAttribute(attr) &&
                    t.isJSXIdentifier(attr.name) &&
                    attr.name.name === 'id'
            );

            if (!idAttr) return;

            // Check if id matches
            const idValue = idAttr.value;
            let idMatch = false;

            if (t.isStringLiteral(idValue)) {
                idMatch = idValue.value === nodeId;
            } else if (
                t.isJSXExpressionContainer(idValue) &&
                t.isStringLiteral(idValue.expression)
            ) {
                idMatch = idValue.expression.value === nodeId;
            }

            if (!idMatch) return;

            found = true;

            // Update or add props
            Object.entries(props).forEach(([propName, propValue]) => {
                if (propValue === undefined) return;

                // Find existing attribute
                const existingAttrIndex = path.node.attributes.findIndex(
                    (attr: t.JSXAttribute | t.JSXSpreadAttribute): attr is t.JSXAttribute =>
                        t.isJSXAttribute(attr) &&
                        t.isJSXIdentifier(attr.name) &&
                        attr.name.name === propName
                );

                const newValue = t.jsxExpressionContainer(
                    typeof propValue === 'number'
                        ? t.numericLiteral(propValue)
                        : t.stringLiteral(String(propValue))
                );

                if (existingAttrIndex >= 0) {
                    // Update existing attribute
                    const existingAttr = path.node.attributes[existingAttrIndex] as t.JSXAttribute;
                    existingAttr.value = newValue;
                } else {
                    // Add new attribute
                    path.node.attributes.push(
                        t.jsxAttribute(t.jsxIdentifier(propName), newValue)
                    );
                }
            });
        },
    });

    if (!found) {
        throw new Error(`Node with id="${nodeId}" not found in ${filePath}`);
    }

    const output = generate(ast, {
        retainLines: true,
        retainFunctionParens: true,
    });

    await writeFile(filePath, output.code, 'utf-8');
}
