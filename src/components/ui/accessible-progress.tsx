
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface AccessibleProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  max?: number
  label?: string
  valueText?: string
  showPercentage?: boolean
}

const AccessibleProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  AccessibleProgressProps
>(({ 
  className, 
  value = 0, 
  max = 100, 
  label,
  valueText,
  showPercentage = true,
  ...props 
}, ref) => {
  const percentage = Math.round((value / max) * 100)
  const displayValue = valueText || (showPercentage ? `${percentage}%` : `${value} of ${max}`)
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" id={`${props.id}-label`}>
            {label}
          </span>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {displayValue}
          </span>
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={displayValue}
        aria-labelledby={label ? `${props.id}-label` : undefined}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})
AccessibleProgress.displayName = "AccessibleProgress"

export { AccessibleProgress }
