import React from 'react';
import { cn } from '@/lib/utils';
import { Camera, Plus } from 'lucide-react';

function getUrgencyClasses(count: number) {
  const isBacklog = count >= 5;

  return {
    badge: isBacklog
      ? 'bg-red-600 text-white'
      : 'bg-amber-500 text-amber-950',
    pulse: count > 0 ? 'animate-pulse' : '',
  };
}

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: 'camera' | 'plus';
  label?: string;
  variant?: 'primary' | 'capture' | 'review';
  className?: string;
  'aria-label'?: string;
  badge?: number;
  visible?: boolean;
}

/**
 * Floating Action Button (FAB) for quick actions
 * 
 * Design specs:
 * - 64px diameter (minimum 44px touch target for accessibility)
 * - Fixed position bottom-right with safe area padding
 * - Prominent shadow for elevation
 * - Scale animation on press
 * - Optional badge for pending count
 * 
 * @example
 * <FloatingActionButton
 *   onClick={() => navigate('/quick-capture')}
 *   icon="camera"
 *   variant="capture"
 *   aria-label="Quick capture photos"
 *   badge={3}
 * />
 */
export function FloatingActionButton({
  onClick,
  icon = 'camera',
  label,
  variant = 'primary',
  className,
  'aria-label': ariaLabel,
  badge,
  visible = true,
}: FloatingActionButtonProps) {
  const Icon = icon === 'camera' ? Camera : Plus;
  const urgencyClasses = badge !== undefined && badge > 0 ? getUrgencyClasses(badge) : null;

  const variantStyles = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30',
    capture: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30',
    review: 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/30',
  };

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-50 lg:hidden transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}
    >
      {/* Mobile only */}
      <button
        onClick={onClick}
        className={cn(
          // Base styles
          'w-16 h-16 rounded-full flex items-center justify-center',
          'shadow-lg hover:shadow-xl transition-all duration-200',
          'focus:outline-none focus:ring-4 focus:ring-offset-2',
          'active:scale-95 transform',
          // Touch target (44px minimum, we use 64px)
          'min-w-[44px] min-h-[44px]',
          // Safe area padding for mobile devices
          'mb-safe mr-safe',
          // Variant styles
          variantStyles[variant],
          // Focus ring color based on variant
          variant === 'capture' && 'focus:ring-amber-500/50',
          variant === 'review' && 'focus:ring-teal-500/50',
          variant === 'primary' && 'focus:ring-primary/50',
          className
        )}
        aria-label={ariaLabel || label || 'Floating action button'}
        type="button"
      >
        <Icon className="w-7 h-7" aria-hidden="true" />
        {label && <span className="sr-only">{label}</span>}
      </button>

      {/* Badge for pending count */}
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'absolute -top-1 -right-1',
            'min-w-[24px] h-6 px-1.5',
            'flex items-center justify-center',
            'text-sm font-bold',
            'rounded-full shadow-md',
            'animate-in fade-in zoom-in duration-200',
            urgencyClasses?.badge,
            urgencyClasses?.pulse
          )}
          aria-label={`${badge} pending items`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  );
}

/**
 * Dashboard card for Quick Capture entry point
 * Mobile-optimized with large touch targets
 */
export function QuickCaptureCard({
  onClick,
  pendingCount,
}: {
  onClick: () => void;
  pendingCount?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl',
        'bg-gradient-to-br from-amber-50 to-orange-50',
        'border-2 border-amber-200 hover:border-amber-300',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'flex items-center gap-4',
        'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
        'active:scale-[0.98] transform'
      )}
      aria-label="Quick capture mode for rapid photo documentation"
    >
      <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
        <Camera className="w-7 h-7 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-amber-900 text-lg">Quick Capture</h3>
        <p className="text-amber-700 text-sm">
          Rapid photo documentation for field use
        </p>
      </div>
      {pendingCount !== undefined && pendingCount > 0 && (
        <span
          className="bg-amber-500 text-white text-sm font-bold px-2.5 py-1 rounded-full"
          aria-label={`${pendingCount} photos pending upload`}
        >
          {pendingCount}
        </span>
      )}
    </button>
  );
}

/**
 * Dashboard card for Photo-First Review entry point
 * Desktop-optimized with detailed information
 */
export function ReviewInspectionsCard({
  onClick,
  pendingCount,
}: {
  onClick: () => void;
  pendingCount?: number;
}) {
  const urgencyClasses = pendingCount !== undefined && pendingCount > 0 ? getUrgencyClasses(pendingCount) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-5 rounded-xl',
        'bg-gradient-to-br from-teal-50 to-cyan-50',
        'border-2 border-teal-200 hover:border-teal-300',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'flex items-center gap-4',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/50',
        'active:scale-[0.98] transform'
      )}
      aria-label="Review and complete pending inspections from photos"
    >
      <div className="w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-7 h-7 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-teal-900 text-lg">
          Review Inspections
        </h3>
        <p className="text-teal-700 text-sm">
          Complete pending inspections from photos
        </p>
      </div>
      {pendingCount !== undefined && pendingCount > 0 && (
        <span
          className={cn(
            'text-sm font-bold px-3 py-1.5 rounded-full min-w-[2.5rem] text-center shadow-sm',
            urgencyClasses?.badge,
            urgencyClasses?.pulse
          )}
          aria-label={`${pendingCount} inspections pending review`}
        >
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </button>
  );
}

export default FloatingActionButton;
