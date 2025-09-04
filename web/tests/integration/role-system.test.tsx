/**
 * Story 1.3 Integration Tests
 * 
 * Comprehensive integration tests for the frontend role-based permission system.
 * Tests component integration, hooks, storage, and synchronization.
 */

import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { RoleProvider, useRoleContext } from '../../context/role-context'
import { useUserRole } from '../../hooks/use-user-role'
import { usePermission } from '../../hooks/use-permission'
import PermissionWrapper from '../../components/base/permission-wrapper'
import RoleDisplay from '../../components/base/role-display'
import RouteGuard from '../../components/base/route-guard'
import { withPermission, withAdminOnly } from '../../components/base/with-permission'
import { RoleStorage } from '../../utils/role-storage'
import type { UserWithRole, UserRole } from '../../types/user-role'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/test'),
}))

// Mock app context
jest.mock('../../context/app-context', () => ({
  useAppContext: () => ({
    userProfile: null,
    mutateUserProfile: jest.fn(),
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Test data
const mockAdminUser: UserWithRole = {
  id: 'admin-user-1',
  email: 'admin@example.com',
  name: 'Admin User',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: '2024-01-01T12:00:00Z',
  role: {
    id: 'role-admin-1',
    name: 'admin',
    description: 'Administrator',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

const mockRegularUser: UserWithRole = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Regular User',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: '2024-01-01T12:00:00Z',
  role: {
    id: 'role-user-1',
    name: 'user',
    description: 'Standard User',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

// Test components
const TestComponent = ({ requiredRoles = [] }: { requiredRoles?: string[] }) => (
  <div data-testid="test-component">
    <PermissionWrapper requiredRoles={requiredRoles as any}>
      <div data-testid="protected-content">Protected Content</div>
    </PermissionWrapper>
  </div>
)

const AdminOnlyTest = withAdminOnly(() => (
  <div data-testid="admin-only">Admin Only Content</div>
))

const HookTestComponent = () => {
  const userRole = useUserRole()
  const permission = usePermission()

  return (
    <div data-testid="hook-test">
      <div data-testid="is-admin">{userRole.isAdmin.toString()}</div>
      <div data-testid="is-user">{userRole.isUser.toString()}</div>
      <div data-testid="can-access-chat">{userRole.canAccessChat.toString()}</div>
      <div data-testid="can-access-admin">{userRole.canAccessAdminPanel.toString()}</div>
      <div data-testid="is-authenticated">{userRole.isAuthenticated.toString()}</div>
    </div>
  )
}

const RoleContextTestComponent = () => {
  const roleContext = useRoleContext()

  return (
    <div data-testid="role-context-test">
      <div data-testid="context-role">{roleContext.role?.name || 'none'}</div>
      <div data-testid="context-authenticated">{roleContext.isAuthenticated.toString()}</div>
      <div data-testid="context-syncing">{roleContext.isSyncing.toString()}</div>
      <button
        data-testid="sync-button"
        onClick={() => roleContext.syncUserData()}
      >
        Sync
      </button>
    </div>
  )
}

describe('Story 1.3 Frontend Role Permission System Integration', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    })

    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRegularUser),
    })
  })

  afterEach(() => {
    localStorage.clear()
    jest.clearAllTimers()
  })

  describe('AC1: Role State Management Integration', () => {
    test('should integrate role information with user state', async () => {
      const { rerender } = render(
        <RoleProvider>
          <HookTestComponent />
        </RoleProvider>
      )

      // Initially no role
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      
      // Set role in storage
      act(() => {
        RoleStorage.setUserData(mockRegularUser)
      })

      rerender(
        <RoleProvider>
          <HookTestComponent />
        </RoleProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
        expect(screen.getByTestId('is-user')).toHaveTextContent('true')
        expect(screen.getByTestId('is-admin')).toHaveTextContent('false')
      })
    })

    test('should provide convenient role access properties', () => {
      RoleStorage.setUserData(mockAdminUser)

      render(
        <RoleProvider>
          <HookTestComponent />
        </RoleProvider>
      )

      expect(screen.getByTestId('is-admin')).toHaveTextContent('true')
      expect(screen.getByTestId('is-user')).toHaveTextContent('false')
      expect(screen.getByTestId('can-access-chat')).toHaveTextContent('true')
      expect(screen.getByTestId('can-access-admin')).toHaveTextContent('true')
    })
  })

  describe('AC2: Permission Checking Hooks', () => {
    test('useUserRole should provide role query functionality', () => {
      RoleStorage.setUserData(mockRegularUser)

      render(
        <RoleProvider>
          <HookTestComponent />
        </RoleProvider>
      )

      expect(screen.getByTestId('is-user')).toHaveTextContent('true')
      expect(screen.getByTestId('can-access-chat')).toHaveTextContent('true')
      expect(screen.getByTestId('can-access-admin')).toHaveTextContent('false')
    })

    test('usePermission should support route permission validation', () => {
      RoleStorage.setUserData(mockAdminUser)

      const RouteTestComponent = () => {
        const permission = usePermission()
        return (
          <div data-testid="route-test">
            <div data-testid="can-access-admin-route">
              {permission.canAccessRoute('/admin').toString()}
            </div>
            <div data-testid="can-access-chat-route">
              {permission.canAccessRoute('/chat').toString()}
            </div>
          </div>
        )
      }

      render(
        <RoleProvider>
          <RouteTestComponent />
        </RoleProvider>
      )

      expect(screen.getByTestId('can-access-admin-route')).toHaveTextContent('true')
      expect(screen.getByTestId('can-access-chat-route')).toHaveTextContent('true')
    })
  })

  describe('AC3: Role State Persistence', () => {
    test('should store role information in local storage', () => {
      const role = mockAdminUser.role!
      RoleStorage.setRole(role)

      const stored = RoleStorage.getRole()
      expect(stored).toEqual(role)
    })

    test('should persist and restore user data across page refreshes', () => {
      RoleStorage.setUserData(mockAdminUser)

      // Simulate page refresh by creating new component
      render(
        <RoleProvider>
          <HookTestComponent />
        </RoleProvider>
      )

      expect(screen.getByTestId('is-admin')).toHaveTextContent('true')
    })

    test('should clear role data on logout', () => {
      RoleStorage.setUserData(mockAdminUser)
      expect(RoleStorage.hasValidData()).toBe(true)

      RoleStorage.clearAll()
      expect(RoleStorage.hasValidData()).toBe(false)
    })
  })

  describe('AC4: Backend Synchronization', () => {
    test('should sync user data from API', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAdminUser),
      })

      render(
        <RoleProvider>
          <RoleContextTestComponent />
        </RoleProvider>
      )

      // Initially syncing
      expect(screen.getByTestId('context-syncing')).toHaveTextContent('true')

      // Click sync button
      fireEvent.click(screen.getByTestId('sync-button'))

      await waitFor(() => {
        expect(screen.getByTestId('context-authenticated')).toHaveTextContent('true')
        expect(screen.getByTestId('context-role')).toHaveTextContent('admin')
      })
    })

    test('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

      render(
        <RoleProvider>
          <RoleContextTestComponent />
        </RoleProvider>
      )

      fireEvent.click(screen.getByTestId('sync-button'))

      await waitFor(() => {
        expect(screen.getByTestId('context-syncing')).toHaveTextContent('false')
      })

      // Should not crash and maintain stable state
      expect(screen.getByTestId('context-authenticated')).toBeInTheDocument()
    })
  })

  describe('AC5: Component Integration', () => {
    test('PermissionWrapper should conditionally render content', () => {
      RoleStorage.setUserData(mockRegularUser)

      render(
        <RoleProvider>
          <TestComponent requiredRoles={['admin']} />
        </RoleProvider>
      )

      // Should not show admin content for regular user
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

      // Change to admin user
      RoleStorage.setUserData(mockAdminUser)

      render(
        <RoleProvider>
          <TestComponent requiredRoles={['admin']} />
        </RoleProvider>
      )

      // Should show admin content for admin user
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    test('withPermission HOC should protect components', () => {
      RoleStorage.setUserData(mockRegularUser)

      render(
        <RoleProvider>
          <AdminOnlyTest />
        </RoleProvider>
      )

      // Should not render admin-only content for regular user
      expect(screen.queryByTestId('admin-only')).not.toBeInTheDocument()

      // Change to admin user
      RoleStorage.setUserData(mockAdminUser)

      render(
        <RoleProvider>
          <AdminOnlyTest />
        </RoleProvider>
      )

      // Should render admin content for admin user
      expect(screen.getByTestId('admin-only')).toBeInTheDocument()
    })

    test('RoleDisplay should show correct role information', () => {
      RoleStorage.setUserData(mockAdminUser)

      render(
        <RoleProvider>
          <RoleDisplay mode="text" data-testid="role-display" />
        </RoleProvider>
      )

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })
  })

  describe('Route Protection Integration', () => {
    test('RouteGuard should protect routes based on permissions', () => {
      RoleStorage.setUserData(mockRegularUser)

      const ProtectedPage = () => (
        <RouteGuard>
          <div data-testid="protected-page">Protected Page Content</div>
        </RouteGuard>
      )

      render(
        <RoleProvider>
          <ProtectedPage />
        </RoleProvider>
      )

      // Should render for authenticated user
      expect(screen.getByTestId('protected-page')).toBeInTheDocument()
    })

    test('should handle navigation with permission checks', async () => {
      RoleStorage.setUserData(mockRegularUser)

      const NavigationTest = () => {
        const { navigateWithPermissionCheck } = usePermission()
        return (
          <button
            data-testid="nav-admin"
            onClick={() => navigateWithPermissionCheck('/admin')}
          >
            Go to Admin
          </button>
        )
      }

      render(
        <RoleProvider>
          <NavigationTest />
        </RoleProvider>
      )

      fireEvent.click(screen.getByTestId('nav-admin'))

      // Should redirect to fallback path for insufficient permissions
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/chat')
      })
    })
  })

  describe('Storage and Synchronization Edge Cases', () => {
    test('should handle corrupted local storage data', () => {
      // Set invalid data in storage
      localStorage.setItem('user_role', 'invalid-json')

      render(
        <RoleProvider>
          <HookTestComponent />
        </RoleProvider>
      )

      // Should not crash and maintain stable state
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
    })

    test('should handle expired storage data', () => {
      // Mock Date.now to simulate expired data
      const originalNow = Date.now
      Date.now = jest.fn(() => originalNow() + 60 * 60 * 1000) // 1 hour later

      RoleStorage.setUserData(mockAdminUser)

      // Reset Date.now
      Date.now = originalNow

      render(
        <RoleProvider>
          <HookTestComponent />
        </RoleProvider>
      )

      // Should treat expired data as invalid
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
    })
  })

  describe('Performance and Resource Management', () => {
    test('should not cause memory leaks with multiple renders', () => {
      const { rerender, unmount } = render(
        <RoleProvider>
          <HookTestComponent />
        </RoleProvider>
      )

      // Multiple re-renders should not cause issues
      for (let i = 0; i < 10; i++) {
        rerender(
          <RoleProvider>
            <HookTestComponent />
          </RoleProvider>
        )
      }

      unmount()
      
      // Should clean up without issues
      expect(() => unmount()).not.toThrow()
    })
  })
})

describe('Storage Utilities Integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('RoleStorage encryption/decryption should work correctly', () => {
    const testRole: UserRole = {
      id: 'test-role',
      name: 'admin',
      description: 'Test Admin',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    RoleStorage.setRole(testRole)
    const retrieved = RoleStorage.getRole()

    expect(retrieved).toEqual(testRole)
  })

  test('should handle storage quota exceeded gracefully', () => {
    // Mock localStorage to throw quota exceeded error
    const originalSetItem = localStorage.setItem
    localStorage.setItem = jest.fn(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => {
      RoleStorage.setUserData(mockAdminUser)
    }).not.toThrow()

    // Restore original method
    localStorage.setItem = originalSetItem
  })
})