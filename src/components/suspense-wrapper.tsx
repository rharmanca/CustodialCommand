import React, { Suspense, ComponentType } from 'react';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingText?: string;
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  loadingText = 'Loading page...'
}) => {
  const defaultFallback = (
    <LoadingSpinner 
      size="lg" 
      text={loadingText}
      className="min-h-[400px]"
    />
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

// Higher-order component for wrapping lazy components
export const withSuspense = <P extends object>(
  Component: ComponentType<P>,
  loadingText?: string
) => {
  const WrappedComponent = (props: P) => (
    <SuspenseWrapper loadingText={loadingText}>
      <Component {...props} />
    </SuspenseWrapper>
  );

  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default SuspenseWrapper;
