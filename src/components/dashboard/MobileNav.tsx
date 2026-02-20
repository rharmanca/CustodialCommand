import * as React from "react";
import { cn } from "@/lib/utils";
import { Home, Camera, List } from "lucide-react";

interface MobileNavProps {
  currentPath?: string;
  onNavigate?: (page: string) => void;
  className?: string;
  visible?: boolean;
}

/**
 * MobileNav - Optional bottom navigation for mobile devices
 *
 * Purpose: Provides quick navigation between primary workflows on mobile.
 *
 * Features:
 * - Shows only on mobile (< sm breakpoint, hidden on lg+)
 * - Fixed position at bottom with safe area padding
 * - Three items: Dashboard, Capture, Review
 * - Active state highlighting with color coding
 * - Minimal pill/tab style (not full-width bar)
 *
 * Design:
 * - Height: 64px total (including safe area)
 * - Touch targets: 48px minimum
 * - Active colors: amber for Capture, teal for Review, slate for Dashboard
 *
 * Optional: This component is conditionally rendered by parent.
 * Dashboard can choose to show/hide based on UX preferences.
 *
 * @example
 * <MobileNav
 *   currentPath="Dashboard"
 *   onNavigate={(page) => setCurrentPage(page)}
 *   visible={isMobile}
 * />
 */
export function MobileNav({
  currentPath = "Dashboard",
  onNavigate,
  className,
  visible = true,
}: MobileNavProps) {
  const navItems = [
    {
      id: "Dashboard",
      label: "Home",
      icon: Home,
      color: "slate",
    },
    {
      id: "Quick Capture",
      label: "Capture",
      icon: Camera,
      color: "amber",
    },
    {
      id: "Photo Review",
      label: "Review",
      icon: List,
      color: "teal",
    },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) {
      return "text-slate-500 hover:text-slate-700 hover:bg-slate-100";
    }

    switch (color) {
      case "amber":
        return "text-amber-600 bg-amber-100";
      case "teal":
        return "text-teal-600 bg-teal-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <nav
      className={cn(
        // Fixed position at bottom
        "fixed bottom-0 left-0 right-0 z-40",
        // Mobile only (hidden on desktop)
        "sm:hidden",
        // Safe area padding for iPhone home indicator
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        // Background
        "bg-white/95 backdrop-blur-sm border-t border-slate-200",
        // Shadow for depth
        "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]",
        className
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                // Base styles
                "flex flex-col items-center justify-center",
                // Touch target: 48px minimum
                "min-w-[64px] h-12 px-3",
                // Rounded pill style
                "rounded-full",
                // Transition
                "transition-all duration-200",
                // Color classes based on state
                getColorClasses(item.color, isActive),
                // Focus states
                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                item.color === "amber" && "focus:ring-amber-500/50",
                item.color === "teal" && "focus:ring-teal-500/50",
                item.color === "slate" && "focus:ring-slate-500/50"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              type="button"
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "stroke-[2.5px]" : "stroke-2"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-xs font-medium mt-0.5",
                  isActive ? "opacity-100" : "opacity-70"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * MobileNavSpacer - Adds padding to clear the fixed MobileNav
 *
 * Use this at the bottom of scrollable content when MobileNav is visible
 * to ensure the last items aren't hidden behind the nav.
 */
export function MobileNavSpacer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // Height to clear nav (64px) + safe area
        "h-20 sm:h-0",
        // Extra padding for safe area
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        className
      )}
      aria-hidden="true"
    />
  );
}

export default MobileNav;
