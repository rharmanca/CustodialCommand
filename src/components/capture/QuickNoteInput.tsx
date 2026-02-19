import * as React from "react";
import { useState, useCallback } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface QuickNoteInputProps {
  /** Current value of the textarea */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Maximum character length */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Whether the input is collapsed (controlled) */
  collapsed?: boolean;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Default collapsed state (uncontrolled) */
  defaultCollapsed?: boolean;
}

const MAX_LENGTH = 200;

/**
 * Quick notes input with character counter and collapsible UI.
 * 200-character max, optional field for adding quick context to captures.
 * Large touch targets for field use with gloves.
 */
export const QuickNoteInput = React.forwardRef<HTMLTextAreaElement, QuickNoteInputProps>(
  ({ 
    value, 
    onChange, 
    maxLength = MAX_LENGTH, 
    placeholder = "Optional quick notes...", 
    className,
    disabled = false,
    collapsed: controlledCollapsed,
    onCollapsedChange,
    defaultCollapsed = true
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
    
    // Use controlled or uncontrolled collapsed state
    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
    
    const setCollapsed = useCallback((newCollapsed: boolean) => {
      if (controlledCollapsed === undefined) {
        setInternalCollapsed(newCollapsed);
      }
      onCollapsedChange?.(newCollapsed);
    }, [controlledCollapsed, onCollapsedChange]);

    const charCount = value.length;
    const isNearLimit = charCount > maxLength * 0.8;
    const isAtLimit = charCount >= maxLength;
    const hasContent = value.length > 0;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      // Enforce max length
      if (newValue.length <= maxLength) {
        onChange(newValue);
      }
    }, [maxLength, onChange]);

    const toggleCollapsed = useCallback(() => {
      setCollapsed(!isCollapsed);
    }, [isCollapsed, setCollapsed]);

    return (
      <div className={cn("w-full flex flex-col gap-2", className)}>
        {/* Collapsed state - show toggle button */}
        {isCollapsed ? (
          <Button
            type="button"
            variant="outline"
            onClick={toggleCollapsed}
            disabled={disabled}
            className={cn(
              "w-full justify-between min-h-[44px]",
              hasContent && "border-amber-300 bg-amber-50/50"
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className={cn("w-4 h-4", hasContent ? "text-amber-600" : "text-muted-foreground")} />
              <span className={cn(hasContent ? "text-amber-900" : "text-muted-foreground")}>
                {hasContent ? `Notes added (${charCount} chars)` : "Add quick notes"}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        ) : (
          <>
            {/* Expanded state - show textarea with header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Quick Notes</span>
                <span className="text-xs text-muted-foreground/70">(optional)</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleCollapsed}
                disabled={disabled}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide
              </Button>
            </div>

            {/* Textarea container */}
            <div className="relative">
              <textarea
                ref={ref}
                value={value}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                placeholder={placeholder}
                rows={3}
                maxLength={maxLength}
                className={cn(
                  // Base styles - touch-friendly
                  "w-full min-h-[88px] p-3 rounded-lg resize-none",
                  "text-base leading-relaxed",
                  // Border styles
                  "border-2 border-input bg-background",
                  "transition-all duration-200",
                  // Focus states
                  isFocused && "border-primary ring-2 ring-primary/20",
                  // Disabled states
                  disabled && "opacity-50 cursor-not-allowed bg-muted",
                  // Touch optimization
                  "touch-manipulation"
                )}
                aria-label="Quick notes"
                aria-describedby="quick-notes-counter"
              />
            </div>

            {/* Character counter */}
            <div className="flex items-center justify-between px-1">
              <span 
                id="quick-notes-counter"
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  isAtLimit && "text-destructive",
                  isNearLimit && !isAtLimit && "text-amber-500",
                  !isNearLimit && "text-muted-foreground"
                )}
                aria-live="polite"
                aria-atomic="true"
              >
                {charCount}/{maxLength}
              </span>
              
              {isAtLimit && (
                <span className="text-xs text-destructive">
                  Character limit reached
                </span>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
);

QuickNoteInput.displayName = "QuickNoteInput";

export default QuickNoteInput;
