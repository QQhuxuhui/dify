/**
 * Route Guard Component
 * 
 * Provides client-side route protection and automatic redirects.
 * Works in conjunction with middleware for comprehensive route security.
 */

'use client'

import { useEffect, useState, type FC, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePermission } from '@/hooks/use-permission'
import Loading from '@/app/components/base/loading'

export interface RouteGuardProps {
  children: ReactNode
  fallbackComponent?: ReactNode
  loadingComponent?: ReactNode
}

/**
 * RouteGuard - Client-side route protection component
 * 
 * Automatically redirects users who don't have permission to access
 * the current route. Should be used in layout components.
 */
const RouteGuard: FC<RouteGuardProps> = ({
  children,
  fallbackComponent,
  loadingComponent,
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const { checkRouteAccess, isLoading } = usePermission()
  const [isValidating, setIsValidating] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const validateRouteAccess = async () => {
      setIsValidating(true)
      
      try {
        const accessCheck = checkRouteAccess(pathname)
        
        if (accessCheck.canAccess) {
          setHasAccess(true)
        } else {
          setHasAccess(false)
          
          // Redirect to fallback path if available
          if (accessCheck.fallbackPath) {
            console.warn(`Access denied to ${pathname}: ${accessCheck.reason}`)
            
            // Add query parameters for user feedback
            const redirectUrl = new URL(accessCheck.fallbackPath, window.location.origin)
            redirectUrl.searchParams.set('redirect_reason', 'permission_denied')
            redirectUrl.searchParams.set('attempted_path', pathname)
            
            router.replace(redirectUrl.pathname + redirectUrl.search)
            return
          }
        }
      } catch (error) {
        console.error('Route validation error:', error)
        setHasAccess(false)
      } finally {
        setIsValidating(false)
      }
    }

    // Skip validation during initial loading
    if (!isLoading) {
      validateRouteAccess()
    }
  }, [pathname, checkRouteAccess, router, isLoading])

  // Show loading state during validation
  if (isLoading || isValidating) {
    return loadingComponent || <Loading type="app" />
  }

  // Show fallback if access is denied and no redirect occurred
  if (!hasAccess) {
    return (
      fallbackComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    )
  }

  // Access granted - render children
  return <>{children}</>
}

export default RouteGuard