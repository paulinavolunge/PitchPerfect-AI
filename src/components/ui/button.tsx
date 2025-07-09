
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:-translate-y-0.5 active:translate-y-0 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-[hsl(221_83%_53%)] text-white hover:bg-[hsl(221_83%_48%)] hover:shadow-lg border-2 border-[hsl(221_83%_48%)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md border-2 border-destructive",
        outline:
          "border-2 border-[hsl(221_83%_53%)] bg-background text-[hsl(221_83%_53%)] hover:bg-[hsl(221_83%_53%)] hover:text-white hover:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm border-2 border-secondary",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-[hsl(221_83%_53%)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3 md:h-12", // Consistent 48px height
        sm: "h-10 rounded-md px-4 py-2 md:h-10", // 40px minimum for small
        lg: "h-14 rounded-md px-8 py-4 text-base md:h-14", // 56px for large
        icon: "h-12 w-12 md:h-12 md:w-12", // Square 48px
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
