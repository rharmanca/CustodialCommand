import * as React from "react";
import { cn } from "@/lib/utils";

interface PendingBadgeProps {
  count: number;
  showZero?: boolean;
  className?: string;
}

/**
 * PendingBadge - Displays count of pending inspections with urgency color coding
 * 
 * Color coding (from Decision 17):
 * - Amber/yellow for count 1-4
 * - Red for count >= 5
 * - Gray/ghost for count 0
 * 
 * Features:
 * - Pulse animation when count > 0
 * - Accessible aria-label
 * - Configurable showZero behavior
 */
export function PendingBadge({
  count,
  showZero = false,
  className,
}: PendingBadgeProps) {
  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  // Determine color based on count
  const getColorClasses = (count: number): string => {
    if (count === 0) {
      return "bg-gray-100 text-gray-500 border-gray-200";
    }
    if (count >= 5) {
      return "bg-red-500 text-white border-red-600";
    }
    return "bg-amber-500 text-amber-950 border-amber-600";
  };

  const colorClasses = getColorClasses(count);
  const hasPulse = count > 0;

  return (
    <span
      className={cn(
        // Base styles
        "inline-flex items-center justify-center",
        "min-w-[24px] h-6 px-2",
        "text-sm font-bold",
        "rounded-full border",
        "shadow-sm",
        // Animation for non-zero counts
        hasPulse && "animate-pulse",
        // Color variant
        colorClasses,
        className
      )}
      aria-label={`${count} inspection${count !== 1 ? 's' : ''} pending review`}
      role="status"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default PendingBadge;
