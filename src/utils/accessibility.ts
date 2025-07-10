
export const FOCUS_TRAP_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export const trapFocus = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(FOCUS_TRAP_SELECTOR) as NodeListOf<HTMLElement>
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }

  container.addEventListener('keydown', handleTabKey)
  
  // Focus first element
  if (firstElement) {
    firstElement.focus()
  }

  return () => {
    container.removeEventListener('keydown', handleTabKey)
  }
}

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

export const generateUniqueId = (prefix: string = 'id') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

export const getContrastRatio = (foreground: string, background: string): number => {
  const getLuminance = (color: string) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    const sRGB = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    )
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }
  
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

// New accessibility utilities
export const setFocusableWhenVisible = (element: HTMLElement, isVisible: boolean) => {
  const focusableElements = element.querySelectorAll(FOCUS_TRAP_SELECTOR) as NodeListOf<HTMLElement>
  
  focusableElements.forEach(el => {
    if (isVisible) {
      el.removeAttribute('tabindex')
    } else {
      el.setAttribute('tabindex', '-1')
    }
  })
}

export const handleEscapeKey = (callback: () => void) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback()
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  return () => {
    document.removeEventListener('keydown', handleKeyDown)
  }
}

export const createAriaDescribedBy = (baseId: string, descriptors: string[]): string => {
  return descriptors.map(desc => `${baseId}-${desc}`).join(' ')
}

export const manageFocus = {
  save: (): HTMLElement | null => {
    return document.activeElement as HTMLElement
  },
  
  restore: (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus()
    }
  },
  
  trap: trapFocus,
  
  moveTo: (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
    }
  }
}
