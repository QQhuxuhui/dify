/**
 * Higher-Order Component for Permission-Based Access Control
 * 
 * Provides a HOC wrapper for pages and components that require
 * specific role-based permissions.
 */

'use client'

import { type ComponentType, type FC } from 'react'
import type { RoleName } from '@/types/user-role'
import PermissionWrapper from './permission-wrapper'

export interface WithPermissionOptions {
  requiredRoles?: RoleName[]
  requiresAuthentication?: boolean
  feature?: string
  fallback?: ComponentType
  showFallback?: boolean
  redirectTo?: string
}

/**
 * HOC that wraps a component with permission checking
 * 
 * @param WrappedComponent - The component to protect
 * @param options - Permission configuration options
 */
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPermissionOptions = {}
) {
  const {
    requiredRoles = [],
    requiresAuthentication,
    feature,
    fallback: FallbackComponent,
    showFallback = false,
    redirectTo,
  } = options

  const PermissionProtectedComponent: FC<P> = (props) => {
    // Create fallback element
    const fallbackElement = FallbackComponent ? <FallbackComponent /> : (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {requiredRoles.length > 0
              ? `Requires ${requiredRoles.join(' or ')} role`
              : 'Authentication required'
            }
          </p>
          {redirectTo && (
            <a
              href={redirectTo}
              className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign In
            </a>
          )}
        </div>
      </div>
    )

    return (
      <PermissionWrapper
        requiredRoles={requiredRoles}
        requiresAuthentication={requiresAuthentication}
        feature={feature}
        fallback={fallbackElement}
        showFallback={showFallback}
      >
        <WrappedComponent {...props} />
      </PermissionWrapper>
    )
  }

  // Set display name for debugging
  PermissionProtectedComponent.displayName = `withPermission(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`

  return PermissionProtectedComponent
}

// Convenience HOCs for common permission patterns
export const withAdminOnly = <P extends object>(component: ComponentType<P>) =>
  withPermission(component, { requiredRoles: ['admin'] })

export const withAuthRequired = <P extends object>(component: ComponentType<P>) =>
  withPermission(component, { requiresAuthentication: true })

export const withUserOrAdmin = <P extends object>(component: ComponentType<P>) =>
  withPermission(component, { requiredRoles: ['admin', 'user'] })

// HOC with redirect for unauthenticated users
export const withAuthRedirect = <P extends object>(
  component: ComponentType<P>,
  redirectTo: string = '/signin'
) =>
  withPermission(component, { 
    requiresAuthentication: true,
    redirectTo,
    showFallback: true
  })

export default withPermission