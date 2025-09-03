"""
User Roles API Controller

Provides secure API endpoints for role management.
Implements authentication and rate limiting to prevent security issues.
"""
from flask import request, jsonify
from flask_restful import Resource
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from controllers.console import api
from controllers.console.wraps import account_initialization_required
from libs.login import login_required
from models.user_role import UserRole
from models.account import Account
from services.errors.user_role import UserRoleNotFoundError, InvalidRoleError


# Rate limiting for security (addresses SEC-002 and SEC-003)
limiter = Limiter(key_func=get_remote_address)


class UserRoleListApi(Resource):
    """
    API endpoint for user roles listing.
    
    Security features:
    - Requires authentication to prevent role enumeration
    - Rate limited to prevent abuse
    - Only returns basic role information
    """
    
    decorators = [account_initialization_required, login_required]
    
    @limiter.limit("30/minute")  # Rate limiting for SEC-003
    def get(self):
        """Get list of all active user roles."""
        try:
            roles = UserRole.get_all_active()
            return jsonify({
                'result': 'success',
                'data': [role.to_dict() for role in roles],
                'total': len(roles)
            })
        except Exception as e:
            return jsonify({
                'result': 'error',
                'message': 'Failed to retrieve roles'
            }), 500


class UserRoleDetailApi(Resource):
    """
    API endpoint for individual user role details.
    
    Security features:
    - Requires authentication
    - Rate limited
    - Validates role existence without exposing system details
    """
    
    decorators = [account_initialization_required, login_required]
    
    @limiter.limit("60/minute")  # Rate limiting for SEC-003
    def get(self, role_id):
        """Get details of a specific role by ID."""
        try:
            # Validate role_id format to prevent injection attacks
            if not role_id or len(role_id) > 50:
                return jsonify({
                    'result': 'error',
                    'message': 'Invalid role ID format'
                }), 400
            
            role = UserRole.query.filter_by(id=role_id, is_active=True).first()
            if not role:
                return jsonify({
                    'result': 'error',
                    'message': 'Role not found'
                }), 404
            
            return jsonify({
                'result': 'success',
                'data': role.to_dict()
            })
        except Exception as e:
            return jsonify({
                'result': 'error',
                'message': 'Failed to retrieve role'
            }), 500


class UserRoleApi(Resource):
    """
    API endpoint for user role operations.
    
    Security features:
    - Admin-only access for role management
    - Input validation
    - Rate limiting
    """
    
    decorators = [account_initialization_required, login_required]
    
    @limiter.limit("10/minute")  # Lower limit for write operations
    def get(self, user_id):
        """Get role for a specific user."""
        try:
            current_user = Account.query.filter_by(id=request.current_user.id).first()
            
            # Only admin users can query other users' roles
            if not current_user.is_system_admin and current_user.id != user_id:
                return jsonify({
                    'result': 'error',
                    'message': 'Insufficient permissions'
                }), 403
            
            user = Account.query.filter_by(id=user_id).first()
            if not user:
                return jsonify({
                    'result': 'error',
                    'message': 'User not found'
                }), 404
            
            return jsonify({
                'result': 'success',
                'data': {
                    'user_id': user.id,
                    'role': user.user_role.to_dict() if user.user_role else None
                }
            })
        except Exception as e:
            return jsonify({
                'result': 'error',
                'message': 'Failed to retrieve user role'
            }), 500
    
    @limiter.limit("5/minute")  # Very restrictive for role changes
    def put(self, user_id):
        """Update role for a specific user (admin only)."""
        try:
            current_user = Account.query.filter_by(id=request.current_user.id).first()
            
            # Only system admin can change roles
            if not current_user.is_system_admin:
                return jsonify({
                    'result': 'error',
                    'message': 'Only system administrators can modify user roles'
                }), 403
            
            # Validate request data
            data = request.get_json()
            if not data or 'role_name' not in data:
                return jsonify({
                    'result': 'error',
                    'message': 'Role name is required'
                }), 400
            
            role_name = data['role_name']
            if role_name not in ('admin', 'user'):
                return jsonify({
                    'result': 'error',
                    'message': 'Invalid role name. Must be "admin" or "user"'
                }), 400
            
            # Get target user
            user = Account.query.filter_by(id=user_id).first()
            if not user:
                return jsonify({
                    'result': 'error',
                    'message': 'User not found'
                }), 404
            
            # Get new role
            new_role = UserRole.get_by_name(role_name)
            if not new_role:
                return jsonify({
                    'result': 'error',
                    'message': 'Role not found'
                }), 404
            
            # Update user role
            user.role_id = new_role.id
            db.session.commit()
            
            return jsonify({
                'result': 'success',
                'message': f'User role updated to {role_name}',
                'data': {
                    'user_id': user.id,
                    'role': new_role.to_dict()
                }
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'result': 'error',
                'message': 'Failed to update user role'
            }), 500


# Register API endpoints
api.add_resource(UserRoleListApi, '/roles')
api.add_resource(UserRoleDetailApi, '/roles/<string:role_id>')
api.add_resource(UserRoleApi, '/users/<string:user_id>/role')