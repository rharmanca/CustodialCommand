
declare module 'class-variance-authority' {
  export interface VariantProps<T> {
    [key: string]: any;
  }
  export function cva(...args: any[]): any;
  export type { VariantProps };
}

declare module '@tanstack/react-query' {
  export * from '@tanstack/react-query/build/lib/types';
  export { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query/build/lib/index';
}

declare module 'wouter' {
  export function Router(props: { children: React.ReactNode }): JSX.Element;
  export function Route(props: { path: string; component: React.ComponentType<any> }): JSX.Element;
  export function useRoute(path: string): [boolean, Record<string, string>];
  export function useLocation(): [string, (path: string) => void];
}

declare module 'clsx' {
  export default function clsx(...args: any[]): string;
}

declare module 'tailwind-merge' {
  export function twMerge(...args: any[]): string;
}
