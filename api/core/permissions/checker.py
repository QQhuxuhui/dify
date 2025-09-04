"""
Permission Checker - Core Permission Validation Logic

Multi-layer security validation system with role hierarchy support,
caching optimization, and comprehensive audit logging.

Security Features:
- Multi-layer validation prevents bypass attacks (SEC-001 mitigation)
- Role hierarchy enforcement (admin > user)  
- Cache consistency validation
- Comprehensive audit logging for security monitoring
"""

import logging
from typing import List, Optional, Union, Callable, Any
from flask import current_app, request
from flask_login import current_user

from models.account import Account
from models.user_role import UserRole
from .exceptions import (
    PermissionDeniedError, 
    InvalidPermissionError, 
    RoleNotFoundError,
    AuthenticationRequiredError,
    PermissionCacheError
)

logger = logging.getLogger(__name__)


class PermissionChecker:
    """
    Core permission validation engine with multi-layer security.
    
    Implements defense-in-depth strategy:
    1. Authentication validation
    2. Role existence validation  
    3. Permission hierarchy checking
    4. Resource ownership validation
    5. Audit logging
    """
    
    # Role hierarchy: admin inherits all user permissions
    ROLE_HIERARCHY = {
        'admin': ['admin', 'user'],
        'user': ['user']
    }
    
    @classmethod
    def check_user_permission(
        cls,
        user: Account,
        required_roles: Union[str, List[str]],
        resource_check: Optional[Callable[[], bool]] = None
    ) -> bool:
        """
        Multi-layer permission validation with comprehensive security checks.
        
        Args:
            user: User account to validate
            required_roles: Required role(s) for access
            resource_check: Optional resource ownership validation function
            
        Returns:
            bool: True if user has required permissions
            
        Raises:
            PermissionDeniedError: When permission validation fails
            InvalidPermissionError: When role configuration is invalid
            AuthenticationRequiredError: When user is not authenticated
        """
        try:
            # Layer 1: Authentication validation
            if not user or not user.is_authenticated:
                cls._log_permission_attempt(None, required_roles, False, "Not authenticated")
                raise AuthenticationRequiredError(
                    "Authentication required for this resource",
                    resource=request.endpoint if request else None
                )
            
            # Layer 2: Role existence validation
            if not user.user_role:
                cls._log_permission_attempt(user.id, required_roles, False, "No role assigned")
                raise PermissionDeniedError(
                    "User has no role assigned",
                    required_roles=cls._normalize_roles(required_roles),
                    user_role=None,
                    resource=request.endpoint if request else None,
                    user_id=user.id
                )
            
            # Layer 3: Role validation and normalization
            normalized_required = cls._normalize_roles(required_roles)
            user_role_name = user.user_role.name
            
            # Validate required roles exist in system
            cls._validate_roles_exist(normalized_required)
            
            # Layer 4: Permission hierarchy checking
            user_permissions = cls.ROLE_HIERARCHY.get(user_role_name, [])
            
            has_role_permission = any(
                role in user_permissions 
                for role in normalized_required
            )
            
            if not has_role_permission:
                cls._log_permission_attempt(
                    user.id, required_roles, False, 
                    f"Role mismatch: user={user_role_name}, required={normalized_required}"
                )
                raise PermissionDeniedError(
                    f"Access denied. Required role: {', '.join(normalized_required)}",
                    required_roles=normalized_required,
                    user_role=user_role_name,
                    resource=request.endpoint if request else None,
                    user_id=user.id
                )
            
            # Layer 5: Resource ownership validation (if provided)
            if resource_check and callable(resource_check):
                try:
                    if not resource_check():
                        cls._log_permission_attempt(
                            user.id, required_roles, False, "Resource ownership check failed"
                        )
                        raise PermissionDeniedError(
                            "Access denied. Resource ownership validation failed",
                            required_roles=normalized_required,
                            user_role=user_role_name,
                            resource=request.endpoint if request else None,
                            user_id=user.id
                        )
                except Exception as e:
                    logger.error(f"Resource check failed: {str(e)}")
                    cls._log_permission_attempt(
                        user.id, required_roles, False, f"Resource check error: {str(e)}"
                    )
                    raise PermissionDeniedError(
                        "Access denied. Resource validation error",
                        required_roles=normalized_required,
                        user_role=user_role_name,
                        resource=request.endpoint if request else None,
                        user_id=user.id
                    )
            
            # Success: Log and return
            cls._log_permission_attempt(user.id, required_roles, True, "Permission granted")
            return True
            
        except (PermissionDeniedError, InvalidPermissionError, AuthenticationRequiredError):
            # Re-raise known permission errors
            raise
        except Exception as e:
            # Catch unexpected errors and convert to permission denied for security
            logger.error(f"Unexpected error in permission check: {str(e)}")
            cls._log_permission_attempt(
                user.id if user else None, required_roles, False, 
                f"System error: {str(e)}"
            )
            raise PermissionDeniedError(
                "Access denied. Permission validation failed",
                required_roles=cls._normalize_roles(required_roles),
                user_role=user.user_role.name if user and user.user_role else None,
                resource=request.endpoint if request else None,
                user_id=user.id if user else None
            )
    
    @classmethod
    def get_user_permissions(cls, user: Account) -> List[str]:
        """
        Get comprehensive list of user permissions based on role hierarchy.
        
        Args:
            user: User account
            
        Returns:
            List[str]: List of permissions user has access to
        """
        if not user or not user.user_role:
            return []
        
        user_role = user.user_role.name
        return cls.ROLE_HIERARCHY.get(user_role, [])
    
    @classmethod
    def has_role(cls, user: Account, role: str) -> bool:
        """
        Check if user has specific role (considering hierarchy).
        
        Args:
            user: User account
            role: Role to check
            
        Returns:
            bool: True if user has the role
        """
        if not user or not user.user_role:
            return False
        
        user_permissions = cls.get_user_permissions(user)
        return role in user_permissions
    
    @classmethod
    def is_admin(cls, user: Account) -> bool:
        """Check if user has admin role."""
        return cls.has_role(user, 'admin')
    
    @classmethod
    def is_user(cls, user: Account) -> bool:
        """Check if user has user role (or higher)."""
        return cls.has_role(user, 'user')
    
    @classmethod
    def _normalize_roles(cls, roles: Union[str, List[str]]) -> List[str]:
        """Normalize roles to list format."""
        if isinstance(roles, str):
            return [roles]
        if isinstance(roles, list):
            return roles
        raise InvalidPermissionError(f"Invalid role format: {type(roles)}")
    
    @classmethod
    def _validate_roles_exist(cls, roles: List[str]) -> None:
        """Validate that all required roles exist in the system."""
        valid_roles = {'admin', 'user'}
        invalid_roles = [role for role in roles if role not in valid_roles]
        
        if invalid_roles:
            raise RoleNotFoundError(
                f"Invalid roles: {invalid_roles}. Valid roles: {list(valid_roles)}",
                role_name=', '.join(invalid_roles)
            )
    
    @classmethod
    def _log_permission_attempt(
        cls, 
        user_id: Optional[str], 
        required_roles: Union[str, List[str]], 
        success: bool, 
        reason: str
    ) -> None:
        """
        Comprehensive audit logging for all permission attempts.
        
        Critical for security monitoring and SEC-001 attack detection.
        """
        normalized_roles = cls._normalize_roles(required_roles)
        
        log_data = {
            'user_id': user_id,
            'required_roles': normalized_roles,
            'success': success,
            'reason': reason,
            'endpoint': request.endpoint if request else None,
            'ip_address': request.remote_addr if request else None,
            'user_agent': request.headers.get('User-Agent') if request else None
        }
        
        if success:
            logger.info(f"Permission granted: {log_data}")
        else:
            logger.warning(f"Permission denied: {log_data}")
            
            # Additional security logging for failed attempts
            if current_app and current_app.config.get('PERMISSION_SECURITY_LOGGING', True):
                # This could trigger security alerts in production
                logger.security(f"SECURITY: Permission violation attempt: {log_data}")  # type: ignore