import * as React from "react";
import { cn } from "@/lib/utils";

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  edges?: ("top" | "right" | "bottom" | "left")[];
  className?: string;
}

/**
 * SafeAreaWrapper - Handles iOS safe area insets for notched devices
 *
 * Purpose: Ensure content isn't obscured by iPhone home indicator,
 * notch, or other device-specific UI elements.
 *
 * Features:
 * - Supports all edges (top, right, bottom, left)
 * - Uses CSS env() for dynamic safe area insets
 * - Falls back to sensible defaults for unsupported browsers
 * - Responsive: applies primarily on mobile devices
 *
 * Requirements:
 * - viewport meta tag must include `viewport-fit=cover`
 *   (already in index.html)
 *
 * @example
 * <SafeAreaWrapper edges={['bottom']}>
 *   <DashboardContent />
 * </SafeAreaWrapper>
 */
export function SafeAreaWrapper({
  children,
  edges = ["bottom"],
  className,
}: SafeAreaWrapperProps) {
  // Build inline styles for safe area insets
  const safeAreaStyles: React.CSSProperties = {};

  if (edges.includes("top")) {
    safeAreaStyles.paddingTop = "max(1rem, env(safe-area-inset-top))";
  }
  if (edges.includes("right")) {
    safeAreaStyles.paddingRight = "max(1rem, env(safe-area-inset-right))";
  }
  if (edges.includes("bottom")) {
    // Use 1.5rem (24px) as fallback to clear FAB (80px tall with margin)
    safeAreaStyles.paddingBottom = "max(1.5rem, env(safe-area-inset-bottom))";
  }
  if (edges.includes("left")) {
    safeAreaStyles.paddingLeft = "max(1rem, env(safe-area-inset-left))";
  }

  return (
    <div
      className={cn(
        // Base styles
        "relative",
        // Ensure content doesn't overflow
        "overflow-x-hidden",
        className
      )}
      style={safeAreaStyles}
    >
      {children}
    </div>
  );
}

/**
 * SafeAreaSpacer - Adds fixed spacing to clear fixed bottom elements
 *
 * Use this at the bottom of scrollable content to ensure
 * the last items are visible above the FAB or bottom nav.
 */
export function SafeAreaSpacer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // Height to clear FAB (56px) + safe area + margin
        "h-24 sm:h-8",
        // Extra padding for safe area on mobile
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        className
      )}
      aria-hidden="true"
    />
  );
}

export default SafeAreaWrapper;
