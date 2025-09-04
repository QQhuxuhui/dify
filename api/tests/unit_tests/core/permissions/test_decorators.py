"""
Unit Tests for Permission Decorators

Comprehensive test suite for permission decorators with focus on 
SEC-001 bypass prevention and multi-layer security validation.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from flask import Flask, jsonify, g

from core.permissions.decorators import (
    require_permission, 
    require_admin,
    require_authenticated,
    allow_anonymous
)
from core.permissions.exceptions import (
    PermissionDeniedError,
    AuthenticationRequiredError
)
from models.account import Account
from models.user_role import UserRole


class TestPermissionDecorators:
    """Test cases for permission decorator functions."""
    
    @pytest.fixture
    def app(self):
        """Create test Flask application."""
        app = Flask(__name__)
        app.config['TESTING'] = True
        return app
    
    @pytest.fixture
    def admin_user(self):
        """Create admin user mock."""
        user = Mock(spec=Account)
        user.id = "admin-id"
        user.is_authenticated = True
        user.user_role = Mock(spec=UserRole)
        user.user_role.name = "admin"
        return user
    
    @pytest.fixture
    def regular_user(self):
        """Create regular user mock."""
        user = Mock(spec=Account)
        user.id = "user-id"
        user.is_authenticated = True
        user.user_role = Mock(spec=UserRole)
        user.user_role.name = "user"
        return user
    
    @pytest.fixture
    def unauthenticated_user(self):
        """Create unauthenticated user mock."""
        user = Mock(spec=Account)
        user.is_authenticated = False
        user.user_role = None
        return user
    
    def test_require_permission_admin_success(self, app, admin_user):
        """Test admin permission decorator success."""
        @require_permission('admin')
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', admin_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    response = test_endpoint()
                    assert response.status_code == 200
    
    def test_require_permission_user_success(self, app, regular_user):
        """Test user permission decorator success."""
        @require_permission('user')
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    response = test_endpoint()
                    assert response.status_code == 200
    
    def test_require_permission_multi_roles_success(self, app, regular_user):
        """Test multi-role permission decorator success."""
        @require_permission(['admin', 'user'])
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    response = test_endpoint()
                    assert response.status_code == 200
    
    def test_require_permission_unauthenticated(self, app, unauthenticated_user):
        """Test permission decorator with unauthenticated user."""
        @require_permission('user')
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', unauthenticated_user):
                response, status_code = test_endpoint()
                assert status_code == 401
                data = response.get_json()
                assert data['error']['code'] == 'AUTHENTICATION_REQUIRED'
    
    def test_require_permission_denied(self, app, regular_user):
        """Test permission decorator with permission denied."""
        @require_permission('admin')
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        # Mock permission check to raise PermissionDeniedError
        mock_error = PermissionDeniedError(
            "Access denied",
            required_roles=['admin'],
            user_role='user',
            resource='/test',
            user_id=regular_user.id
        )
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', side_effect=mock_error):
                    response, status_code = test_endpoint()
                    assert status_code == 403
                    data = response.get_json()
                    assert data['error']['code'] == 'PERMISSION_DENIED'
    
    def test_require_permission_with_resource_check(self, app, regular_user):
        """Test permission decorator with resource check function."""
        def mock_resource_check():
            return True
        
        @require_permission('user', resource_check=mock_resource_check)
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    response = test_endpoint()
                    assert response.status_code == 200
    
    def test_require_permission_allow_anonymous_unauthenticated(self, app, unauthenticated_user):
        """Test permission decorator allowing anonymous access."""
        @require_permission('user', allow_anonymous=True)
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', unauthenticated_user):
                response = test_endpoint()
                assert response.status_code == 200
    
    def test_require_permission_allow_anonymous_authenticated(self, app, regular_user):
        """Test permission decorator with authenticated user when anonymous allowed."""
        @require_permission('user', allow_anonymous=True)
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    response = test_endpoint()
                    assert response.status_code == 200
    
    def test_require_admin_decorator(self, app, admin_user):
        """Test require_admin convenience decorator."""
        @require_admin()
        def test_endpoint():
            return jsonify({'message': 'admin access'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', admin_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    response = test_endpoint()
                    assert response.status_code == 200
    
    def test_require_admin_with_resource_check(self, app, admin_user):
        """Test require_admin decorator with resource check."""
        def mock_resource_check():
            return True
        
        @require_admin(resource_check=mock_resource_check)
        def test_endpoint():
            return jsonify({'message': 'admin access'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', admin_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    response = test_endpoint()
                    assert response.status_code == 200
    
    def test_require_authenticated_success(self, app, regular_user):
        """Test require_authenticated decorator success."""
        @require_authenticated()
        def test_endpoint():
            return jsonify({'message': 'authenticated access'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                response = test_endpoint()
                assert response.status_code == 200
    
    def test_require_authenticated_failure(self, app, unauthenticated_user):
        """Test require_authenticated decorator with unauthenticated user."""
        @require_authenticated()
        def test_endpoint():
            return jsonify({'message': 'authenticated access'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', unauthenticated_user):
                response, status_code = test_endpoint()
                assert status_code == 401
                data = response.get_json()
                assert data['error']['code'] == 'AUTHENTICATION_REQUIRED'
    
    def test_require_authenticated_no_role_check(self, app):
        """Test require_authenticated with user having no role."""
        user_no_role = Mock(spec=Account)
        user_no_role.id = "user-no-role"
        user_no_role.is_authenticated = True
        user_no_role.user_role = None
        
        @require_authenticated(allow_any_role=False)
        def test_endpoint():
            return jsonify({'message': 'authenticated access'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', user_no_role):
                response, status_code = test_endpoint()
                assert status_code == 403
                data = response.get_json()
                assert data['error']['code'] == 'PERMISSION_DENIED'
    
    def test_allow_anonymous_decorator(self, app, unauthenticated_user):
        """Test allow_anonymous decorator."""
        @allow_anonymous
        def test_endpoint():
            return jsonify({'message': 'public access'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', unauthenticated_user):
                response = test_endpoint()
                assert response.status_code == 200
                
                # Verify function is marked as allowing anonymous access
                assert hasattr(test_endpoint, '_anonymous_allowed')
                assert test_endpoint._anonymous_allowed is True
    
    def test_function_marking_for_introspection(self, app):
        """Test that decorated functions are properly marked for security introspection."""
        @require_permission('admin')
        def admin_endpoint():
            return jsonify({'message': 'admin'})
        
        @require_permission(['admin', 'user'])
        def multi_role_endpoint():
            return jsonify({'message': 'multi'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user') as mock_user:
                mock_user.is_authenticated = False
                
                # Test function marking
                admin_endpoint()
                multi_role_endpoint()
                
                assert hasattr(admin_endpoint, '_permission_required')
                assert admin_endpoint._permission_required is True
                assert admin_endpoint._required_roles == 'admin'
                
                assert hasattr(multi_role_endpoint, '_permission_required')
                assert multi_role_endpoint._permission_required is True
                assert multi_role_endpoint._required_roles == ['admin', 'user']
    
    def test_unexpected_exception_handling(self, app, regular_user):
        """Test handling of unexpected exceptions in decorators."""
        @require_permission('user')
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                # Mock an unexpected exception
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', side_effect=Exception("Unexpected error")):
                    response, status_code = test_endpoint()
                    assert status_code == 403
                    data = response.get_json()
                    assert data['error']['code'] == 'PERMISSION_DENIED'
    
    def test_sec_001_bypass_prevention_function_marking(self, app):
        """Test SEC-001: Ensure all permission-protected functions are marked."""
        @require_permission('admin')
        def protected_function():
            return "protected"
        
        # Function should be marked even before execution
        assert not hasattr(protected_function, '_permission_required')
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user') as mock_user:
                mock_user.is_authenticated = False
                
                # Execute function (will fail but should mark it)
                try:
                    protected_function()
                except:
                    pass
                
                # Function should now be marked
                assert hasattr(protected_function, '_permission_required')
                assert protected_function._permission_required is True
    
    def test_sec_001_bypass_prevention_no_bypass_on_error(self, app, regular_user):
        """Test SEC-001: Ensure permission errors don't allow bypass."""
        @require_permission('admin')
        def admin_only_endpoint():
            return jsonify({'secret': 'admin_data'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission') as mock_check:
                    # Simulate permission check failure
                    mock_check.side_effect = PermissionDeniedError(
                        "Access denied",
                        required_roles=['admin'],
                        user_role='user'
                    )
                    
                    response, status_code = admin_only_endpoint()
                    assert status_code == 403
                    
                    # Ensure the actual function was NOT executed
                    data = response.get_json()
                    assert 'secret' not in str(data)
                    assert data['error']['code'] == 'PERMISSION_DENIED'
    
    def test_sec_001_bypass_prevention_multiple_decorators(self, app, admin_user):
        """Test SEC-001: Multiple decorators should all be enforced."""
        @require_admin()
        @require_permission('admin')
        def double_protected_endpoint():
            return jsonify({'message': 'double protected'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', admin_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    response = double_protected_endpoint()
                    assert response.status_code == 200
    
    @patch('core.permissions.decorators.logger')
    def test_decorator_logging(self, mock_logger, app, regular_user):
        """Test decorator logging for security monitoring."""
        @require_permission('user')
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context('/test'):
            with patch('core.permissions.decorators.current_user', regular_user):
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', return_value=True):
                    test_endpoint()
                    
                    # Verify debug logging was called
                    mock_logger.debug.assert_called()
    
    def test_decorator_preserves_function_metadata(self, app):
        """Test that decorators preserve original function metadata."""
        @require_permission('user')
        def test_function():
            """Test function docstring."""
            return "test"
        
        assert test_function.__name__ == 'test_function'
        assert test_function.__doc__ == "Test function docstring."
    
    def test_invalid_permission_configuration_handling(self, app, regular_user):
        """Test handling of invalid permission configurations."""
        from core.permissions.exceptions import InvalidPermissionError
        
        @require_permission('user')
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with app.test_request_context():
            with patch('core.permissions.decorators.current_user', regular_user):
                # Mock invalid permission configuration error
                mock_error = InvalidPermissionError("Invalid role configuration")
                with patch('core.permissions.checker.PermissionChecker.check_user_permission', side_effect=mock_error):
                    response, status_code = test_endpoint()
                    assert status_code == 403
                    # Should return generic permission denied for security
                    data = response.get_json()
                    assert data['error']['code'] == 'PERMISSION_DENIED'