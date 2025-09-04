/**
 * Unit Tests for Permission Hooks
 * 
 * Tests individual hook functionality in isolation.
 */

import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useUserRole } from '../../hooks/use-user-role'
import { usePermission } from '../../hooks/use-permission'
import { useUserSync } from '../../hooks/use-user-sync'
import { RoleStorage } from '../../utils/role-storage'
import type { UserWithRole, UserRole } from '../../types/user-role'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/test',
}))

jest.mock('../../context/app-context', () => ({
  useAppContext: () => ({
    userProfile: null,
    mutateUserProfile: jest.fn(),
  }),
}))

global.fetch = jest.fn()

const mockAdminUser: UserWithRole = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Admin',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: '2024-01-01T12:00:00Z',
  role: {
    id: 'role-admin',
    name: 'admin',
    description: 'Administrator',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

const mockRegularUser: UserWithRole = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'User',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: '2024-01-01T12:00:00Z',
  role: {
    id: 'role-user',
    name: 'user',
    description: 'Standard User',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

describe('useUserRole Hook', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  test('should return default state when no user', () => {
    const { result } = renderHook(() => useUserRole())

    expect(result.current.role).toBeNull()
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isUser).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.canAccessChat).toBe(false)
    expect(result.current.canAccessAdminPanel).toBe(false)
  })

  test('should return admin permissions for admin user', () => {
    RoleStorage.setUserData(mockAdminUser)
    const { result } = renderHook(() => useUserRole())

    expect(result.current.role?.name).toBe('admin')
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isUser).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.canAccessChat).toBe(true)
    expect(result.current.canAccessAdminPanel).toBe(true)
  })

  test('should return user permissions for regular user', () => {
    RoleStorage.setUserData(mockRegularUser)
    const { result } = renderHook(() => useUserRole())

    expect(result.current.role?.name).toBe('user')
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isUser).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.canAccessChat).toBe(true)
    expect(result.current.canAccessAdminPanel).toBe(false)
  })

  test('hasRole function should work correctly', () => {
    RoleStorage.setUserData(mockAdminUser)
    const { result } = renderHook(() => useUserRole())

    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('user')).toBe(false)
  })

  test('hasAnyRole function should work correctly', () => {
    RoleStorage.setUserData(mockRegularUser)
    const { result } = renderHook(() => useUserRole())

    expect(result.current.hasAnyRole(['admin', 'user'])).toBe(true)
    expect(result.current.hasAnyRole(['admin'])).toBe(false)
    expect(result.current.hasAnyRole(['user'])).toBe(true)
  })
})

describe('usePermission Hook', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  test('should check route access correctly for admin', () => {
    RoleStorage.setUserData(mockAdminUser)
    const { result } = renderHook(() => usePermission())

    expect(result.current.canAccessRoute('/admin')).toBe(true)
    expect(result.current.canAccessRoute('/chat')).toBe(true)
    expect(result.current.canAccessRoute('/settings/workspace')).toBe(true)
  })

  test('should check route access correctly for regular user', () => {
    RoleStorage.setUserData(mockRegularUser)
    const { result } = renderHook(() => usePermission())

    expect(result.current.canAccessRoute('/admin')).toBe(false)
    expect(result.current.canAccessRoute('/chat')).toBe(true)
    expect(result.current.canAccessRoute('/datasets')).toBe(true)
  })

  test('should allow public routes for unauthenticated users', () => {
    const { result } = renderHook(() => usePermission())

    expect(result.current.canAccessRoute('/signin')).toBe(true)
    expect(result.current.canAccessRoute('/signup')).toBe(true)
    expect(result.current.canAccessRoute('/chat')).toBe(false)
  })

  test('checkRouteAccess should provide detailed access information', () => {
    RoleStorage.setUserData(mockRegularUser)
    const { result } = renderHook(() => usePermission())

    const adminCheck = result.current.checkRouteAccess('/admin')
    expect(adminCheck.canAccess).toBe(false)
    expect(adminCheck.fallbackPath).toBe('/chat')
    expect(adminCheck.reason).toContain('Requires one of: admin')

    const chatCheck = result.current.checkRouteAccess('/chat')
    expect(chatCheck.canAccess).toBe(true)
    expect(chatCheck.fallbackPath).toBeUndefined()
  })

  test('should get accessible routes correctly', () => {
    RoleStorage.setUserData(mockRegularUser)
    const { result } = renderHook(() => usePermission())

    const accessibleRoutes = result.current.getAccessibleRoutes()
    expect(accessibleRoutes).toContain(expect.objectContaining({ path: '/chat' }))
    expect(accessibleRoutes).not.toContain(expect.objectContaining({ path: '/admin' }))
  })
})

