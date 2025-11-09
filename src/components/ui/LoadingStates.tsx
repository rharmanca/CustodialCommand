import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Download, CheckCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const LoadingSpinner = ({ size = 'md', className, text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-blue-600")} />
      {text && (
        <span className="ml-2 text-sm text-gray-600">{text}</span>
      )}
    </div>
  );
};

interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

const LoadingButton = ({ loading = false, children, className }: LoadingButtonProps) => {
  return (
    <div className={cn("relative", className)}>
      <button
        disabled={loading}
        className={cn(
          "inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors",
          "min-h-[44px] min-w-[44px]",
          loading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "border border-transparent active:scale-95"
        )}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </button>
    </div>
  );
};

interface FormLoadingStateProps {
  message?: string;
  className?: string;
}

const FormLoadingState = ({ message = "Processing...", className }: FormLoadingStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <div className="absolute inset-0 h-8 w-8 animate-ping bg-blue-200 rounded-full" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
};

interface PageLoadingStateProps {
  title?: string;
  message?: string;
  className?: string;
}

const PageLoadingState = ({
  title = "Loading...",
  message = "Please wait while we load the page.",
  className
}: PageLoadingStateProps) => {
  return (
    <div className={cn(
      "min-h-screen bg-background flex items-center justify-center p-4",
      className
    )}>
      <div className="text-center max-w-md mx-auto">
        <div className="relative mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="absolute inset-0 h-12 w-12 animate-ping bg-blue-200 rounded-full" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

const Skeleton = ({ className, lines = 3, height = "h-4" }: SkeletonProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "bg-gray-200 rounded animate-pulse",
            height,
            "last:w-3/4"
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </div>
  );
};

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Progress = ({
  value,
  max = 100,
  className,
  showPercentage = true,
  size = 'md'
}: ProgressProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        )}
        <span className="text-sm text-gray-500">
          {value} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full">
        <div
          className={cn(
            "bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out",
            sizeClasses[size]
          )}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full w-full bg-white bg-opacity-30 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

interface LoadingCardProps {
  title: string;
  message?: string;
  icon?: 'loading' | 'refreshing' | 'saving' | 'success';
  className?: string;
}

const LoadingCard = ({
  title,
  message,
  icon = 'loading',
  className
}: LoadingCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case 'loading':
        return <Loader2 className="h-6 w-6 animate-spin" />;
      case 'refreshing':
        return <RefreshCw className="h-6 w-6 animate-spin" />;
      case 'saving':
        return <Download className="h-6 w-6 animate-bounce" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Loader2 className="h-6 w-6 animate-spin" />;
    }
  };

  return (
    <div className={cn(
      "p-6 bg-white rounded-lg shadow-md border border-gray-200",
      className
    )}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {message && (
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export {
  LoadingSpinner,
  LoadingButton,
  FormLoadingState,
  PageLoadingState,
  Skeleton,
  Progress,
  LoadingCard
};