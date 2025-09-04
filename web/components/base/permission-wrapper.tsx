/**
 * Permission Wrapper Component
 * 
 * Provides declarative permission-based rendering for React components.
 * Supports role-based access control with fallback UI options.
 */

'use client'

import type { FC, ReactNode } from 'react'
import type { RoleName } from '@/types/user-role'
import { usePermission } from '@/hooks/use-permission'

export interface PermissionWrapperProps {
  children: ReactNode
  requiredRoles?: RoleName[]
  requiresAuthentication?: boolean
  fallback?: ReactNode
  showFallback?: boolean
  feature?: string
  className?: string
}

/**
 * PermissionWrapper - Conditionally renders children based on user permissions
 * 
 * @param children - Content to render when permission check passes
 * @param requiredRoles - Array of roles that can access this content
 * @param requiresAuthentication - Whether authentication is required (default: true if requiredRoles specified)
 * @param fallback - Component to render when permission check fails
 * @param showFallback - Whether to show fallback or hide completely (default: false)
 * @param feature - Specific feature name to check access for
 * @param className - CSS classes to apply to wrapper
 */
const PermissionWrapper: FC<PermissionWrapperProps> = ({
  children,
  requiredRoles = [],
  requiresAuthentication,
  fallback = null,
  showFallback = false,
  feature,
  className,
}) => {
  const { 
    canAccess, 
    canAccessFeature, 
    isAuthenticated, 
    isLoading 
  } = usePermission()

  // Determine authentication requirement
  const needsAuth = requiresAuthentication ?? (requiredRoles.length > 0)

  // Show loading state during authentication check
  if (isLoading) {
    return (
      <div className={`permission-wrapper ${className || ''}`}>
        {fallback || <div className="text-gray-400">Loading...</div>}
      </div>
    )
  }

  // Check authentication requirement
  if (needsAuth && !isAuthenticated) {
    return showFallback ? (
      <div className={`permission-wrapper ${className || ''}`}>
        {fallback}
      </div>
    ) : null
  }

  // Check feature-specific access
  if (feature && !canAccessFeature(feature)) {
    return showFallback ? (
      <div className={`permission-wrapper ${className || ''}`}>
        {fallback}
      </div>
    ) : null
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !canAccess(requiredRoles)) {
    return showFallback ? (
      <div className={`permission-wrapper ${className || ''}`}>
        {fallback}
      </div>
    ) : null
  }

  // Permission check passed - render children
  return (
    <div className={`permission-wrapper ${className || ''}`}>
      {children}
    </div>
  )
}

export default PermissionWrapper