describe('useUserSync Hook', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  test('should initialize with correct default state', () => {
    const { result } = renderHook(() => useUserSync())

    expect(result.current.isSyncing).toBe(false)
    expect(result.current.lastSyncTime).toBeNull()
    expect(result.current.syncError).toBeNull()
    expect(result.current.hasLocalData).toBe(false)
  })

  test('should sync user data successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAdminUser),
    })

    const { result } = renderHook(() => useUserSync({ autoSync: false }))

    await act(async () => {
      await result.current.syncUserData()
    })

    expect(result.current.isSyncing).toBe(false)
    expect(result.current.lastSyncTime).toBeTruthy()
    expect(result.current.syncError).toBeNull()
    expect(result.current.hasLocalData).toBe(true)
  })

  test('should handle sync errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useUserSync({ autoSync: false }))

    await act(async () => {
      await result.current.syncUserData()
    })

    expect(result.current.isSyncing).toBe(false)
    expect(result.current.syncError).toBeTruthy()
    expect(result.current.syncError?.message).toBe('Network error')
  })

  test('should clear local data', () => {
    RoleStorage.setUserData(mockAdminUser)
    const { result } = renderHook(() => useUserSync())

    expect(result.current.hasLocalData).toBe(true)

    act(() => {
      result.current.clearLocalData()
    })

    expect(result.current.hasLocalData).toBe(false)
  })

  test('should force refresh (clear cache and sync)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAdminUser),
    })

    // Set some permission cache
    RoleStorage.setPermissionCache({ '/admin': true })

    const { result } = renderHook(() => useUserSync({ autoSync: false }))

    await act(async () => {
      await result.current.forceRefresh()
    })

    // Should have cleared cache and synced
    expect(RoleStorage.getPermissionCache()).toBeNull()
    expect(result.current.lastSyncTime).toBeTruthy()
  })

  test('should handle unauthorized errors by clearing local data', async () => {
    RoleStorage.setUserData(mockAdminUser)
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Unauthorized - please log in'))

    const { result } = renderHook(() => useUserSync({ autoSync: false }))

    expect(result.current.hasLocalData).toBe(true)

    await act(async () => {
      await result.current.syncUserData()
    })

    expect(result.current.hasLocalData).toBe(false)
    expect(result.current.syncError?.message).toBe('Unauthorized - please log in')
  })

  test('should sync only user role', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAdminUser),
    })

    const { result } = renderHook(() => useUserSync({ autoSync: false }))

    await act(async () => {
      await result.current.syncUserRole()
    })

    expect(result.current.isSyncing).toBe(false)
    expect(global.fetch).toHaveBeenCalledWith('/api/account/profile', expect.any(Object))
  })

  test('should call success callback on successful sync', async () => {
    const onSyncSuccess = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAdminUser),
    })

    const { result } = renderHook(() => 
      useUserSync({ autoSync: false, onSyncSuccess })
    )

    await act(async () => {
      await result.current.syncUserData()
    })

    expect(onSyncSuccess).toHaveBeenCalledWith(mockAdminUser)
  })

  test('should call error callback on sync failure', async () => {
    const onSyncError = jest.fn()
    const error = new Error('Sync failed')
    ;(global.fetch as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => 
      useUserSync({ autoSync: false, onSyncError })
    )

    await act(async () => {
      await result.current.syncUserData()
    })

    expect(onSyncError).toHaveBeenCalledWith(error)
  })
})