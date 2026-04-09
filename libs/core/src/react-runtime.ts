import * as React from 'react';
import { ensureReactInternalsCompat } from './react-internals-compat';

ensureReactInternalsCompat(React as Record<string, unknown>);

export * from 'react';
export const createElement = React.createElement;
export const createContext = React.createContext;
export const useContext = React.useContext;
export type FC<P = {}> = React.FC<P>;
export type ReactNode = React.ReactNode;
export type CSSProperties = React.CSSProperties;
export type ComponentType<P = {}> = React.ComponentType<P>;
export type ElementType<P = any> = React.ElementType<P>;
export default React;
