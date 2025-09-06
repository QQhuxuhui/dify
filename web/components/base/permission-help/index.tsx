/**
 * Permission Help Component
 * 
 * Provides contextual help and guidance for permission-related issues
 */

'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiQuestionLine, RiCloseLine, RiArrowRightLine, RiShieldUserLine, RiUserLine } from '@remixicon/react'
import { useUserRole } from '@/hooks/use-user-role'
import Button from '@/app/components/base/button'

interface PermissionHelpProps {
  context?: 'general' | 'access_denied' | 'feature_limited'
  className?: string
}

const PermissionHelp: React.FC<PermissionHelpProps> = ({
  context = 'general',
  className = ''
}) => {
  const { t } = useTranslation()
  const { role, isAdmin } = useUserRole()
  const [isExpanded, setIsExpanded] = useState(false)

  const getHelpContent = () => {
    switch (context) {
      case 'access_denied':
        return {
          title: t('permission.help.access_denied.title') || '访问被拒绝',
          description: t('permission.help.access_denied.description') || '您当前的角色无权访问此功能。',
          suggestions: [
            t('permission.help.access_denied.suggestion1') || '联系管理员申请必要权限',
            t('permission.help.access_denied.suggestion2') || '返回您有权访问的页面',
            t('permission.help.access_denied.suggestion3') || '查看帮助文档了解更多信息'
          ]
        }
      
      case 'feature_limited':
        return {
          title: t('permission.help.feature_limited.title') || '功能受限',
          description: t('permission.help.feature_limited.description') || '您的当前角色对此功能有限制。',
          suggestions: [
            t('permission.help.feature_limited.suggestion1') || '了解您当前角色的权限范围',
            t('permission.help.feature_limited.suggestion2') || '联系管理员获取更多权限',
            t('permission.help.feature_limited.suggestion3') || '使用您有权限的功能'
          ]
        }
      
      default:
        return {
          title: t('permission.help.general.title') || '权限说明',
          description: t('permission.help.general.description') || '系统采用基于角色的权限控制。',
          suggestions: []
        }
    }
  }

  const getRolePermissions = () => {
    return [
      {
        role: 'admin',
        name: t('common.role.admin') || '管理员',
        icon: RiShieldUserLine,
        permissions: [
          t('permission.admin.full_access') || '完整系统访问权限',
          t('permission.admin.user_management') || '用户管理',
          t('permission.admin.system_settings') || '系统设置',
          t('permission.admin.all_features') || '所有功能模块'
        ],
        color: 'text-blue-600'
      },
      {
        role: 'user',
        name: t('common.role.user') || '用户',
        icon: RiUserLine,
        permissions: [
          t('permission.user.chat') || 'AI对话功能',
          t('permission.user.knowledge_base') || '知识库文档上传',
          t('permission.user.basic_features') || '基础功能使用'
        ],
        color: 'text-green-600'
      }
    ]
  }

  const helpContent = getHelpContent()
  const rolePermissions = getRolePermissions()
  const currentRolePermissions = rolePermissions.find(rp => rp.role === role?.name)

  if (!isExpanded) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="text-blue-600 hover:text-blue-700"
        >
          <RiQuestionLine className="w-4 h-4 mr-1" />
          {t('permission.help.button') || '权限帮助'}
        </Button>
      </div>
    )
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-blue-900 font-semibold text-sm">{helpContent.title}</h4>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-blue-600 hover:text-blue-700"
        >
          <RiCloseLine className="w-4 h-4" />
        </button>
      </div>

      <p className="text-blue-800 text-sm mb-4">{helpContent.description}</p>

      {/* Current Role Info */}
      {currentRolePermissions && (
        <div className="mb-4">
          <h5 className="text-blue-900 font-medium text-xs mb-2">
            {t('permission.help.current_role') || '您的当前角色'}
          </h5>
          <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-100">
            <currentRolePermissions.icon className={`w-4 h-4 ${currentRolePermissions.color}`} />
            <span className={`font-medium text-sm ${currentRolePermissions.color}`}>
              {currentRolePermissions.name}
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {currentRolePermissions.permissions.map((permission, index) => (
              <li key={index} className="flex items-center gap-2 text-xs text-blue-700">
                <RiArrowRightLine className="w-3 h-3 text-blue-500" />
                {permission}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {helpContent.suggestions.length > 0 && (
        <div>
          <h5 className="text-blue-900 font-medium text-xs mb-2">
            {t('permission.help.suggestions') || '建议'}
          </h5>
          <ul className="space-y-1">
            {helpContent.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-blue-700">
                <RiArrowRightLine className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contact Admin Button for non-admin users */}
      {!isAdmin && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <Button
            variant="secondary"
            size="sm"
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            {t('permission.help.contact_admin') || '联系管理员'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default PermissionHelp