/**
 * Role Integration Demo Component
 * 
 * Comprehensive example showing how to integrate all role-based
 * permission components and utilities in a real application.
 */

'use client'

import { type FC, useState } from 'react'
import { RoleProvider, useRoleContext, useRoleSync } from '@/context/role-context'
import { useUserRole } from '@/hooks/use-user-role'
import { usePermission } from '@/hooks/use-permission'
import PermissionWrapper from '@/components/base/permission-wrapper'
import RoleDisplay from '@/components/base/role-display'
import { withPermission, withAdminOnly } from '@/components/base/with-permission'
import RouteGuard from '@/components/base/route-guard'

// Example protected component using HOC
const AdminOnlyComponent = withAdminOnly(() => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <h3 className="font-semibold text-red-800">Admin Only Section</h3>
    <p className="text-red-600">This content is only visible to administrators.</p>
  </div>
))

// Example sync status component
const SyncStatusComponent: FC = () => {
  const { 
    isSyncing, 
    lastSyncTime, 
    syncError, 
    hasLocalData, 
    isLocalDataExpired,
    syncUserData,
    forceRefresh,
    clearLocalData 
  } = useRoleSync()

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="font-semibold text-gray-800 mb-3">Synchronization Status</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            isSyncing 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {isSyncing ? 'Syncing...' : 'Ready'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="font-medium">Local Data:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            hasLocalData 
              ? (isLocalDataExpired ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800')
              : 'bg-red-100 text-red-800'
          }`}>
            {hasLocalData 
              ? (isLocalDataExpired ? 'Expired' : 'Valid')
              : 'None'
            }
          </span>
        </div>
        
        {lastSyncTime && (
          <div>
            <span className="font-medium">Last Sync:</span>
            <span className="ml-2 text-gray-600">
              {lastSyncTime.toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {syncError && (
          <div className="text-red-600">
            <span className="font-medium">Error:</span>
            <span className="ml-2">{syncError.message}</span>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => syncUserData()}
          disabled={isSyncing}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Sync Now
        </button>
        <button
          onClick={() => forceRefresh()}
          disabled={isSyncing}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Force Refresh
        </button>
        <button
          onClick={clearLocalData}
          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Data
        </button>
      </div>
    </div>
  )
}

// Example permission info component
const PermissionInfoComponent: FC = () => {
  const userRole = useUserRole()
  const permission = usePermission()

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-3">Permission Information</h3>
      
      <div className="space-y-3">
        {/* Role Information */}
        <div>
          <h4 className="font-medium text-blue-700 mb-2">Current Role</h4>
          <RoleDisplay mode="detailed" />
        </div>
        
        {/* Permission Checks */}
        <div>
          <h4 className="font-medium text-blue-700 mb-2">Permissions</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <span>Chat:</span>
              <span className={userRole.canAccessChat ? 'text-green-600' : 'text-red-600'}>
                {userRole.canAccessChat ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Knowledge Base:</span>
              <span className={userRole.canAccessKnowledgeBase ? 'text-green-600' : 'text-red-600'}>
                {userRole.canAccessKnowledgeBase ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Admin Panel:</span>
              <span className={userRole.canAccessAdminPanel ? 'text-green-600' : 'text-red-600'}>
                {userRole.canAccessAdminPanel ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Current Route:</span>
              <span className={permission.isCurrentRouteAccessible ? 'text-green-600' : 'text-red-600'}>
                {permission.isCurrentRouteAccessible ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Available Routes */}
        <div>
          <h4 className="font-medium text-blue-700 mb-2">Available Routes</h4>
          <div className="text-sm">
            {permission.getAccessibleRoutes().map((route) => (
              <div key={route.path} className="text-gray-600">
                {route.path}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main demo component content
const DemoContent: FC = () => {
  const [showAdminSection, setShowAdminSection] = useState(false)
  const { navigateWithPermissionCheck } = usePermission()

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Role-Based Permission System Demo
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync Status */}
        <SyncStatusComponent />
        
        {/* Permission Info */}
        <PermissionInfoComponent />
      </div>
      
      {/* Permission-based content examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Permission-Based Content Examples
        </h2>
        
        {/* Admin-only content using wrapper */}
        <PermissionWrapper 
          requiredRoles={['admin']}
          fallback={
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-600">
                🔒 This content is only available to administrators.
              </p>
            </div>
          }
          showFallback
        >
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800">Admin Content</h3>
            <p className="text-green-600">
              Welcome, administrator! You have full access to all features.
            </p>
          </div>
        </PermissionWrapper>
        
        {/* Admin-only content using HOC */}
        <AdminOnlyComponent />
        
        {/* User or Admin content */}
        <PermissionWrapper requiredRoles={['admin', 'user']}>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-800">User Content</h3>
            <p className="text-purple-600">
              This content is available to both users and administrators.
            </p>
          </div>
        </PermissionWrapper>
        
        {/* Navigation examples */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-3">Safe Navigation</h3>
          <div className="space-x-2">
            <button
              onClick={() => navigateWithPermissionCheck('/chat')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Chat
            </button>
            <button
              onClick={() => navigateWithPermissionCheck('/admin')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Go to Admin
            </button>
          </div>
          <p className="text-sm text-yellow-700 mt-2">
            These buttons will redirect appropriately based on your permissions.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Complete integration demo with RoleProvider
 */
const RoleIntegrationDemo: FC = () => {
  return (
    <RoleProvider autoSync={true} syncInterval={60000}>
      <RouteGuard>
        <DemoContent />
      </RouteGuard>
    </RoleProvider>
  )
}

export default RoleIntegrationDemo

// Integration Usage Guide (as comments)
/**
 * INTEGRATION USAGE GUIDE
 * 
 * 1. Wrap your app with RoleProvider (preferably at root level):
 *    ```tsx
 *    <RoleProvider autoSync={true} syncInterval={5 * 60 * 1000}>
 *      <YourApp />
 *    </RoleProvider>
 *    ```
 * 
 * 2. Use RouteGuard in layout components:
 *    ```tsx
 *    <RouteGuard>
 *      <YourPageContent />
 *    </RouteGuard>
 *    ```
 * 
 * 3. Protect components with permission wrappers:
 *    ```tsx
 *    <PermissionWrapper requiredRoles={['admin']}>
 *      <AdminOnlyComponent />
 *    </PermissionWrapper>
 *    ```
 * 
 * 4. Use HOCs for page-level protection:
 *    ```tsx
 *    const ProtectedPage = withAdminOnly(MyPage)
 *    ```
 * 
 * 5. Access permission state with hooks:
 *    ```tsx
 *    const { isAdmin, canAccessChat } = useUserRole()
 *    const { navigateWithPermissionCheck } = usePermission()
 *    const { syncUserData, isSyncing } = useRoleSync()
 *    ```
 * 
 * 6. Display user roles:
 *    ```tsx
 *    <RoleDisplay mode="chip" showDescription />
 *    ```
 * 
 * 7. Safe navigation:
 *    ```tsx
 *    const { navigateWithPermissionCheck } = usePermission()
 *    navigateWithPermissionCheck('/admin-page')
 *    ```
 */