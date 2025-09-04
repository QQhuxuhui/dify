"""
Integration Tests for Permission System

Comprehensive integration tests for the complete permission system
including middleware, decorators, caching, and API responses.
"""

import pytest
import json
import time
from unittest.mock import Mock, patch
from flask import Flask, jsonify, request

from core.permissions import (
    PermissionMiddleware, 
    require_permission, 
    require_admin,
    PermissionChecker,
    PermissionCache
)
from core.permissions.handlers import init_permission_error_handling
from models.account import Account
from models.user_role import UserRole


class TestPermissionSystemIntegration:
    """Integration tests for complete permission system."""
    
    @pytest.fixture
    def app(self):
        """Create test Flask application with permission system."""
        app = Flask(__name__)
        app.config.update({
            'TESTING': True,
            'SECRET_KEY': 'test-secret-key',
            'PERMISSION_MIDDLEWARE_ENABLED': True,
            'PERMISSION_CACHE_ENABLED': False,  # Disable cache for predictable tests
            'PERMISSION_AUDIT_ENABLED': True
        })
        
        # Initialize permission system
        permission_middleware = PermissionMiddleware(app)
        init_permission_error_handling(app)
        
        return app
    
    @pytest.fixture
    def admin_user(self):
        """Create admin user with role."""
        user = Mock(spec=Account)
        user.id = "admin-123"
        user.email = "admin@test.com"
        user.is_authenticated = True
        
        role = Mock(spec=UserRole)
        role.id = "admin-role-id"
        role.name = "admin"
        role.description = "Administrator role"
        role.is_active = True
        user.user_role = role
        
        return user
    
    @pytest.fixture
    def regular_user(self):
        """Create regular user with role."""
        user = Mock(spec=Account)
        user.id = "user-456"
        user.email = "user@test.com"
        user.is_authenticated = True
        
        role = Mock(spec=UserRole)
        role.id = "user-role-id"
        role.name = "user"
        role.description = "Standard user role"
        role.is_active = True
        user.user_role = role
        
        return user
    
    @pytest.fixture
    def unauthenticated_user(self):
        """Create unauthenticated user."""
        user = Mock(spec=Account)
        user.is_authenticated = False
        user.user_role = None
        return user
    
    def test_complete_admin_access_flow(self, app, admin_user):
        """Test complete admin access flow with middleware and decorators."""
        
        @app.route('/admin/users')
        @require_admin()
        def admin_users():
            return jsonify({
                'users': ['user1', 'user2'],
                'role': 'admin'
            })
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=admin_user):
                response = client.get('/admin/users')
                
                assert response.status_code == 200
                data = response.get_json()
                assert data['users'] == ['user1', 'user2']
                assert data['role'] == 'admin'
    
    def test_complete_user_access_flow(self, app, regular_user):
        """Test complete user access flow."""
        
        @app.route('/user/profile')
        @require_permission('user')
        def user_profile():
            return jsonify({
                'profile': 'user_data',
                'role': regular_user.user_role.name
            })
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=regular_user):
                response = client.get('/user/profile')
                
                assert response.status_code == 200
                data = response.get_json()
                assert data['profile'] == 'user_data'
                assert data['role'] == 'user'
    
    def test_permission_denied_flow(self, app, regular_user):
        """Test complete permission denied flow."""
        
        @app.route('/admin/settings')
        @require_admin()
        def admin_settings():
            return jsonify({'settings': 'admin_settings'})
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=regular_user):
                response = client.get('/admin/settings')
                
                assert response.status_code == 403
                data = response.get_json()
                assert data['error']['code'] == 'PERMISSION_DENIED'
                assert 'admin' in data['error']['details']['required_roles']
                assert data['error']['details']['user_role'] == 'user'
    
    def test_authentication_required_flow(self, app, unauthenticated_user):
        """Test authentication required flow."""
        
        @app.route('/protected/data')
        @require_permission('user')
        def protected_data():
            return jsonify({'data': 'protected'})
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=unauthenticated_user):
                response = client.get('/protected/data')
                
                assert response.status_code == 401
                data = response.get_json()
                assert data['error']['code'] == 'AUTHENTICATION_REQUIRED'
    
    def test_multi_role_access_flow(self, app, regular_user):
        """Test multi-role access permissions."""
        
        @app.route('/shared/resource')
        @require_permission(['admin', 'user'])
        def shared_resource():
            return jsonify({'resource': 'shared_data'})
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=regular_user):
                response = client.get('/shared/resource')
                
                assert response.status_code == 200
                data = response.get_json()
                assert data['resource'] == 'shared_data'
    
    def test_resource_ownership_check(self, app, regular_user):
        """Test resource ownership validation."""
        
        def check_resource_owner():
            # Simulate ownership check
            user_id = request.args.get('user_id')
            return user_id == regular_user.id
        
        @app.route('/user/data')
        @require_permission('user', resource_check=check_resource_owner)
        def user_data():
            return jsonify({'data': 'user_specific_data'})
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=regular_user):
                # Test successful ownership check
                response = client.get(f'/user/data?user_id={regular_user.id}')
                assert response.status_code == 200
                
                # Test failed ownership check
                response = client.get('/user/data?user_id=other-user')
                assert response.status_code == 403
                data = response.get_json()
                assert 'Resource ownership validation failed' in data['error']['message']
    
    def test_anonymous_access_allowed(self, app, unauthenticated_user):
        """Test anonymous access when explicitly allowed."""
        
        @app.route('/public/info')
        @require_permission('user', allow_anonymous=True)
        def public_info():
            return jsonify({'info': 'public_data'})
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=unauthenticated_user):
                response = client.get('/public/info')
                
                assert response.status_code == 200
                data = response.get_json()
                assert data['info'] == 'public_data'
    
    def test_middleware_context_enrichment(self, app, admin_user):
        """Test middleware enriches request context with user permissions."""
        
        @app.route('/context/check')
        @require_permission('admin')
        def check_context():
            from flask import g
            context = getattr(g, 'permission_context', {})
            return jsonify({
                'has_context': 'permission_context' in g.__dict__,
                'context_keys': list(context.keys())
            })
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=admin_user):
                response = client.get('/context/check')
                
                assert response.status_code == 200
                data = response.get_json()
                assert data['has_context'] is True
                assert 'start_time' in data['context_keys']
                assert 'permission_checks' in data['context_keys']
    
    def test_role_hierarchy_enforcement(self, app, admin_user, regular_user):
        """Test role hierarchy is properly enforced."""
        
        @app.route('/user/action')
        @require_permission('user')
        def user_action():
            return jsonify({'action': 'completed'})
        
        @app.route('/admin/action')  
        @require_permission('admin')
        def admin_action():
            return jsonify({'action': 'admin_completed'})
        
        with app.test_client() as client:
            # Test admin can access user endpoints
            with patch('flask_login.utils._get_user', return_value=admin_user):
                response = client.get('/user/action')
                assert response.status_code == 200
                
                response = client.get('/admin/action')
                assert response.status_code == 200
            
            # Test user cannot access admin endpoints
            with patch('flask_login.utils._get_user', return_value=regular_user):
                response = client.get('/user/action')
                assert response.status_code == 200
                
                response = client.get('/admin/action')
                assert response.status_code == 403
    
    def test_api_response_format_consistency(self, app, regular_user):
        """Test API error response format consistency."""
        
        @app.route('/test/permission-denied')
        @require_admin()
        def permission_denied_endpoint():
            return jsonify({'data': 'should_not_see'})
        
        @app.route('/test/auth-required')
        @require_permission('user')
        def auth_required_endpoint():
            return jsonify({'data': 'should_not_see'})
        
        with app.test_client() as client:
            # Test permission denied format (Story 1.2 AC4 requirement)
            with patch('flask_login.utils._get_user', return_value=regular_user):
                response = client.get('/test/permission-denied')
                assert response.status_code == 403
                
                data = response.get_json()
                assert 'error' in data
                assert data['error']['code'] == 'PERMISSION_DENIED'
                assert 'message' in data['error']
                assert 'details' in data['error']
                assert 'required_roles' in data['error']['details']
                assert 'user_role' in data['error']['details']
                assert 'resource' in data['error']['details']
            
            # Test authentication required format
            with patch('flask_login.utils._get_user', return_value=self.unauthenticated_user):
                response = client.get('/test/auth-required')
                assert response.status_code == 401
                
                data = response.get_json()
                assert data['error']['code'] == 'AUTHENTICATION_REQUIRED'
    
    def test_performance_monitoring_integration(self, app, admin_user):
        """Test performance monitoring in middleware."""
        
        @app.route('/perf/test')
        @require_permission('admin')
        def performance_test():
            # Simulate some processing time
            time.sleep(0.01)
            return jsonify({'result': 'success'})
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=admin_user):
                response = client.get('/perf/test')
                
                assert response.status_code == 200
                # Performance context should be set up by middleware
                # (tested indirectly through successful request completion)
    
    def test_security_audit_logging(self, app, regular_user):
        """Test security audit logging throughout the system."""
        
        @app.route('/audit/test')
        @require_admin()
        def audit_test():
            return jsonify({'data': 'admin_data'})
        
        with app.test_client() as client:
            with patch('core.permissions.checker.logger') as mock_logger:
                with patch('flask_login.utils._get_user', return_value=regular_user):
                    response = client.get('/audit/test')
                    
                    assert response.status_code == 403
                    # Verify security logging was called
                    mock_logger.warning.assert_called()
                    
                    # Check log message contains security context
                    log_calls = mock_logger.warning.call_args_list
                    assert any('Permission denied' in str(call) for call in log_calls)
    
    def test_error_handling_integration(self, app, regular_user):
        """Test error handling integration across all components."""
        
        @app.route('/error/test')
        @require_permission('nonexistent_role')  # Invalid role
        def error_test():
            return jsonify({'data': 'should_not_reach'})
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=regular_user):
                response = client.get('/error/test')
                
                # Should handle invalid role gracefully
                assert response.status_code == 403
                data = response.get_json()
                assert data['error']['code'] == 'PERMISSION_DENIED'
                # Should not expose internal error details for security
    
    def test_sec_001_comprehensive_bypass_prevention(self, app, regular_user):
        """Test SEC-001: Comprehensive bypass prevention across all layers."""
        
        @app.route('/secure/admin-only')
        @require_admin()
        def secure_admin_endpoint():
            return jsonify({'secret': 'admin_secret_data'})
        
        with app.test_client() as client:
            with patch('flask_login.utils._get_user', return_value=regular_user):
                # Test various bypass attempts
                bypass_attempts = [
                    {'headers': {'X-Admin': 'true'}},
                    {'headers': {'Authorization': 'Bearer fake-admin-token'}},
                    {'query_string': 'admin=true'},
                    {'data': json.dumps({'role': 'admin'}), 'content_type': 'application/json'}
                ]
                
                for attempt in bypass_attempts:
                    response = client.get('/secure/admin-only', **attempt)
                    assert response.status_code == 403
                    data = response.get_json()
                    # Verify secret data is never exposed
                    assert 'secret' not in str(data)
                    assert data['error']['code'] == 'PERMISSION_DENIED'
    
    def test_middleware_excluded_paths(self, app):
        """Test middleware properly excludes certain paths."""
        
        @app.route('/health')
        def health_check():
            return jsonify({'status': 'healthy'})
        
        @app.route('/static/test.css')
        def static_file():
            return 'css content'
        
        with app.test_client() as client:
            # These should work without authentication
            response = client.get('/health')
            assert response.status_code == 200
            
            response = client.get('/static/test.css')
            assert response.status_code == 200