import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headingVariants = cva(
  "font-bold tracking-tight",
  {
    variants: {
      level: {
        1: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
        2: "text-3xl sm:text-4xl md:text-5xl",
        3: "text-2xl sm:text-3xl",
        4: "text-xl sm:text-2xl",
        5: "text-lg sm:text-xl",
        6: "text-base sm:text-lg",
      },
      color: {
        default: "text-foreground",
        secondary: "text-muted-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
      },
    },
    defaultVariants: {
      level: 1,
      color: "default",
    },
  }
);

interface AccessibleHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  visualLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  color?: "default" | "secondary" | "muted" | "primary";
}

const AccessibleHeading = React.forwardRef<HTMLHeadingElement, AccessibleHeadingProps>(({
  level,
  visualLevel,
  color = "default",
  className,
  children,
  ...props
}, ref) => {
  const Component = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  const displayLevel = visualLevel || level
  
  return React.createElement(
    Component,
    {
      ref,
      className: cn(headingVariants({ level: displayLevel, color: color as "default" | "secondary" | "muted" | "primary" }), className),
      ...props,
    },
    children
  );
});

AccessibleHeading.displayName = "AccessibleHeading";

export { AccessibleHeading, headingVariants };