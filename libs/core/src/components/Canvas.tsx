import * as React from 'react';

export const Canvas: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return React.createElement(React.Fragment, null, children);
};
