/**
 * Permission Middleware for Next.js Route Protection
 * 
 * Provides route-level permission validation and automatic redirects
 * for unauthorized access attempts.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { RoleName } from '@/types/user-role'
import { ROUTE_PERMISSIONS } from '@/types/user-role'

// Mock user data retrieval - in real implementation, this would
// decrypt and validate JWT tokens or session cookies
interface UserSession {
  id: string
  role: {
    name: RoleName
    is_active: boolean
  }
  isAuthenticated: boolean
}

/**
 * Extract user session from request headers/cookies
 * This is a placeholder implementation - real implementation would
 * validate JWT tokens or session cookies
 */
function extractUserSession(request: NextRequest): UserSession | null {
  // TODO: Implement actual session/token validation
  // For now, return null to indicate unauthenticated
  
  const authCookie = request.cookies.get('auth-token')
  const userCookie = request.cookies.get('user-data')
  
  if (!authCookie || !userCookie) {
    return null
  }

  try {
    // In real implementation, validate and decrypt the tokens
    const userData = JSON.parse(userCookie.value)
    
    return {
      id: userData.id,
      role: userData.role,
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('Failed to parse user session:', error)
    return null
  }
}

/**
 * Check if user has permission to access a route
 */
function hasRoutePermission(
  userSession: UserSession | null, 
  pathname: string
): { allowed: boolean; fallbackPath?: string; reason?: string } {
  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup', '/api/auth', '/api/public']
  
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return { allowed: true }
  }

  // API routes - let them handle their own authentication
  if (pathname.startsWith('/api/')) {
    return { allowed: true }
  }

  // Static assets
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon') || 
      pathname.includes('.')) {
    return { allowed: true }
  }

  // Check authentication for protected routes
  if (!userSession?.isAuthenticated) {
    return { 
      allowed: false, 
      fallbackPath: '/signin',
      reason: 'Authentication required'
    }
  }

  // Find matching route permission
  let routePermission = ROUTE_PERMISSIONS.find(rp => rp.path === pathname)
  
  // Check for wildcard matches
  if (!routePermission) {
    routePermission = ROUTE_PERMISSIONS.find(rp => {
      if (rp.path.endsWith('/*')) {
        const basePath = rp.path.slice(0, -2)
        return pathname.startsWith(basePath)
      }
      return false
    })
  }

  // If no specific permission found, allow authenticated access
  if (!routePermission) {
    return { allowed: true }
  }

  // Empty required roles means public access
  if (routePermission.requiredRoles.length === 0) {
    return { allowed: true }
  }

  // Check role-based access with hierarchy support
  const userRole = userSession.role.name
  const hasAccess = routePermission.requiredRoles.some(requiredRole => {
    // Admin has access to everything
    if (userRole === 'admin') return true
    
    // Direct role match
    return userRole === requiredRole
  })

  if (!hasAccess) {
    return {
      allowed: false,
      fallbackPath: routePermission.fallbackPath || '/chat',
      reason: `Requires one of: ${routePermission.requiredRoles.join(', ')}`
    }
  }

  return { allowed: true }
}

/**
 * Permission middleware function
 */
export function permissionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Extract user session from request
  const userSession = extractUserSession(request)
  
  // Check route permission
  const permissionCheck = hasRoutePermission(userSession, pathname)
  
  if (!permissionCheck.allowed) {
    // Log security event
    console.warn(`Access denied to ${pathname}:`, {
      reason: permissionCheck.reason,
      userSession: userSession ? {
        id: userSession.id,
        role: userSession.role.name,
      } : null,
      timestamp: new Date().toISOString(),
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
    })

    // Redirect to fallback route
    if (permissionCheck.fallbackPath) {
      const redirectUrl = new URL(permissionCheck.fallbackPath, request.url)
      
      // Add redirect reason as query parameter for user feedback
      redirectUrl.searchParams.set('redirect_reason', 'permission_denied')
      redirectUrl.searchParams.set('attempted_path', pathname)
      
      return NextResponse.redirect(redirectUrl)
    }

    // Return 403 if no fallback path
    return new NextResponse('Access Denied', { status: 403 })
  }

  // Permission granted - continue to route
  return NextResponse.next()
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}

export default permissionMiddleware