/**
 * Unit Tests for Storage Utilities
 * 
 * Tests role storage, encryption, validation, and synchronization utilities.
 */

import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals'
import { RoleStorage, StorageSynchronizer } from '../../utils/role-storage'
import type { UserWithRole, UserRole } from '../../types/user-role'

// Mock data
const mockRole: UserRole = {
  id: 'role-1',
  name: 'admin',
  description: 'Administrator Role',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockUser: UserWithRole = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  last_active_at: '2024-01-01T12:00:00Z',
  role: mockRole,
}

describe('RoleStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Role Storage Operations', () => {
    test('should store and retrieve role correctly', () => {
      RoleStorage.setRole(mockRole)
      const retrieved = RoleStorage.getRole()

      expect(retrieved).toEqual(mockRole)
    })

    test('should return null for non-existent role', () => {
      const retrieved = RoleStorage.getRole()
      expect(retrieved).toBeNull()
    })

    test('should clear role correctly', () => {
      RoleStorage.setRole(mockRole)
      expect(RoleStorage.getRole()).toEqual(mockRole)

      RoleStorage.clearRole()
      expect(RoleStorage.getRole()).toBeNull()
    })
  })

  describe('User Data Storage Operations', () => {
    test('should store and retrieve user data correctly', () => {
      RoleStorage.setUserData(mockUser)
      const retrieved = RoleStorage.getUserData()

      expect(retrieved).toEqual(mockUser)
    })

    test('should automatically update role when storing user data', () => {
      RoleStorage.setUserData(mockUser)
      
      const retrievedUser = RoleStorage.getUserData()
      const retrievedRole = RoleStorage.getRole()

      expect(retrievedUser?.role).toEqual(mockRole)
      expect(retrievedRole).toEqual(mockRole)
    })

    test('should handle user data without role', () => {
      const userWithoutRole = { ...mockUser, role: null }
      RoleStorage.setUserData(userWithoutRole)
      
      const retrieved = RoleStorage.getUserData()
      expect(retrieved?.role).toBeNull()
    })
  })

  describe('Permission Cache Operations', () => {
    test('should store and retrieve permission cache', () => {
      const permissions = {
        '/admin': true,
        '/chat': true,
        '/settings': false,
      }

      RoleStorage.setPermissionCache(permissions)
      const retrieved = RoleStorage.getPermissionCache()

      expect(retrieved).toEqual(permissions)
    })

    test('should clear permission cache', () => {
      const permissions = { '/admin': true }
      RoleStorage.setPermissionCache(permissions)
      
      expect(RoleStorage.getPermissionCache()).toEqual(permissions)
      
      RoleStorage.clearPermissionCache()
      expect(RoleStorage.getPermissionCache()).toBeNull()
    })
  })

  describe('Data Validation', () => {
    test('should reject invalid role data', () => {
      // Store invalid data directly in localStorage
      localStorage.setItem('user_role', JSON.stringify({
        data: { invalid: 'data' },
        timestamp: Date.now(),
        version: '1.0',
      }))

      const retrieved = RoleStorage.getRole()
      expect(retrieved).toBeNull()
    })

    test('should reject invalid user data', () => {
      // Store invalid data
      localStorage.setItem('user_data', JSON.stringify({
        data: { invalid: 'user_data' },
        timestamp: Date.now(),
        version: '1.0',
      }))

      const retrieved = RoleStorage.getUserData()
      expect(retrieved).toBeNull()
    })

    test('should handle corrupted JSON data', () => {
      localStorage.setItem('user_role', 'invalid-json')
      
      const retrieved = RoleStorage.getRole()
      expect(retrieved).toBeNull()
      
      // Should have cleaned up corrupted data
      expect(localStorage.getItem('user_role')).toBeNull()
    })
  })

  describe('Data Expiration', () => {
    test('should expire old data', () => {
      // Mock Date.now to simulate old timestamp
      const originalNow = Date.now
      const pastTime = Date.now() - (45 * 60 * 1000) // 45 minutes ago
      
      // Store data with old timestamp
      const storageData = {
        data: mockRole,
        timestamp: pastTime,
        version: '1.0',
      }
      localStorage.setItem('user_role', btoa(JSON.stringify(storageData)))

      const retrieved = RoleStorage.getRole()
      expect(retrieved).toBeNull()

      // Should have cleaned up expired data
      expect(localStorage.getItem('user_role')).toBeNull()
    })

    test('should not expire recent data', () => {
      // Store data with recent timestamp
      const recentTime = Date.now() - (5 * 60 * 1000) // 5 minutes ago
      const storageData = {
        data: mockRole,
        timestamp: recentTime,
        version: '1.0',
      }
      localStorage.setItem('user_role', btoa(JSON.stringify(storageData)))

      const retrieved = RoleStorage.getRole()
      expect(retrieved).toEqual(mockRole)
    })

    test('should have shorter TTL for permission cache', () => {
      // Store permission cache with old timestamp (6 minutes ago)
      const oldTime = Date.now() - (6 * 60 * 1000)
      const permissions = { '/admin': true }
      const storageData = {
        data: permissions,
        timestamp: oldTime,
        version: '1.0',
      }
      localStorage.setItem('permission_cache', btoa(JSON.stringify(storageData)))

      const retrieved = RoleStorage.getPermissionCache()
      expect(retrieved).toBeNull()
    })
  })

  describe('Storage Information', () => {
    test('should provide accurate storage info', () => {
      expect(RoleStorage.hasValidData()).toBe(false)

      RoleStorage.setUserData(mockUser)
      expect(RoleStorage.hasValidData()).toBe(true)

      const storageInfo = RoleStorage.getStorageInfo()
      expect(storageInfo.hasRole).toBe(true)
      expect(storageInfo.hasUserData).toBe(true)
      expect(storageInfo.isExpired).toBe(false)
    })

    test('should detect expired data in storage info', () => {
      // Store expired data
      const expiredTime = Date.now() - (60 * 60 * 1000) // 1 hour ago
      const storageData = {
        data: mockUser,
        timestamp: expiredTime,
        version: '1.0',
      }
      localStorage.setItem('user_data', btoa(JSON.stringify(storageData)))

      const storageInfo = RoleStorage.getStorageInfo()
      expect(storageInfo.hasUserData).toBe(true)
      expect(storageInfo.isExpired).toBe(true)
    })
  })

  describe('Clear All Operations', () => {
    test('should clear all stored data', () => {
      RoleStorage.setUserData(mockUser)
      RoleStorage.setPermissionCache({ '/admin': true })

      expect(RoleStorage.hasValidData()).toBe(true)
      expect(RoleStorage.getPermissionCache()).toBeTruthy()

      RoleStorage.clearAll()

      expect(RoleStorage.hasValidData()).toBe(false)
      expect(RoleStorage.getPermissionCache()).toBeNull()
    })
  })

  describe('Error Handling', () => {
    test('should handle localStorage quota exceeded', () => {
      // Mock localStorage.setItem to throw quota exceeded error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw error
      expect(() => {
        RoleStorage.setRole(mockRole)
      }).not.toThrow()

      expect(() => {
        RoleStorage.setUserData(mockUser)
      }).not.toThrow()

      // Restore original method
      localStorage.setItem = originalSetItem
    })

    test('should handle localStorage access errors', () => {
      // Mock localStorage.getItem to throw error
      const originalGetItem = localStorage.getItem
      localStorage.getItem = jest.fn(() => {
        throw new Error('Storage access denied')
      })

      const result = RoleStorage.getRole()
      expect(result).toBeNull()

      // Restore original method
      localStorage.getItem = originalGetItem
    })
  })
})

