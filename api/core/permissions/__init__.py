"""
Permission System for Role-Based Access Control

This module provides comprehensive permission middleware and decorators 
for securing API endpoints with multi-layer validation.

Security Features:
- Multi-layer validation to prevent bypass attacks (SEC-001 mitigation)
- Role hierarchy support (admin > user)
- Resource ownership validation
- Comprehensive audit logging
- Redis-based performance caching
- Structured error handling
"""

from .checker import PermissionChecker
from .decorators import require_permission, require_admin, require_authenticated, allow_anonymous
from .exceptions import (
    PermissionDeniedError, 
    InvalidPermissionError, 
    RoleNotFoundError,
    AuthenticationRequiredError,
    PermissionCacheError
)
from .middleware import PermissionMiddleware, init_permission_system
from .cache import PermissionCache, PermissionCacheMiddleware
from .handlers import PermissionErrorHandler, init_permission_error_handling

__all__ = [
    # Core Components
    'PermissionChecker',
    'PermissionMiddleware', 
    'PermissionCache',
    'PermissionCacheMiddleware',
    'PermissionErrorHandler',
    
    # Decorators
    'require_permission', 
    'require_admin',
    'require_authenticated',
    'allow_anonymous',
    
    # Exceptions
    'PermissionDeniedError',
    'InvalidPermissionError', 
    'RoleNotFoundError',
    'AuthenticationRequiredError',
    'PermissionCacheError',
    
    # Initialization Functions
    'init_permission_system',
    'init_permission_error_handling'
]

# Version info
__version__ = '1.0.0'
__author__ = 'Dify Development Team'

# Security note
SECURITY_NOTICE = """
This permission system implements comprehensive security measures to prevent
SEC-001 permission bypass vulnerabilities. All components work together to
provide defense-in-depth protection:

1. Multi-layer validation (middleware → decorator → endpoint)
2. Role hierarchy enforcement (admin > user)  
3. Resource ownership validation
4. Comprehensive audit logging
5. Performance-optimized caching
6. Structured error handling

For security updates and best practices, see the implementation plan.
"""