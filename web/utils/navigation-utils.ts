/**
 * Navigation Utilities with Permission Checking
 * 
 * Provides utility functions for navigation that automatically
 * check permissions and handle redirects appropriately.
 */

import type { RoleName } from '@/types/user-role'
import { ROUTE_PERMISSIONS, ROLE_HIERARCHY } from '@/types/user-role'

// Types for navigation utilities
export interface NavigationOptions {
  replace?: boolean
  checkPermission?: boolean
  fallbackPath?: string
  forceNavigation?: boolean
}

export interface UserContext {
  role: {
    name: RoleName
    is_active: boolean
  } | null
  isAuthenticated: boolean
}

/**
 * Check if user has permission to access a route
 */
export function canAccessRoute(
  path: string, 
  userContext: UserContext
): { allowed: boolean; fallbackPath?: string; reason?: string } {
  // Public routes
  const publicRoutes = ['/signin', '/signup', '/']
  if (publicRoutes.includes(path)) {
    return { allowed: true }
  }

  // Check authentication
  if (!userContext.isAuthenticated || !userContext.role) {
    return {
      allowed: false,
      fallbackPath: '/signin',
      reason: 'Authentication required'
    }
  }

  // Find route permission
  let routePermission = ROUTE_PERMISSIONS.find(rp => rp.path === path)
  
  if (!routePermission) {
    // Check wildcard matches
    routePermission = ROUTE_PERMISSIONS.find(rp => {
      if (rp.path.endsWith('/*')) {
        const basePath = rp.path.slice(0, -2)
        return path.startsWith(basePath)
      }
      return false
    })
  }

  // Default to authenticated access if no specific permission
  if (!routePermission) {
    return { allowed: true }
  }

  // Check role requirements
  if (routePermission.requiredRoles.length === 0) {
    return { allowed: true }
  }

  const userRole = userContext.role.name
  const userRoles = ROLE_HIERARCHY[userRole] || [userRole]
  
  const hasAccess = routePermission.requiredRoles.some(requiredRole =>
    userRoles.includes(requiredRole)
  )

  if (!hasAccess) {
    return {
      allowed: false,
      fallbackPath: routePermission.fallbackPath || '/chat',
      reason: `Requires one of: ${routePermission.requiredRoles.join(', ')}`
    }
  }

  return { allowed: true }
}

/**
 * Get all accessible routes for a user
 */
export function getAccessibleRoutes(userContext: UserContext): string[] {
  return ROUTE_PERMISSIONS
    .filter(routePermission => {
      const check = canAccessRoute(routePermission.path, userContext)
      return check.allowed
    })
    .map(routePermission => routePermission.path)
}

/**
 * Get navigation menu items based on user permissions
 */
export interface NavigationItem {
  path: string
  label: string
  icon?: string
  requiredRoles: RoleName[]
  children?: NavigationItem[]
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    path: '/chat',
    label: 'Chat',
    icon: '💬',
    requiredRoles: ['admin', 'user'],
  },
  {
    path: '/datasets',
    label: 'Knowledge Base',
    icon: '📚',
    requiredRoles: ['admin', 'user'],
  },
  {
    path: '/explore',
    label: 'Explore',
    icon: '🔍',
    requiredRoles: ['admin', 'user'],
  },
  {
    path: '/admin',
    label: 'Administration',
    icon: '⚙️',
    requiredRoles: ['admin'],
    children: [
      {
        path: '/admin/users',
        label: 'User Management',
        requiredRoles: ['admin'],
      },
      {
        path: '/admin/settings',
        label: 'System Settings',
        requiredRoles: ['admin'],
      },
    ],
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: '🔧',
    requiredRoles: ['admin', 'user'],
    children: [
      {
        path: '/settings/profile',
        label: 'Profile',
        requiredRoles: ['admin', 'user'],
      },
      {
        path: '/settings/workspace',
        label: 'Workspace',
        requiredRoles: ['admin'],
      },
      {
        path: '/settings/members',
        label: 'Members',
        requiredRoles: ['admin'],
      },
    ],
  },
]

/**
 * Filter navigation items based on user permissions
 */
export function getFilteredNavigationItems(
  userContext: UserContext,
  items: NavigationItem[] = NAVIGATION_ITEMS
): NavigationItem[] {
  return items
    .filter(item => {
      const check = canAccessRoute(item.path, userContext)
      return check.allowed
    })
    .map(item => ({
      ...item,
      children: item.children 
        ? getFilteredNavigationItems(userContext, item.children)
        : undefined,
    }))
    .filter(item => !item.children || item.children.length > 0)
}

/**
 * Safe navigation function that checks permissions
 */
export function safeNavigate(
  path: string,
  userContext: UserContext,
  router: { push: (path: string) => void; replace: (path: string) => void },
  options: NavigationOptions = {}
): boolean {
  const {
    replace = false,
    checkPermission = true,
    fallbackPath,
    forceNavigation = false,
  } = options

  if (!checkPermission || forceNavigation) {
    if (replace) {
      router.replace(path)
    } else {
      router.push(path)
    }
    return true
  }

  const accessCheck = canAccessRoute(path, userContext)

  if (accessCheck.allowed) {
    if (replace) {
      router.replace(path)
    } else {
      router.push(path)
    }
    return true
  } else {
    // Navigate to fallback path
    const redirectPath = fallbackPath || accessCheck.fallbackPath || '/signin'
    console.warn(`Access denied to ${path}: ${accessCheck.reason}. Redirecting to ${redirectPath}`)
    
    if (replace) {
      router.replace(redirectPath)
    } else {
      router.push(redirectPath)
    }
    return false
  }
}

/**
 * Generate breadcrumb items with permission checking
 */
export interface BreadcrumbItem {
  label: string
  path?: string
  isCurrentPage?: boolean
}

export function generateBreadcrumbs(
  currentPath: string,
  userContext: UserContext
): BreadcrumbItem[] {
  const pathSegments = currentPath.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' }
  ]

  let currentPathBuild = ''
  
  for (let i = 0; i < pathSegments.length; i++) {
    currentPathBuild += `/${pathSegments[i]}`
    const isLastSegment = i === pathSegments.length - 1
    
    // Find navigation item for this path
    const findNavItem = (items: NavigationItem[]): NavigationItem | undefined => {
      for (const item of items) {
        if (item.path === currentPathBuild) {
          return item
        }
        if (item.children) {
          const childItem = findNavItem(item.children)
          if (childItem) return childItem
        }
      }
      return undefined
    }

    const navItem = findNavItem(NAVIGATION_ITEMS)
    const label = navItem?.label || pathSegments[i].charAt(0).toUpperCase() + pathSegments[i].slice(1)

    // Check if user can access this path
    const accessCheck = canAccessRoute(currentPathBuild, userContext)

    breadcrumbs.push({
      label,
      path: accessCheck.allowed && !isLastSegment ? currentPathBuild : undefined,
      isCurrentPage: isLastSegment,
    })
  }

  return breadcrumbs
}

export default {
  canAccessRoute,
  getAccessibleRoutes,
  getFilteredNavigationItems,
  safeNavigate,
  generateBreadcrumbs,
  NAVIGATION_ITEMS,
}