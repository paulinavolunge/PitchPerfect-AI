
import React from 'react'
import { cn } from '@/lib/utils'

interface ScreenReaderOnlyProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  asChild = false, 
  className 
}) => {
  const srOnlyClass = cn(
    "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
    "clip-path-inset-50", // Custom utility class for clip-path: inset(50%)
    className
  )
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      className: cn(children.props.className, srOnlyClass)
    })
  }
  
  return <span className={srOnlyClass}>{children}</span>
}
