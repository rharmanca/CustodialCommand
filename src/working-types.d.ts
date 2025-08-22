/// <reference types="react" />
/// <reference types="react-dom" />

// Complete React type declarations that work with the installed packages
declare module 'react' {
  export interface Component<P = {}, S = {}> {
    props: P;
    state: S;
    setState(partialState: Partial<S> | ((prevState: S, props: P) => Partial<S>), callback?: () => void): void;
    forceUpdate(callback?: () => void): void;
    render(): ReactNode;
  }
  
  export class Component<P = {}, S = {}> {
    props: P;
    state: S;
    constructor(props: P);
    setState(partialState: Partial<S> | ((prevState: S, props: P) => Partial<S>), callback?: () => void): void;
    forceUpdate(callback?: () => void): void;
    render(): ReactNode;
    static getDerivedStateFromError?(error: Error): any;
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void;
  }
  
  export interface ErrorInfo {
    componentStack: string;
  }
  
  export type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  export type ReactFragment = {} & Iterable<ReactNode>;
  export type ReactPortal = {} & ReactElement;
  export type Key = string | number;
  export type JSXElementConstructor<P> = 
    | ((props: P) => ReactElement<any, any> | null)
    | (new (props: P) => Component<any, any>);

  export function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void | undefined), deps?: any[]): void;
  export default React;
}

declare module 'react-dom/client' {
  import { ReactNode } from 'react';
  
  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }
  
  export function createRoot(container: Element | DocumentFragment): Root;
  export function hydrateRoot(container: Element, initialChildren: ReactNode): Root;
}

declare module 'react/jsx-runtime' {
  import { ReactElement, ReactFragment } from 'react';
  
  export function jsx(type: any, props: any, key?: any): ReactElement;
  export function jsxs(type: any, props: any, key?: any): ReactElement;
  export const Fragment: symbol;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any, any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

export {};