/**
 * User Role Hook for Permission System
 * 
 * Provides convenient access to user role information and role-based
 * checking functions for the frontend permission system.
 */

'use client'

import { useMemo } from 'react'
import type { UserWithRole, UserRole, RoleName, PermissionHookReturn } from '@/types/user-role'
import { useAppContext } from '@/context/app-context'
import { useRoleContext } from '@/context/role-context'

export const useUserRole = (): PermissionHookReturn => {
  // Try to use role context first, fall back to app context
  let roleContext = null
  try {
    roleContext = useRoleContext()
  } catch {
    // Role context not available, use app context
  }

  const userProfile = useAppContext().userProfile as UserWithRole
  const isAuthenticated = roleContext?.isAuthenticated ?? !!userProfile
  const isLoading = roleContext?.isLoading ?? false

  const role: UserRole | null = useMemo(() => {
    return roleContext?.role || userProfile?.role || null
  }, [roleContext?.role, userProfile?.role])

  // Role checking functions
  const isAdmin = useMemo(() => {
    return role?.name === 'admin'
  }, [role])

  const isUser = useMemo(() => {
    return role?.name === 'user'
  }, [role])

  const hasRole = useMemo(() => {
    return (roleName: RoleName): boolean => {
      return role?.name === roleName
    }
  }, [role])

  const hasAnyRole = useMemo(() => {
    return (roleNames: RoleName[]): boolean => {
      return roleNames.includes(role?.name as RoleName)
    }
  }, [role])

  // Permission checking functions
  const canAccess = useMemo(() => {
    return (requiredRoles: RoleName[]): boolean => {
      if (!isAuthenticated || !role) return false
      
      // Admin has access to everything
      if (role.name === 'admin') return true
      
      // Check if user's role is in required roles
      return requiredRoles.includes(role.name)
    }
  }, [isAuthenticated, role])

  const canAccessRoute = useMemo(() => {
    return (routePath: string): boolean => {
      if (!isAuthenticated) {
        // Public routes (signin, signup) are accessible
        const publicRoutes = ['/signin', '/signup', '/']
        return publicRoutes.includes(routePath)
      }

      // Import route permissions dynamically to avoid circular dependency
      const { ROUTE_PERMISSIONS } = require('@/types/user-role')
      
      // Find matching route permission
      const routePermission = ROUTE_PERMISSIONS.find(
        (rp: any) => rp.path === routePath || 
        (rp.path.endsWith('/*') && routePath.startsWith(rp.path.slice(0, -2)))
      )

      if (!routePermission) {
        // If no specific permission defined, default to authenticated access
        return isAuthenticated
      }

      // Empty required roles means public access
      if (routePermission.requiredRoles.length === 0) {
        return true
      }

      return canAccess(routePermission.requiredRoles)
    }
  }, [isAuthenticated, canAccess])

  // Specific permission checks for common features
  const canAccessChat = useMemo(() => {
    return canAccess(['admin', 'user'])
  }, [canAccess])

  const canAccessKnowledgeBase = useMemo(() => {
    return canAccess(['admin', 'user'])
  }, [canAccess])

  const canAccessAdminPanel = useMemo(() => {
    return canAccess(['admin'])
  }, [canAccess])

  return {
    // Role information
    role,
    isAdmin,
    isUser,
    hasRole,
    hasAnyRole,
    
    // Permission checks
    canAccess,
    canAccessRoute,
    canAccessChat,
    canAccessKnowledgeBase,
    canAccessAdminPanel,
    
    // State
    isAuthenticated,
    isLoading,
  }
}

export default useUserRole