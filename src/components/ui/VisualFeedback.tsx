import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';

// Toast notification types
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const Toast = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  className
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm rounded-lg border shadow-lg transition-all duration-300 ease-in-out",
        getColorClasses(),
        isLeaving ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start p-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {message && (
            <p className="mt-1 text-sm opacity-90">{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 rounded-md p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Hover state with visual feedback
interface HoverFeedbackProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  disabled?: boolean;
}

const HoverFeedback = ({
  children,
  className,
  hoverScale = 1.02,
  disabled = false
}: HoverFeedbackProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "transition-transform duration-200 ease-out cursor-pointer",
        isHovered && !disabled && "scale-105",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered && !disabled ? `scale(${hoverScale})` : 'scale(1)'
      }}
    >
      {children}
    </div>
  );
};

// Pulse animation for important elements
interface PulseProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

const Pulse = ({ children, className, active = true, color = 'blue' }: PulseProps) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-400';
      case 'green':
        return 'bg-green-400';
      case 'red':
        return 'bg-red-400';
      case 'yellow':
        return 'bg-yellow-400';
    }
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {children}
      {active && (
        <span
          className={cn(
            "absolute inset-0 rounded-lg animate-ping opacity-75",
            getColorClasses()
          )}
        />
      )}
    </div>
  );
};

// Shake animation for errors
interface ShakeProps {
  children: React.ReactNode;
  trigger: boolean;
  className?: string;
  duration?: number;
}

const Shake = ({ children, trigger, className, duration = 500 }: ShakeProps) => {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  return (
    <div
      className={cn(
        "transition-transform",
        isShaking && "animate-pulse",
        isShaking && "transform translate-x-1",
        className
      )}
      style={{
        animation: isShaking ? `shake ${duration}ms ease-in-out` : 'none'
      }}
    >
      {children}
    </div>
  );
};

// Loading skeleton with shimmer effect
interface ShimmerProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

const Shimmer = ({ className, height = "h-4", width = "w-full", rounded = true }: ShimmerProps) => {
  return (
    <div
      className={cn(
        "bg-gray-200 rounded animate-pulse relative overflow-hidden",
        height,
        width,
        rounded && "rounded-md",
        className
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"
        style={{
          animation: 'shimmer 1.5s infinite'
        }}
      />
    </div>
  );
};

// Accordion with smooth animations
interface AccordionProps {
  children: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  className?: string;
}

const Accordion = ({ children, title, defaultOpen = false, className }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left font-medium bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
        aria-expanded={isOpen}
      >
        {title}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 transition-transform duration-200" />
        ) : (
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        )}
      </button>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};

// Badge with notification count
interface BadgeProps {
  count: number;
  max?: number;
  className?: string;
  color?: 'red' | 'blue' | 'green' | 'yellow';
  pulse?: boolean;
}

const Badge = ({ count, max = 99, className, color = 'red', pulse = false }: BadgeProps) => {
  const displayCount = count > max ? `${max}+` : count;

  if (count === 0) return null;

  const getColorClasses = () => {
    switch (color) {
      case 'red':
        return 'bg-red-500 text-white';
      case 'blue':
        return 'bg-blue-500 text-white';
      case 'green':
        return 'bg-green-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-black';
    }
  };

  return (
    <Pulse active={pulse && count > 0} color={color}>
      <span
        className={cn(
          "inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full min-w-[20px] h-5",
          getColorClasses(),
          className
        )}
        aria-label={`${count} notifications`}
      >
        {displayCount}
      </span>
    </Pulse>
  );
};

// Progress ring with animation
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
}

const ProgressRing = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true
}: ProgressRingProps) => {
  const [progress, setProgress] = useState(0);
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  useEffect(() => {
    const timer = setTimeout(() => setProgress(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-600 transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Add shimmer animation to global styles
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Add shake animation to global styles
const shakeKeyframes = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
`;

// Inject keyframes into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shimmerKeyframes + shakeKeyframes;
  document.head.appendChild(styleSheet);
}

export {
  Toast,
  HoverFeedback,
  Pulse,
  Shake,
  Shimmer,
  Accordion,
  Badge,
  ProgressRing
};