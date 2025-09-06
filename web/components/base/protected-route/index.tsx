/**
 * ProtectedRoute 组件
 * 基于用户角色的路由保护组件
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUserRole } from '@/hooks/use-user-role'
import { useRouteProtection } from '@/hooks/use-route-protection'
import { RouteRedirectUtils } from '@/config/route-permissions'
import UnauthorizedFallback from './unauthorized-fallback'

export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles: string[]
  fallbackPath?: string
  showFallback?: boolean
  exactMatch?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  fallbackPath,
  showFallback = false,
  exactMatch = false
}) => {
  const { user, role, isLoading } = useUserRole()
  const location = useLocation()
  const { checkRoutePermission } = useRouteProtection()

  // 如果正在加载用户信息，显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    return (
      <Navigate 
        to="/signin" 
        state={{ from: location }}
        replace 
      />
    )
  }

  // 如果是公开路由（无角色要求），允许访问
  if (requiredRoles.length === 0) {
    return <>{children}</>
  }

  // 检查当前用户角色是否有权限访问
  const hasPermission = requiredRoles.includes(role?.name || '')

  if (!hasPermission) {
    // 如果设置了显示回退组件，则显示未授权页面
    if (showFallback) {
      return (
        <UnauthorizedFallback 
          requiredRoles={requiredRoles}
          currentPath={location.pathname}
        />
      )
    }

    // 否则重定向到回退路径
    const redirectPath = fallbackPath || RouteRedirectUtils.getFallbackRoute(
      location.pathname, 
      role?.name || null
    )

    return (
      <Navigate 
        to={redirectPath} 
        state={{ 
          from: location,
          reason: 'insufficient_permissions',
          requiredRoles,
          userRole: role?.name
        }}
        replace 
      />
    )
  }

  // 用户有权限，渲染子组件
  return <>{children}</>
}

export default ProtectedRoute