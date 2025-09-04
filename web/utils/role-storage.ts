/**
 * Role Storage Utilities
 * 
 * Provides secure local storage and synchronization for user role data.
 * Includes encryption, validation, and automatic cleanup mechanisms.
 */

import type { UserRole, UserWithRole, PermissionContext } from '@/types/user-role'
import { STORAGE_KEYS } from '@/types/user-role'

// Simple encryption/decryption utilities for sensitive data
class StorageEncryption {
  private static key = 'dify_permission_key_2024' // In production, use proper key management

  static encrypt(data: string): string {
    try {
      // Simple XOR encryption - in production, use proper encryption
      const key = this.key
      let result = ''
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }
      return btoa(result)
    } catch (error) {
      console.error('Storage encryption failed:', error)
      return data // Fallback to unencrypted
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData)
      const key = this.key
      let result = ''
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }
      return result
    } catch (error) {
      console.error('Storage decryption failed:', error)
      return encryptedData // Return as-is if decryption fails
    }
  }
}

// Storage validation utilities
class StorageValidator {
  static isValidUserRole(data: any): data is UserRole {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      ['admin', 'user'].includes(data.name) &&
      typeof data.description === 'string' &&
      typeof data.is_active === 'boolean' &&
      typeof data.created_at === 'string' &&
      typeof data.updated_at === 'string'
    )
  }

  static isValidUserWithRole(data: any): data is UserWithRole {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.email === 'string' &&
      typeof data.name === 'string' &&
      (data.role === null || this.isValidUserRole(data.role)) &&
      typeof data.status === 'string' &&
      typeof data.created_at === 'string' &&
      typeof data.last_active_at === 'string'
    )
  }

  static isExpired(timestamp: number, ttlMinutes: number = 30): boolean {
    const now = Date.now()
    const expiryTime = timestamp + (ttlMinutes * 60 * 1000)
    return now > expiryTime
  }
}

// Main role storage class
export class RoleStorage {
  private static readonly TTL_MINUTES = 30 // 30 minutes default TTL
  private static readonly PERMISSION_CACHE_TTL = 5 // 5 minutes for permission cache

