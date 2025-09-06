/**
 * 未授权访问提示组件
 * 当用户无权限访问页面时显示友好的提示信息
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RiErrorWarningLine, RiHomeLine, RiArrowLeftLine, RiCustomerServiceLine } from '@remixicon/react'
import { useUserRole } from '@/hooks/use-user-role'
import { RouteRedirectUtils } from '@/config/route-permissions'
import Button from '@/app/components/base/button'
import PermissionIndicator from '@/components/base/permission-indicator'
import PermissionHelp from '@/components/base/permission-help'

export interface UnauthorizedFallbackProps {
  requiredRoles: string[]
  currentPath?: string
}

const UnauthorizedFallback: React.FC<UnauthorizedFallbackProps> = ({
  requiredRoles,
  currentPath
}) => {
  const { t } = useTranslation()
  const { role, isAdmin } = useUserRole()
  const navigate = useNavigate()

  const handleGoToChat = () => {
    navigate('/chat')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    const defaultPath = RouteRedirectUtils.getDefaultRouteForRole(role?.name || null)
    navigate(defaultPath)
  }

  const getRoleDisplayName = (roleName: string): string => {
    switch (roleName) {
      case 'admin':
        return t('common.role.admin') || '管理员'
      case 'user':
        return t('common.role.user') || '用户'
      default:
        return roleName
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* 图标 */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <RiErrorWarningLine className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {t('access.denied.title') || '访问被拒绝'}
        </h2>

        {/* 描述信息 */}
        <div className="text-gray-600 mb-6 space-y-4">
          <p>
            {t('access.denied.message') || '您没有权限访问此页面。请联系管理员获取必要的访问权限。'}
          </p>
          
          {/* 当前用户角色指示器 */}
          <div className="flex justify-center">
            <PermissionIndicator variant="badge" size="md" />
          </div>
          
          {/* 权限要求信息 */}
          <div className="text-sm bg-gray-50 rounded-md p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">
                {t('access.denied.requiredRoles') || '所需角色：'}
              </span>
              <div className="flex gap-1 flex-wrap">
                {requiredRoles.map((roleName, index) => (
                  <span key={index} className="text-blue-600 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                    {getRoleDisplayName(roleName)}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">
                {t('access.denied.currentRole') || '您的角色：'}
              </span>
              <span className="text-green-600 font-mono text-xs bg-green-100 px-2 py-1 rounded">
                {getRoleDisplayName(role?.name || 'none')}
              </span>
            </div>

            {currentPath && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {t('access.denied.attemptedPath') || '尝试访问路径：'} 
                  <code className="bg-gray-200 px-1 rounded ml-1">{currentPath}</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3 mb-6">
          <Button 
            className="w-full"
            onClick={handleGoToChat}
          >
            <RiHomeLine className="w-4 h-4 mr-2" />
            {t('access.denied.goToChat') || '前往对话页面'}
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="secondary"
              className="flex-1"
              onClick={handleGoBack}
            >
              <RiArrowLeftLine className="w-4 h-4 mr-2" />
              {t('access.denied.goBack') || '返回'}
            </Button>

            <Button 
              variant="secondary"
              className="flex-1"
              onClick={handleGoHome}
            >
              <RiHomeLine className="w-4 h-4 mr-2" />
              {t('access.denied.goHome') || '首页'}
            </Button>
          </div>
        </div>

        {/* 权限帮助组件 */}
        <div className="mb-4">
          <PermissionHelp context="access_denied" />
        </div>

        {/* 联系支持 */}
        <div className="bg-blue-50 rounded-md p-4">
          <div className="flex items-center justify-center gap-2 text-blue-800 mb-2">
            <RiCustomerServiceLine className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t('access.denied.need_help') || '需要帮助？'}
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {t('access.denied.help_text') || '如果您认为这是错误，或需要访问此功能，请联系系统管理员申请相应权限。'}
          </p>
        </div>
      </div>

      {/* 页脚信息 */}
      <div className="mt-6 text-center text-xs text-gray-500">
        {t('access.denied.footer') || 'Dify - AI应用开发平台'}
      </div>
    </div>
  )
}

export default UnauthorizedFallback