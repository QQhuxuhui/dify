/**
 * Edge Browser Compatibility Utilities
 * Ensures consistent behavior across Edge browser versions (79+)
 */

/**
 * Detect if the current browser is Microsoft Edge
 */
export const isEdgeBrowser = (): boolean => {
  if (typeof window === 'undefined') return false

  const userAgent = navigator.userAgent
  return /Edg\//.test(userAgent) || /Edge\//.test(userAgent)
}

/**
 * Get Edge browser version
 */
export const getEdgeVersion = (): number => {
  if (!isEdgeBrowser()) return 0

  const userAgent = navigator.userAgent
  const edgeVersionMatch = userAgent.match(/Edg\/(\d+)/) || userAgent.match(/Edge\/(\d+)/)
  return edgeVersionMatch ? Number.parseInt(edgeVersionMatch[1]) : 0
}

/**
 * Check if Edge browser version is supported (79+)
 */
export const isEdgeVersionSupported = (): boolean => {
  if (!isEdgeBrowser()) return true // Not Edge, assume supported
  return getEdgeVersion() >= 79
}

/**
 * Apply Edge-specific CSS class names for compatibility
 */
export const getEdgeCompatibleClassName = (baseClassName: string): string => {
  if (!isEdgeBrowser()) return baseClassName

  return `${baseClassName} edge-compatible`
}

/**
 * Check if CSS feature is supported in current Edge version
 */
export const isCSSFeatureSupported = (property: string, value: string): boolean => {
  if (typeof window === 'undefined') return false

  const testElement = document.createElement('div')
  const style = testElement.style as any

  try {
    style[property] = value
    return style[property] === value
  }
  catch {
    return false
  }
  finally {
    // Clean up test element to prevent memory leaks
    testElement.remove()
  }
}

/**
 * Ensure fullscreen mode works correctly in Edge
 */
export const getFullscreenCompatibleStyles = () => {
  const baseStyles = {
    display: 'flex',
    height: '100%',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  }

  if (!isEdgeBrowser()) return baseStyles

  // Edge-specific style enhancements
  return {
    ...baseStyles,
    // Ensure proper flexbox behavior in Edge
    msFlexDirection: 'column',
    msFlexAlign: 'stretch',
    WebkitFlexDirection: 'column',
    WebkitAlignItems: 'stretch',
    // Ensure transitions work smoothly
    transition: 'all 0.2s ease',
    msTransition: 'all 0.2s ease',
    WebkitTransition: 'all 0.2s ease',
  }
}

/**
 * Check JavaScript API compatibility for Edge
 */
export const checkEdgeJSCompatibility = (): boolean => {
  const requiredAPIs = [
    'Array.prototype.includes',
    'Object.assign',
    'Promise',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
  ]

  return requiredAPIs.every((api) => {
    const parts = api.split('.')
    let obj: any = window

    for (const part of parts) {
      if (part === 'prototype') continue
      obj = obj?.[part]
      if (obj === undefined) return false
    }

    return typeof obj === 'function' || typeof obj === 'object'
  })
}

/**
 * Get responsive breakpoint behavior for Edge
 */
export const getEdgeResponsiveConfig = () => {
  return {
    // Edge-compatible media queries
    mobile: '(max-width: 768px)',
    tablet: '(min-width: 769px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)',

    // Ensure proper viewport meta tag for Edge
    viewportMeta: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
  }
}

/**
 * Edge-specific event handling utilities
 */
export const addEdgeCompatibleEventListener = (
  element: HTMLElement,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions,
) => {
  // Edge supports modern event listener syntax
  element.addEventListener(event, handler, options)
}

/**
 * Ensure proper focus behavior in Edge
 */
export const ensureEdgeFocusCompatibility = (element: HTMLElement) => {
  if (!isEdgeBrowser()) return

  // Edge-specific focus enhancements
  element.style.outline = 'none'
  element.style.border = '2px solid transparent'
  element.addEventListener('focus', () => {
    element.style.border = '2px solid #0078d4'
  })
  element.addEventListener('blur', () => {
    element.style.border = '2px solid transparent'
  })
}

/**
 * Performance optimization for Edge
 */
export const optimizeForEdge = () => {
  if (!isEdgeBrowser()) return

  // Prevent duplicate style injection
  if (document.querySelector('#edge-compat-styles')) return

  // Edge-specific performance optimizations
  const style = document.createElement('style')
  style.id = 'edge-compat-styles'
  style.textContent = `
    .edge-compatible {
      /* Improve rendering performance */
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
      -ms-transform: translateZ(0);

      /* Optimize animations */
      will-change: auto;
      -webkit-backface-visibility: hidden;
      -ms-backface-visibility: hidden;
      backface-visibility: hidden;
    }

    /* Fullscreen mode optimizations for Edge */
    .edge-compatible.fullscreen-mode {
      /* Ensure proper fullscreen behavior */
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
  `
  document.head.appendChild(style)
}
