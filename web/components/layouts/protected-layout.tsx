/**
 * Protected Layout Component
 * 
 * Example layout component demonstrating integration of the permission system
 * with route guards, navigation filtering, and role display.
 */

'use client'

import { type FC, type ReactNode, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import RouteGuard from '@/components/base/route-guard'
import RoleDisplay from '@/components/base/role-display'
import PermissionWrapper from '@/components/base/permission-wrapper'
import { useUserRole } from '@/hooks/use-user-role'
import { usePermission } from '@/hooks/use-permission'
import { getFilteredNavigationItems, safeNavigate } from '@/utils/navigation-utils'

export interface ProtectedLayoutProps {
  children: ReactNode
}

/**
 * ProtectedLayout - Example layout with integrated permission system
 * 
 * This layout demonstrates:
 * - Route protection with RouteGuard
 * - Permission-based navigation filtering
 * - Role display in header
 * - Safe navigation with permission checks
 */
const ProtectedLayout: FC<ProtectedLayoutProps> = ({ children }) => {
  const router = useRouter()
  const userRoleHook = useUserRole()
  const permission = usePermission()
  const { role, isAuthenticated } = userRoleHook

  // Create user context for navigation utilities
  const userContext = useMemo(() => ({
    role: role ? { name: role.name, is_active: role.is_active } : null,
    isAuthenticated,
  }), [role, isAuthenticated])

  // Get filtered navigation items based on permissions
  const navigationItems = useMemo(() => {
    return getFilteredNavigationItems(userContext)
  }, [userContext])

  // Safe navigation handler
  const handleNavigation = (path: string) => {
    safeNavigate(path, userContext, router)
  }

  return (
    <RouteGuard>
      <div className="min-h-screen bg-background-body">
        {/* Header with role display and navigation */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dify
                </h1>
              </div>

              {/* Navigation */}
              <nav className="flex space-x-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* User info and role display */}
              <div className="flex items-center space-x-4">
                {/* Role display */}
                <RoleDisplay mode="chip" showDescription />

                {/* Admin panel link (admin only) */}
                <PermissionWrapper 
                  requiredRoles={['admin']}
                  showFallback={false}
                >
                  <button
                    onClick={() => handleNavigation('/admin')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors border border-red-200 dark:border-red-800"
                  >
                    ⚙️ Admin
                  </button>
                </PermissionWrapper>

                {/* User menu */}
                <div className="relative">
                  <button className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    👤 Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar with permission-filtered navigation */}
        <div className="flex">
          <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 min-h-screen">
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => (
                <div key={item.path}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                      permission.currentPath === item.path
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.icon && <span className="mr-3">{item.icon}</span>}
                    {item.label}
                  </button>
                  
                  {/* Sub-navigation items */}
                  {item.children && item.children.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((childItem) => (
                        <button
                          key={childItem.path}
                          onClick={() => handleNavigation(childItem.path)}
                          className={`w-full flex items-center px-3 py-1.5 text-xs font-medium rounded text-left transition-colors ${
                            permission.currentPath === childItem.path
                              ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {childItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Permission info footer */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Current Permissions
                </div>
                <div className="space-y-1">
                  <div className="text-gray-600 dark:text-gray-400">
                    Chat: {userRoleHook.canAccessChat ? '✅' : '❌'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Knowledge Base: {userRoleHook.canAccessKnowledgeBase ? '✅' : '❌'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Admin Panel: {userRoleHook.canAccessAdminPanel ? '✅' : '❌'}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </RouteGuard>
  )
}

export default ProtectedLayout