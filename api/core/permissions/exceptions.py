"""
Permission Exception Classes

Custom exceptions for permission validation errors with comprehensive 
security context and audit-friendly error handling.

Security Features:
- Sanitized error messages prevent information disclosure
- Comprehensive context for audit logging
- Structured error data for API responses
"""

from typing import List, Optional


class PermissionError(Exception):
    """Base class for all permission-related errors."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class PermissionDeniedError(PermissionError):
    """
    Raised when user lacks required permissions.
    
    Contains detailed context for audit logging while providing
    sanitized error messages for API responses.
    """
    
    def __init__(
        self, 
        message: str, 
        required_roles: Optional[List[str]] = None,
        user_role: Optional[str] = None,
        resource: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        details = {
            'required_roles': required_roles or [],
            'user_role': user_role,
            'resource': resource,
            'user_id': user_id  # For audit logging only, not API response
        }
        super().__init__(message, details)
        self.required_roles = required_roles or []
        self.user_role = user_role
        self.resource = resource
        self.user_id = user_id

    def to_api_response(self) -> dict:
        """Convert to sanitized API error response (SEC-004 mitigation)."""
        return {
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': self.message,
                'details': {
                    'required_roles': self.required_roles,
                    'user_role': self.user_role,
                    'resource': self.resource
                    # Note: user_id excluded from API response for security
                }
            }
        }


class InvalidPermissionError(PermissionError):
    """Raised when permission configuration is invalid."""
    
    def __init__(self, message: str, permission_config: Optional[str] = None):
        details = {'permission_config': permission_config}
        super().__init__(message, details)
        self.permission_config = permission_config


class RoleNotFoundError(PermissionError):
    """Raised when a required role doesn't exist in the system."""
    
    def __init__(self, message: str, role_name: Optional[str] = None):
        details = {'role_name': role_name}
        super().__init__(message, details)
        self.role_name = role_name


class AuthenticationRequiredError(PermissionError):
    """Raised when authentication is required but user is not authenticated."""
    
    def __init__(self, message: str = "Authentication required", resource: Optional[str] = None):
        details = {'resource': resource}
        super().__init__(message, details)
        self.resource = resource
        
    def to_api_response(self) -> dict:
        """Convert to sanitized API error response."""
        return {
            'error': {
                'code': 'AUTHENTICATION_REQUIRED',
                'message': self.message,
                'details': {
                    'resource': self.resource
                }
            }
        }


class PermissionCacheError(PermissionError):
    """Raised when permission cache operations fail."""
    
    def __init__(self, message: str, operation: Optional[str] = None):
        details = {'operation': operation}
        super().__init__(message, details)
        self.operation = operation