  /**
   * Store user role with encryption and timestamp
   */
  static setRole(role: UserRole): void {
    try {
      const storageData = {
        data: role,
        timestamp: Date.now(),
        version: '1.0',
      }
      
      const encrypted = StorageEncryption.encrypt(JSON.stringify(storageData))
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, encrypted)
      
      // Also update user data if it exists
      this.updateUserRoleInUserData(role)
    } catch (error) {
      console.error('Failed to store user role:', error)
    }
  }

  /**
   * Retrieve user role with validation and expiry check
   */
  static getRole(): UserRole | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_ROLE)
      if (!stored) return null

      const decrypted = StorageEncryption.decrypt(stored)
      const storageData = JSON.parse(decrypted)

      // Check expiry
      if (StorageValidator.isExpired(storageData.timestamp, this.TTL_MINUTES)) {
        this.clearRole()
        return null
      }

      // Validate role data
      if (!StorageValidator.isValidUserRole(storageData.data)) {
        console.warn('Invalid role data in storage, clearing...')
        this.clearRole()
        return null
      }

      return storageData.data
    } catch (error) {
      console.error('Failed to retrieve user role:', error)
      this.clearRole() // Clear corrupted data
      return null
    }
  }

  /**
   * Store complete user data with role
   */
  static setUserData(user: UserWithRole): void {
    try {
      const storageData = {
        data: user,
        timestamp: Date.now(),
        version: '1.0',
      }

      const encrypted = StorageEncryption.encrypt(JSON.stringify(storageData))
      localStorage.setItem(STORAGE_KEYS.USER_DATA, encrypted)

      // Also update role separately for quick access
      if (user.role) {
        this.setRole(user.role)
      }
    } catch (error) {
      console.error('Failed to store user data:', error)
    }
  }

  /**
   * Retrieve complete user data with validation
   */
  static getUserData(): UserWithRole | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA)
      if (!stored) return null

      const decrypted = StorageEncryption.decrypt(stored)
      const storageData = JSON.parse(decrypted)

      // Check expiry
      if (StorageValidator.isExpired(storageData.timestamp, this.TTL_MINUTES)) {
        this.clearUserData()
        return null
      }

      // Validate user data
      if (!StorageValidator.isValidUserWithRole(storageData.data)) {
        console.warn('Invalid user data in storage, clearing...')
        this.clearUserData()
        return null
      }

      return storageData.data
    } catch (error) {
      console.error('Failed to retrieve user data:', error)
      this.clearUserData()
      return null
    }
  }

  /**
   * Store permission cache for performance
   */
  static setPermissionCache(permissions: Record<string, boolean>): void {
    try {
      const storageData = {
        data: permissions,
        timestamp: Date.now(),
        version: '1.0',
      }

      const encrypted = StorageEncryption.encrypt(JSON.stringify(storageData))
      localStorage.setItem(STORAGE_KEYS.PERMISSION_CACHE, encrypted)
    } catch (error) {
      console.error('Failed to store permission cache:', error)
    }
  }

  /**
   * Retrieve permission cache with expiry check
   */
  static getPermissionCache(): Record<string, boolean> | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERMISSION_CACHE)
      if (!stored) return null

      const decrypted = StorageEncryption.decrypt(stored)
      const storageData = JSON.parse(decrypted)

      // Check expiry with shorter TTL for permissions
      if (StorageValidator.isExpired(storageData.timestamp, this.PERMISSION_CACHE_TTL)) {
        this.clearPermissionCache()
        return null
      }

      return storageData.data
    } catch (error) {
      console.error('Failed to retrieve permission cache:', error)
      this.clearPermissionCache()
      return null
    }
  }

  /**
   * Clear user role from storage
   */
  static clearRole(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ROLE)
    } catch (error) {
      console.error('Failed to clear user role:', error)
    }
  }

  /**
   * Clear user data from storage
   */
  static clearUserData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    } catch (error) {
      console.error('Failed to clear user data:', error)
    }
  }

  /**
   * Clear permission cache
   */
  static clearPermissionCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PERMISSION_CACHE)
    } catch (error) {
      console.error('Failed to clear permission cache:', error)
    }
  }

  /**
   * Clear all stored data
   */
  static clearAll(): void {
    this.clearRole()
    this.clearUserData()
    this.clearPermissionCache()
  }

  /**
   * Check if stored data exists and is valid
   */
  static hasValidData(): boolean {
    const role = this.getRole()
    const userData = this.getUserData()
    return !!(role && userData)
  }

  /**
   * Get storage info for debugging
   */
  static getStorageInfo(): {
    hasRole: boolean
    hasUserData: boolean
    hasPermissionCache: boolean
    isExpired: boolean
  } {
    const hasRole = !!localStorage.getItem(STORAGE_KEYS.USER_ROLE)
    const hasUserData = !!localStorage.getItem(STORAGE_KEYS.USER_DATA)
    const hasPermissionCache = !!localStorage.getItem(STORAGE_KEYS.PERMISSION_CACHE)
    
    let isExpired = false
    try {
      const userDataStored = localStorage.getItem(STORAGE_KEYS.USER_DATA)
      if (userDataStored) {
        const decrypted = StorageEncryption.decrypt(userDataStored)
        const storageData = JSON.parse(decrypted)
        isExpired = StorageValidator.isExpired(storageData.timestamp, this.TTL_MINUTES)
      }
    } catch (error) {
      isExpired = true
    }

    return {
      hasRole,
      hasUserData,
      hasPermissionCache,
      isExpired,
    }
  }

  /**
   * Update role in existing user data
   */
  private static updateUserRoleInUserData(role: UserRole): void {
    try {
      const userData = this.getUserData()
      if (userData) {
        userData.role = role
        this.setUserData(userData)
      }
    } catch (error) {
      console.error('Failed to update role in user data:', error)
    }
  }
}

// Event-based storage synchronization
export class StorageSynchronizer {
  private static listeners: ((event: StorageEvent) => void)[] = []

  /**
   * Start listening for storage changes across tabs
   */
  static startSyncListener(): void {
    if (typeof window === 'undefined') return

    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || !Object.values(STORAGE_KEYS).includes(event.key as any)) {
        return
      }

      console.log('Storage sync event:', event.key, 'newValue:', !!event.newValue)
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Storage sync listener error:', error)
        }
      })
    }

    window.addEventListener('storage', handleStorageChange)
  }

  /**
   * Add listener for storage changes
   */
  static addListener(listener: (event: StorageEvent) => void): void {
    this.listeners.push(listener)
  }

  /**
   * Remove listener for storage changes
   */
  static removeListener(listener: (event: StorageEvent) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  /**
   * Manually trigger sync check
   */
  static triggerSync(): void {
    const fakeEvent = new StorageEvent('storage', {
      key: STORAGE_KEYS.USER_DATA,
      newValue: localStorage.getItem(STORAGE_KEYS.USER_DATA),
      oldValue: null,
      storageArea: localStorage,
    })
    
    this.listeners.forEach(listener => {
      try {
        listener(fakeEvent)
      } catch (error) {
        console.error('Manual sync trigger error:', error)
      }
    })
  }
}

export default RoleStorage