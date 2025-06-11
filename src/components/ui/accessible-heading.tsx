
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva(
  "font-bold tracking-tight text-foreground",
  {
    variants: {
      level: {
        1: "text-4xl md:text-5xl lg:text-6xl",
        2: "text-3xl md:text-4xl lg:text-5xl", 
        3: "text-2xl md:text-3xl lg:text-4xl",
        4: "text-xl md:text-2xl lg:text-3xl",
        5: "text-lg md:text-xl lg:text-2xl",
        6: "text-base md:text-lg lg:text-xl",
      },
      color: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
      }
    },
    defaultVariants: {
      level: 2,
      color: "default",
    },
  }
)

export interface AccessibleHeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'>,
    VariantProps<typeof headingVariants> {
  level: 1 | 2 | 3 | 4 | 5 | 6
  visualLevel?: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
}

export const AccessibleHeading: React.FC<AccessibleHeadingProps> = ({
  level,
  visualLevel,
  color = "default",
  className,
  children,
  ...props
}) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements
  const displayLevel = visualLevel || level
  
  return React.createElement(
    Component,
    {
      className: cn(headingVariants({ level: displayLevel, color }), className),
      ...props,
    },
    children
  )
}
