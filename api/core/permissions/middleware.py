"""
Permission Middleware - Flask Request Lifecycle Integration

Multi-layer permission validation middleware that integrates with Flask
request processing to provide comprehensive security validation.

Security Features:
- Request-level permission caching to prevent repeated DB queries
- Comprehensive audit logging for security monitoring
- Flask-Login integration with automatic user context
- Performance optimization with intelligent caching
"""

import logging
from typing import Optional, Dict, Any, List
import time

from flask import Flask, request, g, current_app, jsonify
from flask_login import current_user

from .cache import PermissionCache, PermissionCacheMiddleware
from .checker import PermissionChecker
from .exceptions import (
    PermissionDeniedError,
    AuthenticationRequiredError, 
    PermissionCacheError
)

logger = logging.getLogger(__name__)


class PermissionMiddleware:
    """
    Flask permission middleware with comprehensive security validation.
    
    Integrates with Flask request lifecycle to provide:
    - Request-level permission caching
    - User context enrichment with role information
    - Performance monitoring and audit logging
    - Automatic cache management
    """
    
    def __init__(self, app: Optional[Flask] = None):
        self.app = app
        self.cache_middleware = PermissionCacheMiddleware()
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """
        Initialize permission middleware with Flask application.
        
        Args:
            app: Flask application instance
        """
        # Initialize cache middleware
        self.cache_middleware.init_app(app)
        
        # Configuration defaults
        app.config.setdefault('PERMISSION_MIDDLEWARE_ENABLED', True)
        app.config.setdefault('PERMISSION_AUDIT_ENABLED', True)
        app.config.setdefault('PERMISSION_PERFORMANCE_MONITORING', True)
        app.config.setdefault('PERMISSION_REQUEST_CACHE_ENABLED', True)
        
        if app.config.get('PERMISSION_MIDDLEWARE_ENABLED', True):
            # Register middleware hooks
            app.before_request(self.before_request_handler)
            app.after_request(self.after_request_handler)
            
            logger.info("Permission middleware initialized successfully")
        else:
            logger.info("Permission middleware disabled via configuration")
    
    def before_request_handler(self):
        """
        Before request handler for permission middleware.
        
        Sets up request-level permission context and caching.
        """
        try:
            # Initialize request-level permission context
            g.permission_context = {
                'start_time': time.time(),
                'cache_hits': 0,
                'permission_checks': 0,
                'user_permissions': None
            }
            
            # Skip middleware for excluded paths
            if self._should_skip_middleware():
                return
            
            # Enrich user context with permissions if authenticated
            if current_user.is_authenticated:
                self._enrich_user_context()
            
        except Exception as e:
            logger.error(f"Permission middleware before_request error: {str(e)}")
            # Don't block request on middleware errors
    
    def after_request_handler(self, response):
        """
        After request handler for permission middleware.
        
        Handles audit logging and performance monitoring.
        
        Args:
            response: Flask response object
            
        Returns:
            Flask response object
        """
        try:
            if hasattr(g, 'permission_context'):
                self._log_request_completion(response)
                
                # Performance monitoring
                if current_app.config.get('PERMISSION_PERFORMANCE_MONITORING'):
                    self._monitor_performance()
            
        except Exception as e:
            logger.error(f"Permission middleware after_request error: {str(e)}")
        
        return response
    
    def _should_skip_middleware(self) -> bool:
        """
        Determine if middleware should be skipped for current request.
        
        Returns:
            bool: True if middleware should be skipped
        """
        # Skip for health checks, static files, etc.
        excluded_paths = [
            '/health',
            '/api/health', 
            '/static/',
            '/favicon.ico'
        ]
        
        if request.path in excluded_paths:
            return True
        
        # Skip for paths that start with excluded prefixes
        excluded_prefixes = [
            '/static/',
            '/assets/',
            '/_health'
        ]
        
        for prefix in excluded_prefixes:
            if request.path.startswith(prefix):
                return True
        
        return False
    
    def _enrich_user_context(self):
        """
        Enrich user context with permission information.
        
        Loads user permissions into request context for efficient access
        throughout the request lifecycle.
        """
        try:
            if not current_user or not current_user.is_authenticated:
                return
            
            # Try to get permissions from cache first
            cached_permissions = None
            if current_app.config.get('PERMISSION_REQUEST_CACHE_ENABLED', True):
                cached_permissions = PermissionCache.get_user_permissions(current_user.id)
            
            if cached_permissions:
                g.permission_context['user_permissions'] = cached_permissions
                g.permission_context['cache_hits'] += 1
                logger.debug(f"Loaded cached permissions for user {current_user.id}")
            else:
                # Load fresh permissions and cache them
                permissions = self._load_user_permissions()
                if permissions:
                    g.permission_context['user_permissions'] = permissions
                    
                    # Cache for future requests
                    if current_app.config.get('PERMISSION_REQUEST_CACHE_ENABLED', True):
                        PermissionCache.set_user_permissions(current_user.id, permissions)
                        logger.debug(f"Cached permissions for user {current_user.id}")
                
        except Exception as e:
            logger.warning(f"Failed to enrich user context: {str(e)}")
            # Don't block request on context enrichment errors
    
    def _load_user_permissions(self) -> Optional[Dict[str, Any]]:
        """
        Load user permissions from database.
        
        Returns:
            Dict containing user permission information
        """
        try:
            if not current_user or not current_user.user_role:
                return None
            
            permissions = PermissionChecker.get_user_permissions(current_user)
            
            return {
                'user_id': current_user.id,
                'role_name': current_user.user_role.name,
                'permissions': permissions,
                'role_hierarchy': permissions,  # Same for this simple case
                'role_data': current_user.user_role.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Failed to load user permissions: {str(e)}")
            return None
    
    def _log_request_completion(self, response):
        """
        Log request completion with permission context.
        
        Args:
            response: Flask response object
        """
        if not current_app.config.get('PERMISSION_AUDIT_ENABLED', True):
            return
        
        try:
            context = g.permission_context
            duration = time.time() - context['start_time']
            
            log_data = {
                'endpoint': request.endpoint,
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
                'permission_checks': context['permission_checks'],
                'cache_hits': context['cache_hits'],
                'user_id': current_user.id if current_user.is_authenticated else None,
                'user_role': (current_user.user_role.name 
                            if current_user.is_authenticated and current_user.user_role 
                            else None),
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')[:200]  # Truncate long user agents
            }
            
            # Log based on status code
            if response.status_code >= 400:
                logger.warning(f"Request completed with error: {log_data}")
            else:
                logger.info(f"Request completed successfully: {log_data}")
                
        except Exception as e:
            logger.error(f"Failed to log request completion: {str(e)}")
    
    def _monitor_performance(self):
        """Monitor and log performance metrics."""
        try:
            context = g.permission_context
            duration = time.time() - context['start_time']
            
            # Log slow requests
            slow_request_threshold = current_app.config.get('SLOW_REQUEST_THRESHOLD_MS', 1000)
            if duration * 1000 > slow_request_threshold:
                logger.warning(f"Slow request detected: {request.endpoint} took {duration*1000:.2f}ms")
            
            # Monitor cache efficiency
            cache_hit_rate = (
                context['cache_hits'] / max(context['permission_checks'], 1) * 100
                if context['permission_checks'] > 0 else 0
            )
            
            if cache_hit_rate < 50 and context['permission_checks'] > 0:
                logger.warning(f"Low cache hit rate: {cache_hit_rate:.1f}% for {request.endpoint}")
                
        except Exception as e:
            logger.error(f"Performance monitoring error: {str(e)}")
    
    @staticmethod
    def get_current_user_permissions() -> Optional[Dict[str, Any]]:
        """
        Get current user's permissions from request context.
        
        Returns:
            Dict containing user permissions or None if not available
        """
        try:
            if hasattr(g, 'permission_context') and g.permission_context:
                return g.permission_context.get('user_permissions')
            return None
        except Exception:
            return None
    
    @staticmethod
    def increment_permission_check():
        """Increment permission check counter for monitoring."""
        try:
            if hasattr(g, 'permission_context'):
                g.permission_context['permission_checks'] += 1
        except Exception:
            pass
    
    @staticmethod
    def increment_cache_hit():
        """Increment cache hit counter for monitoring."""
        try:
            if hasattr(g, 'permission_context'):
                g.permission_context['cache_hits'] += 1
        except Exception:
            pass


def create_permission_error_handlers(app: Flask):
    """
    Create Flask error handlers for permission exceptions.
    
    Args:
        app: Flask application instance
    """
    
    @app.errorhandler(PermissionDeniedError)
    def handle_permission_denied(error):
        """Handle permission denied errors."""
        logger.warning(f"Permission denied: {error.message}")
        return jsonify(error.to_api_response()), 403
    
    @app.errorhandler(AuthenticationRequiredError)
    def handle_authentication_required(error):
        """Handle authentication required errors."""
        logger.warning(f"Authentication required: {error.message}")
        return jsonify(error.to_api_response()), 401
    
    logger.info("Permission error handlers registered")


# Convenience functions for integration
def init_permission_system(app: Flask) -> PermissionMiddleware:
    """
    Initialize complete permission system with Flask app.
    
    Args:
        app: Flask application instance
        
    Returns:
        PermissionMiddleware instance
    """
    # Initialize middleware
    middleware = PermissionMiddleware(app)
    
    # Register error handlers
    create_permission_error_handlers(app)
    
    logger.info("Complete permission system initialized")
    return middleware