
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { generateUniqueId } from "@/utils/accessibility"

const accessibleButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:-translate-y-0.5 active:translate-y-0 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-4 py-2 md:h-10",
        sm: "h-10 rounded-md px-3 md:h-9",
        lg: "h-14 rounded-md px-8 text-base md:h-11",
        icon: "h-12 w-12 md:h-10 md:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accessibleButtonVariants> {
  asChild?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  loadingText?: string
  isLoading?: boolean
  iconDescription?: string
  hasTooltip?: boolean
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    ariaLabel, 
    ariaDescribedBy,
    isLoading = false,
    loadingText = "Loading...",
    iconDescription,
    hasTooltip = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || isLoading
    const buttonId = React.useRef(generateUniqueId('btn')).current
    
    // Create comprehensive aria-describedby
    const describedByIds = React.useMemo(() => {
      const ids = []
      if (ariaDescribedBy) ids.push(ariaDescribedBy)
      if (isLoading) ids.push(`${buttonId}-loading`)
      if (iconDescription) ids.push(`${buttonId}-icon`)
      return ids.length > 0 ? ids.join(' ') : undefined
    }, [ariaDescribedBy, isLoading, iconDescription, buttonId])
    
    return (
      <>
        <Comp
          id={buttonId}
          className={cn(accessibleButtonVariants({ variant, size, className }))}
          ref={ref}
          disabled={isDisabled}
          aria-label={ariaLabel}
          aria-describedby={describedByIds}
          aria-busy={isLoading}
          role={asChild ? undefined : "button"}
          {...props}
        >
          {isLoading ? loadingText : children}
        </Comp>
        
        {/* Hidden descriptions for screen readers */}
        {isLoading && (
          <div id={`${buttonId}-loading`} className="sr-only">
            Button is currently loading, please wait
          </div>
        )}
        
        {iconDescription && (
          <div id={`${buttonId}-icon`} className="sr-only">
            {iconDescription}
          </div>
        )}
      </>
    )
  }
)
AccessibleButton.displayName = "AccessibleButton"

export { AccessibleButton, accessibleButtonVariants }
