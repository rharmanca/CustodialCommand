import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary/20 hover:border-primary/30",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive/20 hover:border-destructive/30",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-secondary/20 hover:border-secondary/30",
        ghost: "hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-accent/20",
        link: "text-primary underline-offset-4 hover:underline border-2 border-transparent",
      },
      size: {
        default: "h-10 px-4 py-2 font-semibold",
        sm: "h-9 rounded-md px-3 font-medium",
        lg: "h-11 rounded-md px-8 font-semibold text-base",
        icon: "h-10 w-10",
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