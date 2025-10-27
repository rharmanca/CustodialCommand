import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 min-h-[48px] touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border-3 border-primary/30 hover:border-primary/40 shadow-lg hover:shadow-xl",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-3 border-destructive/30 hover:border-destructive/40 shadow-lg hover:shadow-xl",
        outline:
          "border-3 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent/50 shadow-md hover:shadow-lg",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-3 border-secondary/30 hover:border-secondary/40 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground border-3 border-transparent hover:border-accent/20",
        link: "text-primary underline-offset-4 hover:underline border-3 border-transparent",
      },
      size: {
        default: "h-12 px-6 py-3 font-semibold min-h-[48px]",
        sm: "h-10 rounded-md px-4 font-medium min-h-[44px]",
        lg: "h-14 rounded-md px-8 font-semibold text-base min-h-[56px]",
        icon: "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }