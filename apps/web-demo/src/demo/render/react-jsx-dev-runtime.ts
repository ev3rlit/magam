import * as React from 'react';

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
