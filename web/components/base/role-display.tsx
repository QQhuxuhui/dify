/**
 * Role Display Component
 * 
 * Displays user role information with styling and optional actions.
 * Supports different display modes and customization options.
 */

'use client'

import type { FC } from 'react'
import { useMemo } from 'react'
import type { UserRole, RoleName } from '@/types/user-role'
import { useUserRole } from '@/hooks/use-user-role'

export interface RoleDisplayProps {
  /**
   * Display mode for the role component
   * - badge: Small badge format
   * - chip: Larger chip format with icon
   * - text: Plain text format
   * - detailed: Full role information with description
   */
  mode?: 'badge' | 'chip' | 'text' | 'detailed'
  
  /**
   * Override role to display (useful for showing other users' roles)
   */
  role?: UserRole | null
  
  /**
   * Show role description alongside name
   */
  showDescription?: boolean
  
  /**
   * Custom CSS classes
   */
  className?: string
  
  /**
   * Click handler for interactive role display
   */
  onClick?: () => void
}

/**
 * RoleDisplay - Shows user role with configurable styling and information
 */
const RoleDisplay: FC<RoleDisplayProps> = ({
  mode = 'badge',
  role: overrideRole,
  showDescription = false,
  className = '',
  onClick,
}) => {
  const { role: currentUserRole } = useUserRole()
  
  // Use override role if provided, otherwise current user role
  const displayRole = overrideRole || currentUserRole

  // Role styling configuration
  const roleStyles = useMemo(() => {
    const baseStyles = {
      admin: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        border: 'border-red-200 dark:border-red-800',
        icon: '👑',
      },
      user: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-200 dark:border-blue-800',
        icon: '👤',
      },
    }

    if (!displayRole) {
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/20',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800',
        icon: '❓',
      }
    }

    return baseStyles[displayRole.name as RoleName] || baseStyles.user
  }, [displayRole])

  // Handle missing role
  if (!displayRole) {
    if (mode === 'text') {
      return <span className={`text-gray-500 ${className}`}>No Role</span>
    }
    
    return (
      <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${roleStyles.bg} ${roleStyles.text} ${roleStyles.border} border ${className}`}>
        <span className="mr-1">{roleStyles.icon}</span>
        No Role
      </div>
    )
  }

  // Role name with proper capitalization
  const roleName = displayRole.name.charAt(0).toUpperCase() + displayRole.name.slice(1)

  // Render based on mode
  switch (mode) {
    case 'text':
      return (
        <span 
          className={`${roleStyles.text} ${onClick ? 'cursor-pointer hover:underline' : ''} ${className}`}
          onClick={onClick}
        >
          {roleName}
        </span>
      )

    case 'chip':
      return (
        <div 
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full ${roleStyles.bg} ${roleStyles.text} ${roleStyles.border} border ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
          onClick={onClick}
        >
          <span className="mr-1.5 text-base">{roleStyles.icon}</span>
          <span>{roleName}</span>
          {showDescription && displayRole.description && (
            <span className="ml-1.5 opacity-75 text-xs">
              • {displayRole.description}
            </span>
          )}
        </div>
      )

    case 'detailed':
      return (
        <div 
          className={`inline-flex flex-col p-3 rounded-lg ${roleStyles.bg} ${roleStyles.border} border ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
          onClick={onClick}
        >
          <div className="flex items-center mb-1">
            <span className="mr-2 text-lg">{roleStyles.icon}</span>
            <span className={`font-semibold ${roleStyles.text}`}>
              {roleName}
            </span>
          </div>
          {displayRole.description && (
            <p className={`text-sm ${roleStyles.text} opacity-80`}>
              {displayRole.description}
            </p>
          )}
          <div className="flex items-center mt-2 space-x-4 text-xs opacity-60">
            <span>ID: {displayRole.id.slice(0, 8)}...</span>
            <span>Active: {displayRole.is_active ? '✓' : '✗'}</span>
          </div>
        </div>
      )

    default: // 'badge'
      return (
        <span 
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${roleStyles.bg} ${roleStyles.text} ${roleStyles.border} border ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
          onClick={onClick}
        >
          <span className="mr-1">{roleStyles.icon}</span>
          {roleName}
        </span>
      )
  }
}

export default RoleDisplay

// Export convenience components for common use cases
export const AdminBadge: FC<{ className?: string }> = ({ className }) => (
  <RoleDisplay 
    mode="badge" 
    role={{ 
      id: 'admin', 
      name: 'admin', 
      description: 'Administrator', 
      is_active: true,
      created_at: '',
      updated_at: ''
    }} 
    className={className} 
  />
)

export const UserBadge: FC<{ className?: string }> = ({ className }) => (
  <RoleDisplay 
    mode="badge" 
    role={{ 
      id: 'user', 
      name: 'user', 
      description: 'Standard User', 
      is_active: true,
      created_at: '',
      updated_at: ''
    }} 
    className={className} 
  />
)