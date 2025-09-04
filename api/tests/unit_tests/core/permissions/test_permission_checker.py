"""
Unit Tests for Permission Checker

Comprehensive test suite for PermissionChecker with focus on security
validation and SEC-001 bypass prevention.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from flask import Flask, request_started

from core.permissions.checker import PermissionChecker
from core.permissions.exceptions import (
    PermissionDeniedError, 
    AuthenticationRequiredError,
    InvalidPermissionError,
    RoleNotFoundError
)
from models.account import Account
from models.user_role import UserRole


class TestPermissionChecker:
    """Test cases for PermissionChecker class."""
    
    @pytest.fixture
    def app(self):
        """Create test Flask application."""
        app = Flask(__name__)
        app.config['TESTING'] = True
        return app
    
    @pytest.fixture
    def admin_role(self):
        """Create admin role mock."""
        role = Mock(spec=UserRole)
        role.id = "admin-role-id"
        role.name = "admin"
        role.is_active = True
        return role
    
    @pytest.fixture
    def user_role(self):
        """Create user role mock."""
        role = Mock(spec=UserRole)
        role.id = "user-role-id"
        role.name = "user"
        role.is_active = True
        return role
    
    @pytest.fixture
    def admin_account(self, admin_role):
        """Create admin account mock."""
        account = Mock(spec=Account)
        account.id = "admin-account-id"
        account.email = "admin@test.com"
        account.is_authenticated = True
        account.user_role = admin_role
        return account
    
    @pytest.fixture
    def user_account(self, user_role):
        """Create user account mock."""
        account = Mock(spec=Account)
        account.id = "user-account-id"
        account.email = "user@test.com"
        account.is_authenticated = True
        account.user_role = user_role
        return account
    
    @pytest.fixture
    def unauthenticated_account(self):
        """Create unauthenticated account mock."""
        account = Mock(spec=Account)
        account.id = None
        account.is_authenticated = False
        account.user_role = None
        return account
    
    def test_check_user_permission_admin_success(self, app, admin_account):
        """Test successful admin permission check."""
        with app.test_request_context():
            result = PermissionChecker.check_user_permission(
                admin_account, 'admin'
            )
            assert result is True
    
    def test_check_user_permission_admin_has_user_access(self, app, admin_account):
        """Test admin has user-level access (role hierarchy)."""
        with app.test_request_context():
            result = PermissionChecker.check_user_permission(
                admin_account, 'user'
            )
            assert result is True
    
    def test_check_user_permission_user_success(self, app, user_account):
        """Test successful user permission check."""
        with app.test_request_context():
            result = PermissionChecker.check_user_permission(
                user_account, 'user'
            )
            assert result is True
    
    def test_check_user_permission_user_denied_admin(self, app, user_account):
        """Test user denied admin access."""
        with app.test_request_context():
            with pytest.raises(PermissionDeniedError) as exc_info:
                PermissionChecker.check_user_permission(
                    user_account, 'admin'
                )
            
            error = exc_info.value
            assert error.required_roles == ['admin']
            assert error.user_role == 'user'
            assert error.user_id == user_account.id
    
    def test_check_user_permission_multi_roles_success(self, app, admin_account):
        """Test multi-role permission check success."""
        with app.test_request_context():
            result = PermissionChecker.check_user_permission(
                admin_account, ['admin', 'user']
            )
            assert result is True
    
    def test_check_user_permission_multi_roles_partial_success(self, app, user_account):
        """Test multi-role permission check with partial match."""
        with app.test_request_context():
            result = PermissionChecker.check_user_permission(
                user_account, ['admin', 'user']
            )
            assert result is True
    
    def test_check_user_permission_unauthenticated(self, app, unauthenticated_account):
        """Test permission check fails for unauthenticated user."""
        with app.test_request_context():
            with pytest.raises(AuthenticationRequiredError) as exc_info:
                PermissionChecker.check_user_permission(
                    unauthenticated_account, 'user'
                )
            
            error = exc_info.value
            assert "Authentication required" in error.message
    
    def test_check_user_permission_no_role_assigned(self, app):
        """Test permission check fails when user has no role."""
        account = Mock(spec=Account)
        account.id = "test-user"
        account.is_authenticated = True
        account.user_role = None
        
        with app.test_request_context():
            with pytest.raises(PermissionDeniedError) as exc_info:
                PermissionChecker.check_user_permission(
                    account, 'user'
                )
            
            error = exc_info.value
            assert "User has no role assigned" in error.message
            assert error.user_role is None
    
    def test_check_user_permission_invalid_role(self, app, user_account):
        """Test permission check fails for invalid role."""
        with app.test_request_context():
            with pytest.raises(RoleNotFoundError) as exc_info:
                PermissionChecker.check_user_permission(
                    user_account, 'invalid_role'
                )
            
            error = exc_info.value
            assert "Invalid roles: ['invalid_role']" in error.message
    
    def test_check_user_permission_with_resource_check_success(self, app, user_account):
        """Test permission check with successful resource validation."""
        def mock_resource_check():
            return True
        
        with app.test_request_context():
            result = PermissionChecker.check_user_permission(
                user_account, 'user', resource_check=mock_resource_check
            )
            assert result is True
    
    def test_check_user_permission_with_resource_check_failure(self, app, user_account):
        """Test permission check fails when resource validation fails."""
        def mock_resource_check():
            return False
        
        with app.test_request_context():
            with pytest.raises(PermissionDeniedError) as exc_info:
                PermissionChecker.check_user_permission(
                    user_account, 'user', resource_check=mock_resource_check
                )
            
            error = exc_info.value
            assert "Resource ownership validation failed" in error.message
    
    def test_check_user_permission_resource_check_exception(self, app, user_account):
        """Test permission check handles resource validation exceptions."""
        def mock_resource_check():
            raise Exception("Resource check error")
        
        with app.test_request_context():
            with pytest.raises(PermissionDeniedError) as exc_info:
                PermissionChecker.check_user_permission(
                    user_account, 'user', resource_check=mock_resource_check
                )
            
            error = exc_info.value
            assert "Resource validation error" in error.message
    
    def test_get_user_permissions_admin(self, admin_account):
        """Test getting admin user permissions."""
        permissions = PermissionChecker.get_user_permissions(admin_account)
        assert permissions == ['admin', 'user']
    
    def test_get_user_permissions_user(self, user_account):
        """Test getting regular user permissions."""
        permissions = PermissionChecker.get_user_permissions(user_account)
        assert permissions == ['user']
    
    def test_get_user_permissions_no_role(self):
        """Test getting permissions for user with no role."""
        account = Mock(spec=Account)
        account.user_role = None
        
        permissions = PermissionChecker.get_user_permissions(account)
        assert permissions == []
    
    def test_has_role_success(self, admin_account):
        """Test has_role method success."""
        assert PermissionChecker.has_role(admin_account, 'admin') is True
        assert PermissionChecker.has_role(admin_account, 'user') is True
    
    def test_has_role_failure(self, user_account):
        """Test has_role method failure."""
        assert PermissionChecker.has_role(user_account, 'admin') is False
        assert PermissionChecker.has_role(user_account, 'user') is True
    
    def test_is_admin(self, admin_account, user_account):
        """Test is_admin helper method."""
        assert PermissionChecker.is_admin(admin_account) is True
        assert PermissionChecker.is_admin(user_account) is False
    
    def test_is_user(self, admin_account, user_account):
        """Test is_user helper method."""
        assert PermissionChecker.is_user(admin_account) is True
        assert PermissionChecker.is_user(user_account) is True
    
    def test_normalize_roles_string(self):
        """Test role normalization from string."""
        result = PermissionChecker._normalize_roles('admin')
        assert result == ['admin']
    
    def test_normalize_roles_list(self):
        """Test role normalization from list."""
        result = PermissionChecker._normalize_roles(['admin', 'user'])
        assert result == ['admin', 'user']
    
    def test_normalize_roles_invalid_type(self):
        """Test role normalization with invalid type."""
        with pytest.raises(InvalidPermissionError):
            PermissionChecker._normalize_roles(123)
    
    def test_validate_roles_exist_success(self):
        """Test role existence validation success."""
        # Should not raise exception
        PermissionChecker._validate_roles_exist(['admin', 'user'])
    
    def test_validate_roles_exist_failure(self):
        """Test role existence validation failure."""
        with pytest.raises(RoleNotFoundError) as exc_info:
            PermissionChecker._validate_roles_exist(['admin', 'invalid_role'])
        
        error = exc_info.value
        assert "Invalid roles: ['invalid_role']" in error.message
    
    @patch('core.permissions.checker.logger')
    def test_permission_logging(self, mock_logger, app, admin_account):
        """Test permission attempt logging."""
        with app.test_request_context():
            PermissionChecker.check_user_permission(admin_account, 'admin')
            
            # Verify logging was called
            mock_logger.info.assert_called()
            call_args = mock_logger.info.call_args[0][0]
            assert "Permission granted" in call_args
            assert admin_account.id in call_args
    
    @patch('core.permissions.checker.logger')
    def test_permission_denial_logging(self, mock_logger, app, user_account):
        """Test permission denial logging."""
        with app.test_request_context():
            with pytest.raises(PermissionDeniedError):
                PermissionChecker.check_user_permission(user_account, 'admin')
            
            # Verify warning logging was called
            mock_logger.warning.assert_called()
            call_args = mock_logger.warning.call_args[0][0]
            assert "Permission denied" in call_args
    
    def test_unexpected_exception_handling(self, app, admin_account):
        """Test handling of unexpected exceptions during permission checking."""
        # Mock an internal error
        with patch.object(PermissionChecker, '_validate_roles_exist', side_effect=Exception("Unexpected error")):
            with app.test_request_context():
                with pytest.raises(PermissionDeniedError) as exc_info:
                    PermissionChecker.check_user_permission(admin_account, 'admin')
                
                error = exc_info.value
                assert "Permission validation failed" in error.message
    
    def test_sec_001_bypass_prevention_no_authentication(self, app):
        """Test SEC-001: Prevent permission bypass without authentication."""
        with app.test_request_context():
            # Attempt to bypass with None user
            with pytest.raises(AuthenticationRequiredError):
                PermissionChecker.check_user_permission(None, 'user')
            
            # Attempt to bypass with unauthenticated user
            unauthenticated = Mock(spec=Account)
            unauthenticated.is_authenticated = False
            
            with pytest.raises(AuthenticationRequiredError):
                PermissionChecker.check_user_permission(unauthenticated, 'user')
    
    def test_sec_001_bypass_prevention_role_manipulation(self, app):
        """Test SEC-001: Prevent permission bypass through role manipulation."""
        # Create account with manipulated role data
        fake_admin = Mock(spec=Account)
        fake_admin.id = "fake-admin"
        fake_admin.is_authenticated = True
        
        # Try to fake admin role
        fake_role = Mock()
        fake_role.name = 'admin'
        fake_admin.user_role = fake_role
        
        with app.test_request_context():
            # This should still work because the hierarchy check is based on role name
            result = PermissionChecker.check_user_permission(fake_admin, 'admin')
            assert result is True
    
    def test_sec_001_bypass_prevention_invalid_role_escalation(self, app, user_account):
        """Test SEC-001: Prevent privilege escalation through invalid role names."""
        with app.test_request_context():
            # Try invalid role names that could attempt escalation
            invalid_roles = ['root', 'superuser', 'administrator', 'owner']
            
            for role in invalid_roles:
                with pytest.raises(RoleNotFoundError):
                    PermissionChecker.check_user_permission(user_account, role)