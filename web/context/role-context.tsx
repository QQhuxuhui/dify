/**
 * Role Context Provider
 * 
 * Provides centralized role state management with synchronization,
 * persistence, and cross-tab communication capabilities.
 */

'use client'

import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react'
import type { UserWithRole, UserRole, PermissionContext } from '@/types/user-role'
import { RoleStorage, StorageSynchronizer } from '@/utils/role-storage'
import { useUserSync } from '@/hooks/use-user-sync'
import { useAppContext } from '@/context/app-context'

export interface RoleContextValue extends PermissionContext {
  // Sync state
  isSyncing: boolean
  lastSyncTime: Date | null
  syncError: Error | null
  
  // Storage state
  hasLocalData: boolean
  isLocalDataExpired: boolean
  
  // Methods
  syncUserData: () => Promise<void>
  syncUserRole: () => Promise<void>
  clearLocalData: () => void
  forceRefresh: () => Promise<void>
  
  // Role management
  updateLocalRole: (role: UserRole) => void
  updateLocalUser: (user: UserWithRole) => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export interface RoleProviderProps {
  children: ReactNode
  autoSync?: boolean
  syncInterval?: number
}

/**
 * RoleProvider - Centralized role state management
 * 
 * Integrates with existing AppContext while adding role-specific
 * synchronization and persistence capabilities.
 */
export const RoleProvider: FC<RoleProviderProps> = ({ 
  children, 
  autoSync = true,
  syncInterval = 5 * 60 * 1000 // 5 minutes
}) => {
  const { userProfile, mutateUserProfile } = useAppContext()
  const [localUser, setLocalUser] = useState<UserWithRole | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // User sync hook with custom handlers
  const userSync = useUserSync({
    autoSync,
    syncInterval,
    enableStorageSync: true,
    onSyncSuccess: (user) => {
      setLocalUser(user)
      console.log('Role context: User sync successful')
    },
    onSyncError: (error) => {
      console.error('Role context: User sync error:', error)
      // If auth error, clear local state
      if (error.message.includes('Unauthorized')) {
        setLocalUser(null)
      }
    },
  })

  // Initialize from local storage on mount
  useEffect(() => {
    const initializeFromStorage = () => {
      try {
        const storedUser = RoleStorage.getUserData()
        if (storedUser) {
          setLocalUser(storedUser)
          console.log('Role context: Initialized from local storage')
        }
      } catch (error) {
        console.error('Role context: Failed to initialize from storage:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeFromStorage()
  }, [])

  // Sync with AppContext when userProfile changes
  useEffect(() => {
    if (userProfile && isInitialized) {
      const userWithRole = userProfile as UserWithRole
      
      // Update local storage if data is newer
      if (userWithRole.role) {
        RoleStorage.setUserData(userWithRole)
        setLocalUser(userWithRole)
      }
    }
  }, [userProfile, isInitialized])

  // Storage sync across tabs
  useEffect(() => {
    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === 'user_data' && event.newValue) {
        try {
          const userData = RoleStorage.getUserData()
          if (userData) {
            setLocalUser(userData)
            console.log('Role context: Synced from another tab')
          }
        } catch (error) {
          console.error('Role context: Cross-tab sync error:', error)
        }
      }
    }

    StorageSynchronizer.addListener(handleStorageSync)
    return () => StorageSynchronizer.removeListener(handleStorageSync)
  }, [])

  // Local role management methods
  const updateLocalRole = (role: UserRole) => {
    try {
      RoleStorage.setRole(role)
      
      if (localUser) {
        const updatedUser = { ...localUser, role }
        setLocalUser(updatedUser)
        RoleStorage.setUserData(updatedUser)
      }
      
      // Clear permission cache to force refresh
      RoleStorage.clearPermissionCache()
      
      console.log('Role context: Local role updated')
    } catch (error) {
      console.error('Role context: Failed to update local role:', error)
    }
  }

  const updateLocalUser = (user: UserWithRole) => {
    try {
      RoleStorage.setUserData(user)
      setLocalUser(user)
      
      // Clear permission cache to force refresh
      RoleStorage.clearPermissionCache()
      
      console.log('Role context: Local user updated')
    } catch (error) {
      console.error('Role context: Failed to update local user:', error)
    }
  }

  // Determine current user (prioritize local over context)
  const currentUser = localUser || (userProfile as UserWithRole) || null
  const currentRole = currentUser?.role || null

  // Generate permission context
  const permissions = currentRole ? ['chat', 'knowledge_base'] : []
  if (currentRole?.name === 'admin') {
    permissions.push('admin_panel', 'user_management', 'system_settings')
  }

  const contextValue: RoleContextValue = {
    // Permission context
    user: currentUser,
    role: currentRole,
    permissions,
    isAuthenticated: !!currentUser,
    isLoading: !isInitialized || userSync.isSyncing,
    
    // Sync state
    isSyncing: userSync.isSyncing,
    lastSyncTime: userSync.lastSyncTime,
    syncError: userSync.syncError,
    
    // Storage state
    hasLocalData: userSync.hasLocalData,
    isLocalDataExpired: userSync.isLocalDataExpired,
    
    // Methods
    syncUserData: userSync.syncUserData,
    syncUserRole: userSync.syncUserRole,
    clearLocalData: userSync.clearLocalData,
    forceRefresh: userSync.forceRefresh,
    
    // Role management
    updateLocalRole,
    updateLocalUser,
  }

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  )
}

/**
 * useRoleContext - Access role context
 */
export const useRoleContext = (): RoleContextValue => {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRoleContext must be used within a RoleProvider')
  }
  return context
}

// Enhanced hooks that use role context
export const useRoleSync = () => {
  const context = useRoleContext()
  return {
    isSyncing: context.isSyncing,
    lastSyncTime: context.lastSyncTime,
    syncError: context.syncError,
    hasLocalData: context.hasLocalData,
    isLocalDataExpired: context.isLocalDataExpired,
    syncUserData: context.syncUserData,
    syncUserRole: context.syncUserRole,
    clearLocalData: context.clearLocalData,
    forceRefresh: context.forceRefresh,
  }
}

export const useRoleManagement = () => {
  const context = useRoleContext()
  return {
    user: context.user,
    role: context.role,
    isAuthenticated: context.isAuthenticated,
    updateLocalRole: context.updateLocalRole,
    updateLocalUser: context.updateLocalUser,
    forceRefresh: context.forceRefresh,
  }
}

export default RoleContext