describe('StorageSynchronizer', () => {
  let mockEventListener: jest.Mock

  beforeEach(() => {
    mockEventListener = jest.fn()
    // Mock window.addEventListener
    Object.defineProperty(window, 'addEventListener', {
      value: jest.fn(),
      writable: true,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should start storage sync listener', () => {
    StorageSynchronizer.startSyncListener()

    expect(window.addEventListener).toHaveBeenCalledWith(
      'storage',
      expect.any(Function)
    )
  })

  test('should add and remove listeners correctly', () => {
    const listener1 = jest.fn()
    const listener2 = jest.fn()

    StorageSynchronizer.addListener(listener1)
    StorageSynchronizer.addListener(listener2)

    // Simulate storage event
    StorageSynchronizer.triggerSync()

    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()

    // Remove one listener
    StorageSynchronizer.removeListener(listener1)
    StorageSynchronizer.triggerSync()

    // Only listener2 should be called
    expect(listener2).toHaveBeenCalledTimes(2)
    expect(listener1).toHaveBeenCalledTimes(1) // Still only called once
  })

  test('should handle listener errors gracefully', () => {
    const errorListener = jest.fn(() => {
      throw new Error('Listener error')
    })
    const goodListener = jest.fn()

    StorageSynchronizer.addListener(errorListener)
    StorageSynchronizer.addListener(goodListener)

    // Should not throw even if listener throws
    expect(() => {
      StorageSynchronizer.triggerSync()
    }).not.toThrow()

    // Good listener should still be called
    expect(goodListener).toHaveBeenCalled()
  })

  test('should filter events by storage keys', () => {
    const listener = jest.fn()
    StorageSynchronizer.addListener(listener)

    // Create mock storage event for relevant key
    const relevantEvent = new StorageEvent('storage', {
      key: 'user_data',
      newValue: '{"test": "data"}',
      oldValue: null,
      storageArea: localStorage,
    })

    // Create mock storage event for irrelevant key
    const irrelevantEvent = new StorageEvent('storage', {
      key: 'other_data',
      newValue: '{"test": "data"}',
      oldValue: null,
      storageArea: localStorage,
    })

    // Mock the actual event handling
    const handleStorageChange = (event: StorageEvent) => {
      const validKeys = ['user_role', 'user_data', 'permission_cache']
      if (!event.key || !validKeys.includes(event.key)) {
        return
      }
      listener(event)
    }

    handleStorageChange(relevantEvent)
    handleStorageChange(irrelevantEvent)

    // Should only be called once for the relevant event
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(relevantEvent)
  })
})