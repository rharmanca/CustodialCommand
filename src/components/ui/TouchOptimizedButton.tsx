import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TouchOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

const TouchOptimizedButton = forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
  const baseClasses = [
    // Touch target sizing - minimum 44x44px
    'min-h-[44px] min-w-[44px]',
    // Touch-friendly padding
    'px-4 py-3',
    // Base button styles
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-md',
    'font-medium',
    'transition-all',
    'duration-200',
    'ease-in-out',
    // Focus styles for accessibility
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-blue-500',
    'focus-visible:ring-offset-2',
    // Active state for touch feedback
    'active:scale-95',
    // Disable text selection on touch
    'select-none',
    // Prevent default touch highlight
    '[WebkitTapHighlightColor]:transparent',
    'touch-manipulation'
  ];

  const variantClasses = {
    default: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-md hover:shadow-lg border-blue-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:text-gray-900 border-gray-300',
    destructive: 'bg-red-600 text-white hover:bg-red-700 hover:text-white shadow-md hover:shadow-lg border-red-600',
    outline: 'border-2 border-gray-300 hover:bg-gray-50 hover:text-gray-900',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    link: 'text-blue-600 underline-offset-4 hover:underline hover:text-blue-700'
  };

  const sizeClasses = {
    default: 'text-base',
    sm: 'text-sm',
    lg: 'text-lg px-6 py-4',
    icon: 'p-2'
  };

  const loadingClasses = loading ? 'opacity-50 cursor-not-allowed' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const classes = cn(
    ...baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loadingClasses,
    disabledClasses,
    className
  );

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </button>
  );
});

TouchOptimizedButton.displayName = 'TouchOptimizedButton';

export default TouchOptimizedButton;