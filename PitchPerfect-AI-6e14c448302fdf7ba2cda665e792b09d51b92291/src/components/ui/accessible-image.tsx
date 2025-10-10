
import * as React from "react"
import { cn } from "@/lib/utils"

interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt: string // Make alt required
  decorative?: boolean
  captionId?: string
  errorFallback?: React.ReactNode
  loadingPlaceholder?: React.ReactNode
}

export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  alt,
  decorative = false,
  captionId,
  errorFallback,
  loadingPlaceholder,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [imageState, setImageState] = React.useState<'loading' | 'loaded' | 'error'>('loading')
  
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageState('loaded')
    onLoad?.(e)
  }
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageState('error')
    onError?.(e)
  }
  
  if (imageState === 'error' && errorFallback) {
    return <>{errorFallback}</>
  }
  
  return (
    <div className={cn("relative", className)}>
      {imageState === 'loading' && loadingPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          {loadingPlaceholder}
        </div>
      )}
      
      <img
        {...props}
        alt={decorative ? "" : alt}
        role={decorative ? "presentation" : undefined}
        aria-describedby={captionId}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-200",
          imageState === 'loading' ? "opacity-0" : "opacity-100",
          className
        )}
      />
    </div>
  )
}
