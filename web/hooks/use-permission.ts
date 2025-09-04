/**
 * Permission Hook for Route and Feature Access Control
 * 
 * Provides comprehensive permission checking capabilities for the
 * frontend permission system, including route-level access control.
 */

'use client'

import { useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { RoleName, RoutePermission, PermissionContext } from '@/types/user-role'
import { ROUTE_PERMISSIONS, ROLE_HIERARCHY, PERMISSION_ROLE_MAP } from '@/types/user-role'
import { useUserRole } from './use-user-role'

export const usePermission = () => {
  const router = useRouter()
  const pathname = usePathname()
  const userRoleHook = useUserRole()
  const { role, isAuthenticated, isLoading } = userRoleHook

  // Create permission context
  const permissionContext: PermissionContext = useMemo(() => ({
    user: role ? { 
      id: '', 
      email: '', 
      name: '', 
      role,
      status: 'active',
      created_at: '',
      last_active_at: ''
    } : null,
    role,
    permissions: role ? PERMISSION_ROLE_MAP.chat : [], // TODO: Expand permission mapping
    isAuthenticated,
    isLoading,
  }), [role, isAuthenticated, isLoading])

  // Enhanced role checking with hierarchy support
  const hasRoleWithHierarchy = useCallback((requiredRole: RoleName): boolean => {
    if (!role || !isAuthenticated) return false
    
    const userRoles = ROLE_HIERARCHY[role.name] || []
    return userRoles.includes(requiredRole)
  }, [role, isAuthenticated])

  // Check access to specific route with fallback handling
  const checkRouteAccess = useCallback((targetPath: string): {
    canAccess: boolean
    fallbackPath?: string
    reason?: string
  } => {
    // Handle unauthenticated users
    if (!isAuthenticated) {
      const publicRoutes = ['/signin', '/signup', '/']
      if (publicRoutes.includes(targetPath)) {
        return { canAccess: true }
      }
      return { 
        canAccess: false, 
        fallbackPath: '/signin',
        reason: 'Authentication required'
      }
    }

    // Find matching route permission (exact match first, then wildcard)
    let routePermission = ROUTE_PERMISSIONS.find(rp => rp.path === targetPath)
    
    if (!routePermission) {
      // Check for wildcard matches
      routePermission = ROUTE_PERMISSIONS.find(rp => {
        if (rp.path.endsWith('/*')) {
          const basePath = rp.path.slice(0, -2)
          return targetPath.startsWith(basePath)
        }
        return false
      })
    }

    // If no specific permission found, default to authenticated access
    if (!routePermission) {
      return { canAccess: isAuthenticated }
    }

    // Check if route allows public access
    if (routePermission.requiredRoles.length === 0) {
      return { canAccess: true }
    }

    // Check role-based access
    const hasAccess = routePermission.requiredRoles.some(requiredRole => 
      hasRoleWithHierarchy(requiredRole)
    )

    if (!hasAccess) {
      return {
        canAccess: false,
        fallbackPath: routePermission.fallbackPath || '/chat',
        reason: `Requires one of: ${routePermission.requiredRoles.join(', ')}`
      }
    }

    return { canAccess: true }
  }, [isAuthenticated, hasRoleWithHierarchy])

  // Navigate with permission checking
  const navigateWithPermissionCheck = useCallback((targetPath: string) => {
    const accessCheck = checkRouteAccess(targetPath)
    
    if (accessCheck.canAccess) {
      router.push(targetPath)
    } else if (accessCheck.fallbackPath) {
      console.warn(`Access denied to ${targetPath}: ${accessCheck.reason}. Redirecting to ${accessCheck.fallbackPath}`)
      router.push(accessCheck.fallbackPath)
    } else {
      console.error(`Access denied to ${targetPath}: ${accessCheck.reason}`)
    }
  }, [router, checkRouteAccess])

  // Check if current route is accessible
  const isCurrentRouteAccessible = useMemo(() => {
    return checkRouteAccess(pathname).canAccess
  }, [pathname, checkRouteAccess])

  // Get available routes for current user
  const getAccessibleRoutes = useCallback((): RoutePermission[] => {
    return ROUTE_PERMISSIONS.filter(routePermission => {
      return checkRouteAccess(routePermission.path).canAccess
    })
  }, [checkRouteAccess])

  // Permission utility functions
  const canAccessFeature = useCallback((feature: string): boolean => {
    const featureRoleMap: Record<string, RoleName[]> = {
      chat: ['admin', 'user'],
      datasets: ['admin', 'user'],
      explore: ['admin', 'user'],
      admin: ['admin'],
      workspace_settings: ['admin'],
      member_management: ['admin'],
    }

    const requiredRoles = featureRoleMap[feature]
    if (!requiredRoles) return isAuthenticated

    return requiredRoles.some(requiredRole => hasRoleWithHierarchy(requiredRole))
  }, [isAuthenticated, hasRoleWithHierarchy])

  // Combined return object with all permission utilities
  return {
    // Context
    permissionContext,
    
    // Role checking (delegate to useUserRole)
    ...userRoleHook,
    
    // Enhanced permission checking
    hasRoleWithHierarchy,
    checkRouteAccess,
    canAccessFeature,
    
    // Navigation utilities
    navigateWithPermissionCheck,
    isCurrentRouteAccessible,
    getAccessibleRoutes,
    
    // Current route info
    currentPath: pathname,
  }
}

export default usePermission