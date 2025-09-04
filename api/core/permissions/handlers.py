"""
Permission Error Handlers - HTTP Error Response Management

Structured HTTP error handling for permission-related errors with
security-conscious responses and comprehensive audit logging.

Security Features:
- Sanitized error responses to prevent information disclosure (SEC-004 mitigation)  
- Consistent error format aligned with existing API standards
- Comprehensive audit logging for security monitoring
- Rate limiting integration for failed permission attempts
"""

import logging
from typing import Dict, Any, Tuple, Optional
from datetime import datetime, timedelta

from flask import Flask, jsonify, request, current_app, g
from flask_login import current_user
from werkzeug.exceptions import HTTPException

from .exceptions import (
    PermissionDeniedError,
    AuthenticationRequiredError,
    InvalidPermissionError,
    RoleNotFoundError,
    PermissionCacheError
)

logger = logging.getLogger(__name__)


class PermissionErrorHandler:
    """
    Comprehensive error handler for permission-related HTTP errors.
    
    Features:
    - Structured error responses matching API standards
    - Security-conscious error message sanitization
    - Rate limiting for failed permission attempts
    - Comprehensive audit logging
    """
    
    def __init__(self, app: Optional[Flask] = None):
        self.failed_attempts = {}  # Simple in-memory rate limiting
        self.rate_limit_window = 300  # 5 minutes
        self.max_attempts = 10  # Max failed attempts per window
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """
        Initialize error handler with Flask application.
        
        Args:
            app: Flask application instance
        """
        # Configuration
        app.config.setdefault('PERMISSION_ERROR_LOGGING', True)
        app.config.setdefault('PERMISSION_RATE_LIMITING', True)
        app.config.setdefault('PERMISSION_DETAILED_ERRORS', False)  # Security: disabled by default
        
        # Register error handlers
        self.register_error_handlers(app)
        
        logger.info("Permission error handlers initialized")
    
    def register_error_handlers(self, app: Flask):
        """Register all permission-related error handlers."""
        
        @app.errorhandler(PermissionDeniedError)
        def handle_permission_denied(error: PermissionDeniedError) -> Tuple[Dict[str, Any], int]:
            return self._handle_permission_denied(error)
        
        @app.errorhandler(AuthenticationRequiredError)
        def handle_authentication_required(error: AuthenticationRequiredError) -> Tuple[Dict[str, Any], int]:
            return self._handle_authentication_required(error)
        
        @app.errorhandler(InvalidPermissionError)
        def handle_invalid_permission(error: InvalidPermissionError) -> Tuple[Dict[str, Any], int]:
            return self._handle_invalid_permission(error)
        
        @app.errorhandler(RoleNotFoundError)
        def handle_role_not_found(error: RoleNotFoundError) -> Tuple[Dict[str, Any], int]:
            return self._handle_role_not_found(error)
        
        @app.errorhandler(PermissionCacheError)
        def handle_permission_cache_error(error: PermissionCacheError) -> Tuple[Dict[str, Any], int]:
            return self._handle_cache_error(error)
    
    def _handle_permission_denied(self, error: PermissionDeniedError) -> Tuple[Dict[str, Any], int]:
        """
        Handle permission denied errors (403 Forbidden).
        
        Args:
            error: PermissionDeniedError instance
            
        Returns:
            Tuple of (error_response, status_code)
        """
        # Check rate limiting
        if self._is_rate_limited():
            return self._create_rate_limit_response(), 429
        
        # Log security event
        self._log_security_event('PERMISSION_DENIED', error)
        
        # Track failed attempt for rate limiting
        self._track_failed_attempt()
        
        # Create sanitized error response
        response_data = error.to_api_response()
        
        # Enhance with additional context if configured
        if current_app.config.get('PERMISSION_DETAILED_ERRORS', False):
            response_data['error']['timestamp'] = datetime.utcnow().isoformat()
            response_data['error']['request_id'] = self._get_request_id()
        
        return response_data, 403
    
    def _handle_authentication_required(self, error: AuthenticationRequiredError) -> Tuple[Dict[str, Any], int]:
        """
        Handle authentication required errors (401 Unauthorized).
        
        Args:
            error: AuthenticationRequiredError instance
            
        Returns:
            Tuple of (error_response, status_code)
        """
        # Log authentication event
        self._log_security_event('AUTHENTICATION_REQUIRED', error)
        
        # Track failed attempt
        self._track_failed_attempt()
        
        # Create response
        response_data = error.to_api_response()
        
        # Add WWW-Authenticate header for proper HTTP semantics
        headers = {'WWW-Authenticate': 'Bearer realm="API"'}
        
        if current_app.config.get('PERMISSION_DETAILED_ERRORS', False):
            response_data['error']['timestamp'] = datetime.utcnow().isoformat()
            response_data['error']['request_id'] = self._get_request_id()
        
        return response_data, 401
    
    def _handle_invalid_permission(self, error: InvalidPermissionError) -> Tuple[Dict[str, Any], int]:
        """
        Handle invalid permission configuration errors.
        
        Returns generic permission denied for security.
        """
        # Log configuration error
        logger.error(f"Invalid permission configuration: {error.message}")
        self._log_security_event('INVALID_PERMISSION_CONFIG', error)
        
        # Return generic permission denied for security
        generic_error = PermissionDeniedError("Access denied")
        return self._handle_permission_denied(generic_error)
    
    def _handle_role_not_found(self, error: RoleNotFoundError) -> Tuple[Dict[str, Any], int]:
        """
        Handle role not found errors.
        
        Returns generic permission denied for security.
        """
        # Log configuration error
        logger.error(f"Role not found: {error.message}")
        self._log_security_event('ROLE_NOT_FOUND', error)
        
        # Return generic permission denied for security
        generic_error = PermissionDeniedError("Access denied")
        return self._handle_permission_denied(generic_error)
    
    def _handle_cache_error(self, error: PermissionCacheError) -> Tuple[Dict[str, Any], int]:
        """
        Handle permission cache errors.
        
        Logs error but returns generic permission denied for security.
        """
        # Log cache error
        logger.warning(f"Permission cache error: {error.message}")
        
        # Return generic error (don't expose cache internals)
        generic_error = PermissionDeniedError("Access denied")
        return self._handle_permission_denied(generic_error)
    
    def _is_rate_limited(self) -> bool:
        """
        Check if current request is rate limited.
        
        Returns:
            bool: True if request should be rate limited
        """
        if not current_app.config.get('PERMISSION_RATE_LIMITING', True):
            return False
        
        client_id = self._get_client_identifier()
        now = datetime.utcnow()
        
        # Clean old attempts
        self._clean_old_attempts(now)
        
        # Check if rate limited
        attempts = self.failed_attempts.get(client_id, [])
        recent_attempts = [
            attempt for attempt in attempts
            if (now - attempt).total_seconds() < self.rate_limit_window
        ]
        
        return len(recent_attempts) >= self.max_attempts
    
    def _track_failed_attempt(self):
        """Track failed permission attempt for rate limiting."""
        if not current_app.config.get('PERMISSION_RATE_LIMITING', True):
            return
        
        client_id = self._get_client_identifier()
        now = datetime.utcnow()
        
        if client_id not in self.failed_attempts:
            self.failed_attempts[client_id] = []
        
        self.failed_attempts[client_id].append(now)
        
        # Keep only recent attempts
        self.failed_attempts[client_id] = [
            attempt for attempt in self.failed_attempts[client_id]
            if (now - attempt).total_seconds() < self.rate_limit_window
        ]
    
    def _clean_old_attempts(self, now: datetime):
        """Clean old failed attempts to prevent memory buildup."""
        cutoff = now - timedelta(seconds=self.rate_limit_window)
        
        for client_id in list(self.failed_attempts.keys()):
            self.failed_attempts[client_id] = [
                attempt for attempt in self.failed_attempts[client_id]
                if attempt > cutoff
            ]
            
            # Remove empty entries
            if not self.failed_attempts[client_id]:
                del self.failed_attempts[client_id]
    
    def _get_client_identifier(self) -> str:
        """Get unique client identifier for rate limiting."""
        # Use IP + User ID if authenticated, otherwise just IP
        ip_address = request.remote_addr or 'unknown'
        
        if current_user.is_authenticated:
            return f"{ip_address}:{current_user.id}"
        else:
            return ip_address
    
    def _create_rate_limit_response(self) -> Dict[str, Any]:
        """Create rate limit exceeded response."""
        return {
            'error': {
                'code': 'RATE_LIMIT_EXCEEDED',
                'message': 'Too many failed permission attempts. Please try again later.',
                'details': {
                    'retry_after': self.rate_limit_window
                }
            }
        }
    
    def _log_security_event(self, event_type: str, error: Exception):
        """
        Log security events for monitoring and audit.
        
        Args:
            event_type: Type of security event
            error: Exception that occurred
        """
        if not current_app.config.get('PERMISSION_ERROR_LOGGING', True):
            return
        
        try:
            log_data = {
                'event_type': event_type,
                'error_message': str(error),
                'endpoint': request.endpoint,
                'method': request.method,
                'path': request.path,
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')[:200],
                'user_id': current_user.id if current_user.is_authenticated else None,
                'user_role': (current_user.user_role.name 
                            if current_user.is_authenticated and current_user.user_role 
                            else None),
                'timestamp': datetime.utcnow().isoformat(),
                'request_id': self._get_request_id()
            }
            
            # Add error-specific details
            if hasattr(error, 'details'):
                log_data['error_details'] = error.details
            
            # Log as security event
            logger.warning(f"SECURITY_EVENT: {log_data}")
            
            # Additional security logging for critical events
            if event_type in ['PERMISSION_DENIED', 'AUTHENTICATION_REQUIRED']:
                # This could trigger external security monitoring
                logger.security(f"SECURITY: {event_type} - {log_data}")  # type: ignore
                
        except Exception as e:
            logger.error(f"Failed to log security event: {str(e)}")
    
    def _get_request_id(self) -> Optional[str]:
        """Get unique request ID for tracking."""
        try:
            # Try to get request ID from various sources
            if hasattr(g, 'request_id'):
                return g.request_id
            
            # Generate simple request ID based on request info
            import hashlib
            request_info = f"{request.method}:{request.path}:{request.remote_addr}:{datetime.utcnow().isoformat()}"
            return hashlib.md5(request_info.encode()).hexdigest()[:8]
            
        except Exception:
            return None


# Global error handler instance
_error_handler = PermissionErrorHandler()


def init_permission_error_handling(app: Flask) -> PermissionErrorHandler:
    """
    Initialize permission error handling for Flask app.
    
    Args:
        app: Flask application instance
        
    Returns:
        PermissionErrorHandler instance
    """
    _error_handler.init_app(app)
    return _error_handler


def create_custom_error_response(
    code: str,
    message: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None
) -> Tuple[Dict[str, Any], int]:
    """
    Create custom error response matching API standards.
    
    Args:
        code: Error code
        message: Error message
        status_code: HTTP status code
        details: Additional error details
        
    Returns:
        Tuple of (error_response, status_code)
    """
    response = {
        'error': {
            'code': code,
            'message': message,
            'details': details or {}
        }
    }
    
    if current_app.config.get('PERMISSION_DETAILED_ERRORS', False):
        response['error']['timestamp'] = datetime.utcnow().isoformat()
    
    return response, status_code