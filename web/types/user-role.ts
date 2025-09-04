/**
 * User Role Types for Permission System
 * 
 * Comprehensive TypeScript definitions for the frontend permission system
 * integrating with Story 1.2 backend API responses.
 */

// Core role definitions
export type RoleName = 'admin' | 'user'

export interface UserRole {
  id: string
  name: RoleName
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Extended user interface with role information (AC1)
export interface UserWithRole {
  id: string
  email: string
  name: string
  avatar?: string
  interface_language?: string
  interface_theme?: string
  timezone?: string
  status: string
  created_at: string
  last_active_at: string
  role: UserRole | null // From Story 1.2 API response
}

// Permission system types
export type Permission = 
  | 'chat' 
  | 'knowledge_base' 
  | 'admin_panel' 
  | 'user_management'
  | 'system_settings'

export interface RoutePermission {
  path: string
  requiredRoles: RoleName[]
  fallbackPath?: string
  description?: string
}

// Permission check utilities type definitions
export interface PermissionContext {
  user: UserWithRole | null
  role: UserRole | null
  permissions: Permission[]
  isAuthenticated: boolean
  isLoading: boolean
}

export interface PermissionHookReturn {
  // Role checks
  role: UserRole | null
  isAdmin: boolean
  isUser: boolean
  hasRole: (roleName: RoleName) => boolean
  hasAnyRole: (roleNames: RoleName[]) => boolean
  
  // Permission checks
  canAccess: (requiredRoles: RoleName[]) => boolean
  canAccessRoute: (routePath: string) => boolean
  canAccessChat: boolean
  canAccessKnowledgeBase: boolean
  canAccessAdminPanel: boolean
  
  // State
  isAuthenticated: boolean
  isLoading: boolean
}

// Route permission configuration
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Public routes (no role required)
  { 
    path: '/signin', 
    requiredRoles: [],
    description: 'Sign in page - public access'
  },
  { 
    path: '/signup', 
    requiredRoles: [],
    description: 'Sign up page - public access'
  },
  
  // User and Admin accessible routes
  { 
    path: '/chat', 
    requiredRoles: ['admin', 'user'],
    fallbackPath: '/signin',
    description: 'Chat interface - requires authentication'
  },
  { 
    path: '/datasets', 
    requiredRoles: ['admin', 'user'],
    fallbackPath: '/signin',
    description: 'Dataset management - requires authentication'
  },
  { 
    path: '/explore', 
    requiredRoles: ['admin', 'user'],
    fallbackPath: '/signin',
    description: 'App exploration - requires authentication'
  },
  
  // Admin-only routes
  { 
    path: '/admin', 
    requiredRoles: ['admin'],
    fallbackPath: '/chat',
    description: 'Admin panel - admin only'
  },
  { 
    path: '/admin/*', 
    requiredRoles: ['admin'],
    fallbackPath: '/chat',
    description: 'Admin sub-pages - admin only'
  },
  { 
    path: '/settings/workspace', 
    requiredRoles: ['admin'],
    fallbackPath: '/chat',
    description: 'Workspace settings - admin only'
  },
  { 
    path: '/settings/members', 
    requiredRoles: ['admin'],
    fallbackPath: '/chat',
    description: 'Member management - admin only'
  }
]

// Role hierarchy definition (matches backend)
export const ROLE_HIERARCHY: Record<RoleName, RoleName[]> = {
  admin: ['admin', 'user'], // Admin inherits user permissions
  user: ['user']
}

// Permission mapping to roles
export const PERMISSION_ROLE_MAP: Record<Permission, RoleName[]> = {
  chat: ['admin', 'user'],
  knowledge_base: ['admin', 'user'], 
  admin_panel: ['admin'],
  user_management: ['admin'],
  system_settings: ['admin']
}

// Local storage keys for role persistence
export const STORAGE_KEYS = {
  USER_ROLE: 'user_role',
  USER_DATA: 'user_data',
  PERMISSION_CACHE: 'permission_cache'
} as const

// API response types (matching Story 1.2 backend)
export interface UserAPIResponse {
  user: UserWithRole
}

export interface RoleUpdateResponse {
  success: boolean
  message: string
  user: UserWithRole
}