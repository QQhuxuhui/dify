/**
 * Unit Tests for Navigation Utilities
 * 
 * Tests permission-based navigation, route access checking, and utility functions.
 */

import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import {
  canAccessRoute,
  getAccessibleRoutes,
  getFilteredNavigationItems,
  safeNavigate,
  generateBreadcrumbs,
  NAVIGATION_ITEMS,
} from '../../utils/navigation-utils'
import type { UserContext, NavigationItem } from '../../utils/navigation-utils'

// Mock router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
}

// Test user contexts
const adminContext: UserContext = {
  role: {
    name: 'admin',
    is_active: true,
  },
  isAuthenticated: true,
}

const userContext: UserContext = {
  role: {
    name: 'user',
    is_active: true,
  },
  isAuthenticated: true,
}

const unauthenticatedContext: UserContext = {
  role: null,
  isAuthenticated: false,
}

describe('Navigation Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('canAccessRoute', () => {
    test('should allow public routes for everyone', () => {
      const publicRoutes = ['/signin', '/signup', '/']
      
      publicRoutes.forEach(route => {
        expect(canAccessRoute(route, adminContext).allowed).toBe(true)
        expect(canAccessRoute(route, userContext).allowed).toBe(true)
        expect(canAccessRoute(route, unauthenticatedContext).allowed).toBe(true)
      })
    })

    test('should deny private routes for unauthenticated users', () => {
      const privateRoutes = ['/chat', '/datasets', '/admin']
      
      privateRoutes.forEach(route => {
        const result = canAccessRoute(route, unauthenticatedContext)
        expect(result.allowed).toBe(false)
        expect(result.fallbackPath).toBe('/signin')
        expect(result.reason).toBe('Authentication required')
      })
    })

    test('should allow admin access to all routes', () => {
      const routes = ['/chat', '/datasets', '/admin', '/settings/workspace']
      
      routes.forEach(route => {
        const result = canAccessRoute(route, adminContext)
        expect(result.allowed).toBe(true)
      })
    })

    test('should restrict admin-only routes from regular users', () => {
      const adminOnlyRoutes = ['/admin', '/settings/workspace', '/settings/members']
      
      adminOnlyRoutes.forEach(route => {
        const result = canAccessRoute(route, userContext)
        expect(result.allowed).toBe(false)
        expect(result.fallbackPath).toBe('/chat')
        expect(result.reason).toContain('admin')
      })
    })

    test('should allow user routes for both admin and user', () => {
      const userRoutes = ['/chat', '/datasets', '/explore']
      
      userRoutes.forEach(route => {
        expect(canAccessRoute(route, adminContext).allowed).toBe(true)
        expect(canAccessRoute(route, userContext).allowed).toBe(true)
      })
    })

    test('should handle wildcard routes', () => {
      // Test admin/* pattern
      expect(canAccessRoute('/admin/users', adminContext).allowed).toBe(true)
      expect(canAccessRoute('/admin/settings', adminContext).allowed).toBe(true)
      expect(canAccessRoute('/admin/dashboard', adminContext).allowed).toBe(true)
      
      expect(canAccessRoute('/admin/users', userContext).allowed).toBe(false)
      expect(canAccessRoute('/admin/settings', userContext).allowed).toBe(false)
    })

    test('should default to authenticated access for undefined routes', () => {
      const undefinedRoute = '/some/custom/route'
      
      expect(canAccessRoute(undefinedRoute, adminContext).allowed).toBe(true)
      expect(canAccessRoute(undefinedRoute, userContext).allowed).toBe(true)
      expect(canAccessRoute(undefinedRoute, unauthenticatedContext).allowed).toBe(false)
    })
  })

  describe('getAccessibleRoutes', () => {
    test('should return accessible routes for admin', () => {
      const accessibleRoutes = getAccessibleRoutes(adminContext)
      
      expect(accessibleRoutes).toContain('/chat')
      expect(accessibleRoutes).toContain('/datasets')
      expect(accessibleRoutes).toContain('/admin')
      expect(accessibleRoutes).toContain('/settings/workspace')
    })

    test('should return limited routes for regular user', () => {
      const accessibleRoutes = getAccessibleRoutes(userContext)
      
      expect(accessibleRoutes).toContain('/chat')
      expect(accessibleRoutes).toContain('/datasets')
      expect(accessibleRoutes).not.toContain('/admin')
      expect(accessibleRoutes).not.toContain('/settings/workspace')
    })

    test('should return only public routes for unauthenticated user', () => {
      const accessibleRoutes = getAccessibleRoutes(unauthenticatedContext)
      
      expect(accessibleRoutes).toContain('/signin')
      expect(accessibleRoutes).toContain('/signup')
      expect(accessibleRoutes).not.toContain('/chat')
      expect(accessibleRoutes).not.toContain('/admin')
    })
  })

  describe('getFilteredNavigationItems', () => {
    test('should filter navigation items for admin', () => {
      const filteredItems = getFilteredNavigationItems(adminContext)
      
      // Should include all items for admin
      const paths = filteredItems.map(item => item.path)
      expect(paths).toContain('/chat')
      expect(paths).toContain('/datasets')
      expect(paths).toContain('/admin')
    })

    test('should filter navigation items for regular user', () => {
      const filteredItems = getFilteredNavigationItems(userContext)
      
      const paths = filteredItems.map(item => item.path)
      expect(paths).toContain('/chat')
      expect(paths).toContain('/datasets')
      expect(paths).not.toContain('/admin')
    })

    test('should filter child navigation items', () => {
      const filteredItems = getFilteredNavigationItems(adminContext)
      
      const adminItem = filteredItems.find(item => item.path === '/admin')
      expect(adminItem?.children).toBeDefined()
      expect(adminItem?.children?.length).toBeGreaterThan(0)
      
      const settingsItem = filteredItems.find(item => item.path === '/settings')
      const workspaceChild = settingsItem?.children?.find(child => child.path === '/settings/workspace')
      expect(workspaceChild).toBeDefined()
    })

    test('should remove parent items with no accessible children', () => {
      const filteredItems = getFilteredNavigationItems(userContext)
      
      const settingsItem = filteredItems.find(item => item.path === '/settings')
      if (settingsItem?.children) {
        // Should not include admin-only children
        const workspaceChild = settingsItem.children.find(child => child.path === '/settings/workspace')
        expect(workspaceChild).toBeUndefined()
      }
    })
  })

  describe('safeNavigate', () => {
    test('should navigate when access is allowed', () => {
      const result = safeNavigate('/chat', userContext, mockRouter)
      
      expect(result).toBe(true)
      expect(mockRouter.push).toHaveBeenCalledWith('/chat')
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    test('should redirect to fallback when access is denied', () => {
      const result = safeNavigate('/admin', userContext, mockRouter)
      
      expect(result).toBe(false)
      expect(mockRouter.push).toHaveBeenCalledWith('/chat')
    })

    test('should use replace instead of push when specified', () => {
      safeNavigate('/chat', userContext, mockRouter, { replace: true })
      
      expect(mockRouter.replace).toHaveBeenCalledWith('/chat')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    test('should skip permission check when forceNavigation is true', () => {
      const result = safeNavigate('/admin', userContext, mockRouter, { 
        forceNavigation: true 
      })
      
      expect(result).toBe(true)
      expect(mockRouter.push).toHaveBeenCalledWith('/admin')
    })

    test('should use custom fallback path', () => {
      safeNavigate('/admin', userContext, mockRouter, { 
        fallbackPath: '/custom-fallback'
      })
      
      expect(mockRouter.push).toHaveBeenCalledWith('/custom-fallback')
    })

    test('should skip permission check when checkPermission is false', () => {
      const result = safeNavigate('/admin', userContext, mockRouter, { 
        checkPermission: false 
      })
      
      expect(result).toBe(true)
      expect(mockRouter.push).toHaveBeenCalledWith('/admin')
    })

    test('should redirect unauthenticated users to signin', () => {
      safeNavigate('/chat', unauthenticatedContext, mockRouter)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/signin')
    })
  })

  describe('generateBreadcrumbs', () => {
    test('should generate breadcrumbs for simple path', () => {
      const breadcrumbs = generateBreadcrumbs('/chat', userContext)
      
      expect(breadcrumbs).toHaveLength(2)
      expect(breadcrumbs[0]).toEqual({ label: 'Home', path: '/' })
      expect(breadcrumbs[1]).toEqual({ 
        label: 'Chat', 
        path: undefined, 
        isCurrentPage: true 
      })
    })

    test('should generate breadcrumbs for nested path', () => {
      const breadcrumbs = generateBreadcrumbs('/admin/users', adminContext)
      
      expect(breadcrumbs).toHaveLength(3)
      expect(breadcrumbs[0]).toEqual({ label: 'Home', path: '/' })
      expect(breadcrumbs[1]).toEqual({ label: 'Administration', path: '/admin' })
      expect(breadcrumbs[2]).toEqual({ 
        label: 'Users', 
        path: undefined, 
        isCurrentPage: true 
      })
    })

    test('should handle permissions in breadcrumbs', () => {
      // Regular user accessing admin path (should not have clickable admin link)
      const breadcrumbs = generateBreadcrumbs('/admin/users', userContext)
      
      expect(breadcrumbs[1].path).toBeUndefined() // Admin breadcrumb not clickable
    })

    test('should use navigation item labels when available', () => {
      const breadcrumbs = generateBreadcrumbs('/settings/profile', userContext)
      
      const settingsCrumb = breadcrumbs.find(b => b.label === 'Settings')
      expect(settingsCrumb).toBeDefined()
    })

    test('should capitalize path segments when no navigation item found', () => {
      const breadcrumbs = generateBreadcrumbs('/custom/path', userContext)
      
      expect(breadcrumbs[1].label).toBe('Custom')
      expect(breadcrumbs[2].label).toBe('Path')
    })
  })

  describe('NAVIGATION_ITEMS constant', () => {
    test('should have required structure', () => {
      expect(Array.isArray(NAVIGATION_ITEMS)).toBe(true)
      expect(NAVIGATION_ITEMS.length).toBeGreaterThan(0)
      
      NAVIGATION_ITEMS.forEach(item => {
        expect(item).toHaveProperty('path')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('requiredRoles')
        expect(Array.isArray(item.requiredRoles)).toBe(true)
      })
    })

    test('should have admin navigation items', () => {
      const adminItem = NAVIGATION_ITEMS.find(item => item.path === '/admin')
      expect(adminItem).toBeDefined()
      expect(adminItem?.requiredRoles).toContain('admin')
    })

    test('should have user accessible items', () => {
      const chatItem = NAVIGATION_ITEMS.find(item => item.path === '/chat')
      expect(chatItem).toBeDefined()
      expect(chatItem?.requiredRoles).toContain('user')
      expect(chatItem?.requiredRoles).toContain('admin')
    })

    test('should have nested navigation items', () => {
      const settingsItem = NAVIGATION_ITEMS.find(item => item.path === '/settings')
      expect(settingsItem?.children).toBeDefined()
      expect(settingsItem?.children?.length).toBeGreaterThan(0)
    })
  })
})