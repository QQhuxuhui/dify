"""
Permission System for Role-Based Access Control

This module provides comprehensive permission middleware and decorators 
for securing API endpoints with multi-layer validation.

Security Features:
- Multi-layer validation to prevent bypass attacks  
- Role hierarchy support (admin > user)
- Resource ownership validation
- Comprehensive audit logging
"""

from .checker import PermissionChecker
from .decorators import require_permission, require_admin, require_authenticated
from .exceptions import PermissionDeniedError, InvalidPermissionError, RoleNotFoundError
from .middleware import PermissionMiddleware

__all__ = [
    'PermissionChecker',
    'require_permission', 
    'require_admin',
    'require_authenticated',
    'PermissionDeniedError',
    'InvalidPermissionError', 
    'RoleNotFoundError',
    'PermissionMiddleware'
]