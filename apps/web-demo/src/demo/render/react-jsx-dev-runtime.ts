// @ts-expect-error Pin demo runtime to the workspace React package for reconciler compatibility.
import * as React from '../../../../../node_modules/react/index.js';

export const Fragment = React.Fragment;

export function jsxDEV(
  type: React.ElementType,
  props: Record<string, unknown>,
  key?: string,
) {
  if (key === undefined) {
    return React.createElement(type, props);
  }

  return React.createElement(type, {
    ...props,
    key,
  });
}
