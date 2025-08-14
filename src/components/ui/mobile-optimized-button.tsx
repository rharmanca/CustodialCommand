
import React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '../../lib/utils';

interface MobileOptimizedButtonProps extends ButtonProps {
  touchOptimized?: boolean;
}

export function MobileOptimizedButton({ 
  children, 
  className, 
  touchOptimized = true, 
  ...props 
}: MobileOptimizedButtonProps) {
  return (
    <Button
      className={cn(
        // Base mobile optimizations
        "min-h-[48px] min-w-[48px] text-base font-medium",
        // Touch-optimized spacing
        touchOptimized && "px-6 py-4 sm:px-4 sm:py-2",
        // Enhanced visual feedback
        "transition-all duration-200 transform active:scale-95",
        // Better focus states for accessibility
        "focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
