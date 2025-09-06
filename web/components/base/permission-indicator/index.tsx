/**
 * Permission Indicator Component
 * 
 * Displays user's current role and permission status in various UI contexts
 */

'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { RiShieldUserLine, RiUserLine, RiLockLine } from '@remixicon/react'
import { useUserRole } from '@/hooks/use-user-role'
import type { RoleName } from '@/types/user-role'

interface PermissionIndicatorProps {
  variant?: 'badge' | 'tooltip' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showText?: boolean
  className?: string
}

const PermissionIndicator: React.FC<PermissionIndicatorProps> = ({
  variant = 'badge',
  size = 'md',
  showIcon = true,
  showText = true,
  className = ''
}) => {
  const { t } = useTranslation()
  const { role, isAdmin } = useUserRole()

  if (!role) return null

  const getRoleConfig = (roleName: RoleName) => {
    switch (roleName) {
      case 'admin':
        return {
          icon: RiShieldUserLine,
          label: t('common.role.admin') || '管理员',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          description: t('common.role.admin.description') || '拥有系统完整访问权限'
        }
      case 'user':
        return {
          icon: RiUserLine,
          label: t('common.role.user') || '用户',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          description: t('common.role.user.description') || '可访问对话和知识库功能'
        }
      default:
        return {
          icon: RiLockLine,
          label: roleName,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          description: ''
        }
    }
  }

  const config = getRoleConfig(role.name)
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} ${className}`}>
        {showIcon && <config.icon className="w-3 h-3" />}
        {showText && <span className="font-medium">{config.label}</span>}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-1 ${config.textColor} ${className}`}>
        {showIcon && <config.icon className="w-4 h-4" />}
        {showText && <span className="text-sm font-medium">{config.label}</span>}
      </div>
    )
  }

  if (variant === 'tooltip') {
    return (
      <div 
        className={`inline-flex items-center gap-1 ${config.textColor} ${className}`}
        title={`${config.label}: ${config.description}`}
      >
        {showIcon && <config.icon className="w-4 h-4" />}
        {showText && <span className="text-sm">{config.label}</span>}
      </div>
    )
  }

  return null
}

export default PermissionIndicator