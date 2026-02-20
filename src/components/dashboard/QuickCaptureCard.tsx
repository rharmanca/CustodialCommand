import React from 'react';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

interface QuickCaptureCardProps {
  onClick: () => void;
  className?: string;
}

/**
 * QuickCaptureCard - Prominent card for Quick Capture workflow entry
 * 
 * Design specs per Phase 12-01:
 * - Positioned in thumb zone (bottom 1/3 of mobile viewport)
 * - Large camera icon (48px) with amber/warm color theme
 * - Clear label + description for field staff
 * - Minimum 120px touch target height for gloved hands
 * - Full width on mobile for easy tapping
 * 
 * @example
 * <QuickCaptureCard 
 *   onClick={() => navigate('/quick-capture')}
 *   className="mb-4"
 * />
 */
export function QuickCaptureCard({
  onClick,
  className,
}: QuickCaptureCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Layout - full width, minimum height for touch
        'w-full min-h-[120px] p-5 rounded-xl',
        // Amber/warm color theme per LAYOUT-01 requirement
        'bg-amber-50 border-2 border-amber-200',
        // Interactive states
        'hover:bg-amber-100 hover:border-amber-300',
        'active:scale-[0.98] active:bg-amber-100',
        'transition-all duration-200',
        // Shadow for prominence
        'shadow-sm hover:shadow-md',
        // Focus states for accessibility
        'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2',
        // Cursor
        'cursor-pointer',
        // Flex layout for content
        'flex items-center gap-5',
        className
      )}
      aria-label="Quick capture mode - capture issues while walking"
      type="button"
    >
      {/* Large camera icon - 48px for visibility */}
      <div 
        className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        <Camera className="w-7 h-7 text-white" />
      </div>
      
      {/* Label and description */}
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-amber-900 text-lg leading-tight">
          Quick Capture
        </h3>
        <p className="text-amber-700 text-sm mt-1">
          Capture issues while walking
        </p>
      </div>
      
      {/* Arrow indicator for affordance */}
      <svg
        className="w-5 h-5 text-amber-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}

export default QuickCaptureCard;
