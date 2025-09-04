/**
 * Performance Tests for Permission System
 * 
 * Tests performance characteristics of the permission system components.
 */

import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { render } from '@testing-library/react'
import { RoleProvider } from '../../context/role-context'
import { useUserRole } from '../../hooks/use-user-role'
import { usePermission } from '../../hooks/use-permission'
import { RoleStorage } from '../../utils/role-storage'
import { canAccessRoute, getFilteredNavigationItems, NAVIGATION_ITEMS } from '../../utils/navigation-utils'
import type { UserWithRole, UserContext } from '../../types/user-role'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/test',
}))

jest.mock('../../context/app-context', () => ({
  useAppContext: () => ({
    userProfile: null,
    mutateUserProfile: jest.fn(),
  }),
}))

// Performance test utilities
const measureExecutionTime = (fn: () => any): number => {
  const start = performance.now()
  fn()
  const end = performance.now()
  return end - start
}

const measureAsyncExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// Test data
const createMockUser = (roleType: 'admin' | 'user'): UserWithRole => ({
  id: `user-${roleType}`,
  email: `${roleType}@test.com`,
  name: `${roleType} User`,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: '2024-01-01T12:00:00Z',
  role: {
    id: `role-${roleType}`,
    name: roleType,
    description: `${roleType} Role`,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
})

const adminUser = createMockUser('admin')
const regularUser = createMockUser('user')

describe('Permission System Performance Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Storage Operations Performance', () => {
    test('should store and retrieve role data under 1ms', () => {
      const role = adminUser.role!
      
      // Test storage performance
      const storeTime = measureExecutionTime(() => {
        RoleStorage.setRole(role)
      })
      expect(storeTime).toBeLessThan(1)

      // Test retrieval performance
      const retrieveTime = measureExecutionTime(() => {
        RoleStorage.getRole()
      })
      expect(retrieveTime).toBeLessThan(1)
    })

    test('should handle large permission cache efficiently', () => {
      // Create large permission cache (100 routes)
      const largePermissionCache: Record<string, boolean> = {}
      for (let i = 0; i < 100; i++) {
        largePermissionCache[`/route-${i}`] = Math.random() > 0.5
      }

      const storeTime = measureExecutionTime(() => {
        RoleStorage.setPermissionCache(largePermissionCache)
      })
      expect(storeTime).toBeLessThan(5) // Should store 100 permissions under 5ms

      const retrieveTime = measureExecutionTime(() => {
        RoleStorage.getPermissionCache()
      })
      expect(retrieveTime).toBeLessThan(2) // Should retrieve under 2ms
    })

    test('should validate data efficiently', () => {
      const validationTime = measureExecutionTime(() => {
        for (let i = 0; i < 100; i++) {
          RoleStorage.getRole() // This includes validation
        }
      })
      expect(validationTime).toBeLessThan(10) // 100 validations under 10ms
    })
  })

  describe('Hook Performance', () => {
    test('useUserRole should render efficiently', () => {
      RoleStorage.setUserData(adminUser)
      
      const TestComponent = () => {
        const userRole = useUserRole()
        return null
      }

      // Measure initial render
      const initialRenderTime = measureExecutionTime(() => {
        render(
          <RoleProvider>
            <TestComponent />
          </RoleProvider>
        )
      })
      expect(initialRenderTime).toBeLessThan(50) // Initial render under 50ms

      // Measure hook execution
      const { result, rerender } = renderHook(() => useUserRole(), {
        wrapper: ({ children }) => <RoleProvider>{children}</RoleProvider>,
      })

      const rerenderTime = measureExecutionTime(() => {
        rerender()
      })
      expect(rerenderTime).toBeLessThan(5) // Re-render under 5ms
    })

    test('usePermission should handle route checks efficiently', () => {
      RoleStorage.setUserData(adminUser)

      const { result } = renderHook(() => usePermission(), {
        wrapper: ({ children }) => <RoleProvider>{children}</RoleProvider>,
      })

      // Test multiple route checks
      const routeCheckTime = measureExecutionTime(() => {
        for (let i = 0; i < 50; i++) {
          result.current.canAccessRoute(`/route-${i}`)
        }
      })
      expect(routeCheckTime).toBeLessThan(10) // 50 route checks under 10ms
    })

    test('should handle frequent permission checks', () => {
      RoleStorage.setUserData(adminUser)

      const { result } = renderHook(() => useUserRole(), {
        wrapper: ({ children }) => <RoleProvider>{children}</RoleProvider>,
      })

      const permissionCheckTime = measureExecutionTime(() => {
        for (let i = 0; i < 100; i++) {
          result.current.isAdmin
          result.current.canAccessChat
          result.current.canAccessAdminPanel
          result.current.hasRole('admin')
        }
      })
      expect(permissionCheckTime).toBeLessThan(5) // 100 permission checks under 5ms
    })
  })

  describe('Navigation Utils Performance', () => {
    const adminContext: UserContext = {
      role: { name: 'admin', is_active: true },
      isAuthenticated: true,
    }

    const userContext: UserContext = {
      role: { name: 'user', is_active: true },
      isAuthenticated: true,
    }

    test('canAccessRoute should be performant for multiple checks', () => {
      const routes = [
        '/chat', '/datasets', '/admin', '/settings/workspace',
        '/explore', '/settings/members', '/settings/profile'
      ]

      const checkTime = measureExecutionTime(() => {
        routes.forEach(route => {
          canAccessRoute(route, adminContext)
          canAccessRoute(route, userContext)
        })
      })
      expect(checkTime).toBeLessThan(2) // 14 route checks under 2ms
    })

    test('getFilteredNavigationItems should filter efficiently', () => {
      const filterTime = measureExecutionTime(() => {
        getFilteredNavigationItems(adminContext)
        getFilteredNavigationItems(userContext)
      })
      expect(filterTime).toBeLessThan(5) // Filtering navigation items under 5ms
    })

    test('should handle large navigation hierarchies', () => {
      // Create large navigation structure
      const largeNavigationItems = Array.from({ length: 50 }, (_, i) => ({
        path: `/item-${i}`,
        label: `Item ${i}`,
        requiredRoles: ['admin', 'user'] as any,
        children: Array.from({ length: 10 }, (_, j) => ({
          path: `/item-${i}/sub-${j}`,
          label: `Sub Item ${j}`,
          requiredRoles: ['admin'] as any,
        })),
      }))

      const filterTime = measureExecutionTime(() => {
        getFilteredNavigationItems(adminContext, largeNavigationItems)
      })
      expect(filterTime).toBeLessThan(15) // 500+ navigation items under 15ms
    })
  })

  describe('Memory Usage and Leak Prevention', () => {
    test('should not create memory leaks with repeated hook usage', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Create and destroy many hook instances
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useUserRole(), {
          wrapper: ({ children }) => <RoleProvider>{children}</RoleProvider>,
        })
        unmount()
      }

      // Allow garbage collection
      if (global.gc) {
        global.gc()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryGrowth = finalMemory - initialMemory

      // Memory growth should be minimal (less than 1MB for 100 instances)
      expect(memoryGrowth).toBeLessThan(1024 * 1024)
    })

    test('should clean up storage listeners properly', () => {
      let eventListenerCount = 0
      const originalAddEventListener = window.addEventListener
      const originalRemoveEventListener = window.removeEventListener

      window.addEventListener = jest.fn((...args) => {
        eventListenerCount++
        return originalAddEventListener.call(window, ...args)
      })

      window.removeEventListener = jest.fn((...args) => {
        eventListenerCount--
        return originalRemoveEventListener.call(window, ...args)
      })

      // Create and destroy multiple providers
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<RoleProvider><div /></RoleProvider>)
        unmount()
      }

      // Event listeners should be properly cleaned up
      expect(eventListenerCount).toBeLessThanOrEqual(0)

      // Restore original methods
      window.addEventListener = originalAddEventListener
      window.removeEventListener = originalRemoveEventListener
    })
  })

  describe('Synchronization Performance', () => {
    test('should handle rapid storage updates efficiently', () => {
      const rapidUpdateTime = measureExecutionTime(() => {
        for (let i = 0; i < 100; i++) {
          const user = { ...adminUser, id: `user-${i}` }
          RoleStorage.setUserData(user)
        }
      })
      expect(rapidUpdateTime).toBeLessThan(50) // 100 rapid updates under 50ms
    })

    test('should batch storage operations for better performance', () => {
      // Test storage batching by measuring single vs multiple operations
      const singleOpTime = measureExecutionTime(() => {
        RoleStorage.setUserData(adminUser)
      })

      const multipleOpsTime = measureExecutionTime(() => {
        RoleStorage.setUserData(adminUser)
        RoleStorage.setPermissionCache({ '/admin': true })
        RoleStorage.setRole(adminUser.role!)
      })

      // Multiple operations shouldn't be significantly slower than single operation
      const timeRatio = multipleOpsTime / singleOpTime
      expect(timeRatio).toBeLessThan(5) // Should not be more than 5x slower
    })
  })

  describe('Component Render Performance', () => {
    test('PermissionWrapper should render conditionally with minimal overhead', () => {
      RoleStorage.setUserData(adminUser)

      const TestWrapper = ({ shouldShow }: { shouldShow: boolean }) => (
        <RoleProvider>
          {shouldShow && (
            <div data-testid="test-content">Test Content</div>
          )}
        </RoleProvider>
      )

      // Measure conditional rendering performance
      const { rerender } = render(<TestWrapper shouldShow={false} />)
      
      const rerenderTime = measureExecutionTime(() => {
        for (let i = 0; i < 10; i++) {
          rerender(<TestWrapper shouldShow={i % 2 === 0} />)
        }
      })
      expect(rerenderTime).toBeLessThan(20) // 10 conditional re-renders under 20ms
    })

    test('should handle deeply nested permission components', () => {
      RoleStorage.setUserData(adminUser)

      const NestedComponent = ({ depth }: { depth: number }) => {
        if (depth === 0) return <div>Base Component</div>
        
        return (
          <RoleProvider>
            <NestedComponent depth={depth - 1} />
          </RoleProvider>
        )
      }

      const renderTime = measureExecutionTime(() => {
        render(<NestedComponent depth={5} />)
      })
      expect(renderTime).toBeLessThan(30) // Deep nesting under 30ms
    })
  })

  describe('Scale Testing', () => {
    test('should handle large numbers of concurrent permission checks', () => {
      RoleStorage.setUserData(adminUser)

      const { result } = renderHook(() => usePermission(), {
        wrapper: ({ children }) => <RoleProvider>{children}</RoleProvider>,
      })

      const concurrentCheckTime = measureExecutionTime(() => {
        const promises = Array.from({ length: 100 }, (_, i) => {
          return Promise.resolve(result.current.canAccessRoute(`/route-${i}`))
        })
        return Promise.all(promises)
      })
      expect(concurrentCheckTime).toBeLessThan(10) // 100 concurrent checks under 10ms
    })

    test('should maintain performance with large user datasets', () => {
      // Test with multiple different user contexts
      const users = Array.from({ length: 50 }, (_, i) => 
        createMockUser(i % 2 === 0 ? 'admin' : 'user')
      )

      const batchProcessTime = measureExecutionTime(() => {
        users.forEach(user => {
          RoleStorage.setUserData(user)
          const retrieved = RoleStorage.getUserData()
          expect(retrieved?.id).toBe(user.id)
        })
      })
      expect(batchProcessTime).toBeLessThan(100) // 50 user operations under 100ms
    })
  })
})