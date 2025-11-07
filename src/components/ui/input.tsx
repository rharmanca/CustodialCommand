import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
          // Base transition for all states
          "transition-all duration-200 ease-out",
          // Default state with retro propaganda theme
          "border-3 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]",
          // Focus states with enhanced visual feedback
          "focus:outline-none focus:ring-0 focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_4px_hsl(var(--primary)_/_0.2)] focus:bg-[hsl(var(--background))]",
          // Hover states
          "hover:border-[hsl(var(--primary)_/_0.8)] hover:shadow-[0_0_0_2px_hsl(var(--primary)_/_0.1)]",
          // Disabled states
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Hardware acceleration for 60fps performance
          "transform-gpu will-change-auto",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }