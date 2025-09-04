/**
 * User Synchronization Hook
 * 
 * Provides user data synchronization with backend API and local storage.
 * Handles automatic refresh, error recovery, and cross-tab synchronization.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserWithRole, UserRole } from '@/types/user-role'
import { RoleStorage, StorageSynchronizer } from '@/utils/role-storage'
import { useAppContext } from '@/context/app-context'

// API service for user data
const UserService = {
  async getCurrentUser(): Promise<UserWithRole> {
    const response = await fetch('/api/account/profile', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please log in')
      }
      throw new Error(`Failed to fetch user data: ${response.status}`)
    }

    const userData = await response.json()
    return userData
  },

  async refreshUserRole(): Promise<UserRole> {
    const user = await this.getCurrentUser()
    if (!user.role) {
      throw new Error('User has no role assigned')
    }
    return user.role
  },
}

export interface UseUserSyncOptions {
  autoSync?: boolean
  syncInterval?: number // in milliseconds
  enableStorageSync?: boolean
  onSyncSuccess?: (user: UserWithRole) => void
  onSyncError?: (error: Error) => void
}

export interface UseUserSyncReturn {
  // State
  isSyncing: boolean
  lastSyncTime: Date | null
  syncError: Error | null
  
  // Methods
  syncUserData: () => Promise<void>
  syncUserRole: () => Promise<void>
  clearLocalData: () => void
  forceRefresh: () => Promise<void>
  
  // Storage info
  hasLocalData: boolean
  isLocalDataExpired: boolean
}

/**
 * useUserSync - Hook for user data synchronization
 */
export const useUserSync = (options: UseUserSyncOptions = {}): UseUserSyncReturn => {
  const {
    autoSync = true,
    syncInterval = 5 * 60 * 1000, // 5 minutes
    enableStorageSync = true,
    onSyncSuccess,
    onSyncError,
  } = options

  const { mutateUserProfile } = useAppContext()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<Error | null>(null)
  const [hasLocalData, setHasLocalData] = useState(false)
  const [isLocalDataExpired, setIsLocalDataExpired] = useState(false)

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // Check local storage status
  const updateStorageStatus = useCallback(() => {
    const storageInfo = RoleStorage.getStorageInfo()
    setHasLocalData(storageInfo.hasUserData)
    setIsLocalDataExpired(storageInfo.isExpired)
  }, [])

  // Sync user data from API
  const syncUserData = useCallback(async (): Promise<void> => {
    if (isSyncing) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      const userData = await UserService.getCurrentUser()
      
      // Store in local storage
      RoleStorage.setUserData(userData)
      
      // Update app context
      mutateUserProfile()
      
      // Update storage status
      updateStorageStatus()
      
      // Set last sync time
      setLastSyncTime(new Date())
      
      // Call success callback
      onSyncSuccess?.(userData)
      
      console.log('User data synchronized successfully')
    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Sync failed')
      setSyncError(syncError)
      onSyncError?.(syncError)
      
      console.error('User data sync failed:', syncError)
      
      // If unauthorized, clear local data
      if (syncError.message.includes('Unauthorized')) {
        clearLocalData()
      }
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, mutateUserProfile, onSyncSuccess, onSyncError, updateStorageStatus])

  // Sync only user role
  const syncUserRole = useCallback(async (): Promise<void> => {
    if (isSyncing) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      const userRole = await UserService.refreshUserRole()
      
      // Store role in local storage
      RoleStorage.setRole(userRole)
      
      // Update app context
      mutateUserProfile()
      
      // Update storage status
      updateStorageStatus()
      
      console.log('User role synchronized successfully')
    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Role sync failed')
      setSyncError(syncError)
      onSyncError?.(syncError)
      
      console.error('User role sync failed:', syncError)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, mutateUserProfile, onSyncError, updateStorageStatus])

  // Clear local data
  const clearLocalData = useCallback(() => {
    RoleStorage.clearAll()
    updateStorageStatus()
    mutateUserProfile() // Trigger context update
    console.log('Local user data cleared')
  }, [updateStorageStatus, mutateUserProfile])

  // Force refresh - clear cache and sync
  const forceRefresh = useCallback(async (): Promise<void> => {
    RoleStorage.clearPermissionCache()
    await syncUserData()
  }, [syncUserData])

  // Setup auto-sync interval
  useEffect(() => {
    if (!autoSync) return

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
    }

    syncIntervalRef.current = setInterval(() => {
      if (!isSyncing) {
        syncUserData().catch(console.error)
      }
    }, syncInterval)

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [autoSync, syncInterval, syncUserData, isSyncing])

  // Setup storage synchronization across tabs
  useEffect(() => {
    if (!enableStorageSync) return

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user_data' || event.key === 'user_role') {
        updateStorageStatus()
        mutateUserProfile()
        console.log('User data synchronized from another tab')
      }
    }

    StorageSynchronizer.addListener(handleStorageChange)
    StorageSynchronizer.startSyncListener()

    return () => {
      StorageSynchronizer.removeListener(handleStorageChange)
    }
  }, [enableStorageSync, updateStorageStatus, mutateUserProfile])

  // Initialize storage status and perform initial sync
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    updateStorageStatus()

    // Perform initial sync if no valid local data
    const storageInfo = RoleStorage.getStorageInfo()
    if (!storageInfo.hasUserData || storageInfo.isExpired) {
      syncUserData().catch(console.error)
    }
  }, [updateStorageStatus, syncUserData])

  // Update storage status when sync state changes
  useEffect(() => {
    if (!isSyncing) {
      updateStorageStatus()
    }
  }, [isSyncing, updateStorageStatus])

  return {
    // State
    isSyncing,
    lastSyncTime,
    syncError,
    
    // Methods
    syncUserData,
    syncUserRole,
    clearLocalData,
    forceRefresh,
    
    // Storage info
    hasLocalData,
    isLocalDataExpired,
  }
}

export default useUserSync