
import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  children: React.ReactNode
}

export function MobileCard({ title, children, className, ...props }: MobileCardProps) {
  return (
    <div 
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )} 
      {...props}
    >
      {title && (
        <div className="p-6 pb-4">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            {title}
          </h3>
        </div>
      )}
      <div className={cn("p-6", title && "pt-0")}>
        {children}
      </div>
    </div>
  )
}
