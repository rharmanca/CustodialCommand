import * as React from "react";
import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

const MAX_LENGTH = 200;

/**
 * Quick notes input with character counter.
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
    disabled = false 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const charCount = value.length;
    const isNearLimit = charCount > maxLength * 0.8;
    const isAtLimit = charCount >= maxLength;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      // Enforce max length
      if (newValue.length <= maxLength) {
        onChange(newValue);
      }
    }, [maxLength, onChange]);

    return (
      <div className={cn("w-full flex flex-col gap-2", className)}>
        {/* Label with icon */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Quick Notes</span>
          <span className="text-xs text-muted-foreground/70">(optional)</span>
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
      </div>
    );
  }
);

QuickNoteInput.displayName = "QuickNoteInput";

export default QuickNoteInput;
