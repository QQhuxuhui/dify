"""
Permission Cache System - Redis-based Permission Caching

High-performance permission caching with consistency validation and
intelligent invalidation strategies for optimal security and performance.

Performance Features:
- 5-minute TTL with >90% hit rate target
- Automatic cache invalidation on role changes
- Fallback to database on cache miss
- Performance monitoring and metrics
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from flask import current_app

logger = logging.getLogger(__name__)


class PermissionCache:
    """
    Redis-based permission caching system with security-focused design.
    
    Features:
    - Performance optimization with intelligent caching
    - Cache consistency validation to prevent stale permissions
    - Automatic invalidation on role changes
    - Comprehensive error handling and fallbacks
    """
    
    # Cache configuration
    CACHE_TTL = 300  # 5 minutes
    CACHE_KEY_PREFIX = "user_permissions:"
    ROLE_CACHE_PREFIX = "role_permissions:"
    STATS_KEY = "permission_cache_stats"
    
    @classmethod
    def _get_redis_client(cls):
        """Get Redis client with error handling."""
        try:
            from extensions.ext_redis import redis_client
            return redis_client
        except ImportError:
            logger.warning("Redis not available, permission caching disabled")
            return None
        except Exception as e:
            logger.error(f"Redis connection error: {str(e)}")
            return None
    
    @classmethod
    def get_user_permissions(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached user permissions with validation.
        
        Args:
            user_id: User ID to get permissions for
            
        Returns:
            Dict containing cached permissions or None if cache miss
        """
        try:
            redis_client = cls._get_redis_client()
            if not redis_client:
                return None
            
            cache_key = f"{cls.CACHE_KEY_PREFIX}{user_id}"
            cached_data = redis_client.get(cache_key)
            
            if cached_data:
                permissions_data = json.loads(cached_data)
                
                # Validate cache data structure
                if cls._validate_cache_data(permissions_data):
                    cls._update_cache_stats('hit')
                    logger.debug(f"Cache hit for user {user_id}")
                    return permissions_data
                else:
                    # Invalid cache data, remove it
                    redis_client.delete(cache_key)
                    logger.warning(f"Invalid cache data for user {user_id}, removed")
            
            cls._update_cache_stats('miss')
            return None
            
        except Exception as e:
            logger.warning(f"Cache read error for user {user_id}: {str(e)}")
            cls._update_cache_stats('error')
            return None
    
    @classmethod
    def set_user_permissions(cls, user_id: str, permissions_data: Dict[str, Any]) -> bool:
        """
        Cache user permissions with validation and TTL.
        
        Args:
            user_id: User ID
            permissions_data: Permission data to cache
            
        Returns:
            bool: True if caching successful
        """
        try:
            redis_client = cls._get_redis_client()
            if not redis_client:
                return False
            
            # Validate and enrich permission data
            validated_data = cls._prepare_cache_data(permissions_data)
            
            cache_key = f"{cls.CACHE_KEY_PREFIX}{user_id}"
            redis_client.setex(
                cache_key,
                cls.CACHE_TTL,
                json.dumps(validated_data)
            )
            
            cls._update_cache_stats('write')
            logger.debug(f"Cached permissions for user {user_id}")
            return True
            
        except Exception as e:
            logger.warning(f"Cache write error for user {user_id}: {str(e)}")
            cls._update_cache_stats('error')
            return False
    
    @classmethod
    def invalidate_user_permissions(cls, user_id: str) -> bool:
        """
        Invalidate cached permissions for a specific user.
        
        Args:
            user_id: User ID to invalidate
            
        Returns:
            bool: True if invalidation successful
        """
        try:
            redis_client = cls._get_redis_client()
            if not redis_client:
                return False
            
            cache_key = f"{cls.CACHE_KEY_PREFIX}{user_id}"
            result = redis_client.delete(cache_key)
            
            cls._update_cache_stats('invalidate')
            logger.info(f"Invalidated permissions cache for user {user_id}")
            return result > 0
            
        except Exception as e:
            logger.warning(f"Cache invalidation error for user {user_id}: {str(e)}")
            return False
    
    @classmethod
    def invalidate_role_permissions(cls, role_name: str) -> bool:
        """
        Invalidate all cached permissions for users with specific role.
        
        Args:
            role_name: Role name to invalidate
            
        Returns:
            bool: True if invalidation successful
        """
        try:
            redis_client = cls._get_redis_client()
            if not redis_client:
                return False
            
            # Find all user permission keys
            pattern = f"{cls.CACHE_KEY_PREFIX}*"
            keys = redis_client.keys(pattern)
            
            if not keys:
                return True
            
            # Filter keys for users with the specific role
            invalidated_count = 0
            for key in keys:
                try:
                    cached_data = redis_client.get(key)
                    if cached_data:
                        permissions_data = json.loads(cached_data)
                        if permissions_data.get('role_name') == role_name:
                            redis_client.delete(key)
                            invalidated_count += 1
                except Exception:
                    continue
            
            cls._update_cache_stats('role_invalidate')
            logger.info(f"Invalidated {invalidated_count} permission caches for role {role_name}")
            return True
            
        except Exception as e:
            logger.warning(f"Role cache invalidation error for role {role_name}: {str(e)}")
            return False
    
    @classmethod
    def invalidate_all_permissions(cls) -> bool:
        """
        Invalidate all cached permissions (emergency use only).
        
        Returns:
            bool: True if invalidation successful
        """
        try:
            redis_client = cls._get_redis_client()
            if not redis_client:
                return False
            
            pattern = f"{cls.CACHE_KEY_PREFIX}*"
            keys = redis_client.keys(pattern)
            
            if keys:
                deleted_count = redis_client.delete(*keys)
                cls._update_cache_stats('mass_invalidate')
                logger.warning(f"Mass invalidation: deleted {deleted_count} permission caches")
                return deleted_count > 0
            
            return True
            
        except Exception as e:
            logger.error(f"Mass cache invalidation error: {str(e)}")
            return False
    
    @classmethod
    def get_cache_stats(cls) -> Dict[str, int]:
        """
        Get cache performance statistics.
        
        Returns:
            Dict with cache performance metrics
        """
        try:
            redis_client = cls._get_redis_client()
            if not redis_client:
                return {}
            
            stats_data = redis_client.hgetall(cls.STATS_KEY)
            return {k.decode(): int(v.decode()) for k, v in stats_data.items()}
            
        except Exception as e:
            logger.warning(f"Cache stats retrieval error: {str(e)}")
            return {}
    
    @classmethod
    def reset_cache_stats(cls) -> bool:
        """Reset cache statistics."""
        try:
            redis_client = cls._get_redis_client()
            if not redis_client:
                return False
            
            redis_client.delete(cls.STATS_KEY)
            return True
            
        except Exception:
            return False
    
    @classmethod
    def _validate_cache_data(cls, data: Dict[str, Any]) -> bool:
        """Validate cached permission data structure."""
        required_fields = ['user_id', 'role_name', 'permissions', 'cached_at']
        return all(field in data for field in required_fields)
    
    @classmethod
    def _prepare_cache_data(cls, permissions_data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare and validate permission data for caching."""
        return {
            'user_id': permissions_data.get('user_id'),
            'role_name': permissions_data.get('role_name'),
            'permissions': permissions_data.get('permissions', []),
            'role_hierarchy': permissions_data.get('role_hierarchy', []),
            'cached_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(seconds=cls.CACHE_TTL)).isoformat()
        }
    
    @classmethod
    def _update_cache_stats(cls, operation: str) -> None:
        """Update cache performance statistics."""
        try:
            redis_client = cls._get_redis_client()
            if not redis_client:
                return
            
            redis_client.hincrby(cls.STATS_KEY, operation, 1)
            redis_client.hincrby(cls.STATS_KEY, 'total_operations', 1)
            
        except Exception:
            pass  # Don't let stats updates affect main functionality


class PermissionCacheMiddleware:
    """
    Middleware integration for automatic permission caching.
    
    Provides transparent caching integration with Flask request lifecycle.
    """
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize cache middleware with Flask app."""
        app.config.setdefault('PERMISSION_CACHE_ENABLED', True)
        app.config.setdefault('PERMISSION_CACHE_TTL', 300)
        app.config.setdefault('PERMISSION_CACHE_STATS_ENABLED', True)
        
        # Update cache TTL from config
        PermissionCache.CACHE_TTL = app.config['PERMISSION_CACHE_TTL']
        
        if app.config['PERMISSION_CACHE_ENABLED']:
            logger.info("Permission cache middleware initialized")
    
    @staticmethod
    def cache_user_permissions(user_id: str, role_name: str, permissions: List[str]) -> bool:
        """
        Convenience method to cache user permissions.
        
        Args:
            user_id: User ID
            role_name: User's role name
            permissions: List of permissions
            
        Returns:
            bool: True if caching successful
        """
        permissions_data = {
            'user_id': user_id,
            'role_name': role_name,
            'permissions': permissions,
            'role_hierarchy': permissions  # For this simple case
        }
        
        return PermissionCache.set_user_permissions(user_id, permissions_data)