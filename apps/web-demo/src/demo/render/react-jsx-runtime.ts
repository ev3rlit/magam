import * as React from 'react';

export const Fragment = React.Fragment;

export function jsx(type: React.ElementType, props: Record<string, unknown>, key?: string) {
  return React.createElement(type, withOptionalKey(props, key));
}

export function jsxs(type: React.ElementType, props: Record<string, unknown>, key?: string) {
  return React.createElement(type, withOptionalKey(props, key));
}

function withOptionalKey(props: Record<string, unknown>, key?: string): Record<string, unknown> {
  if (key === undefined) {
    return props;
  }

  return {
    ...props,
    key,
  };
}
