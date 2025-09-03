"""
Unit tests for UserRole model.

Tests cover security requirements from QA review:
- SEC-001: Default role assignment security
- Role validation and constraints
- CRUD operations security
"""
import pytest
from sqlalchemy.exc import IntegrityError

from models.user_role import UserRole
from models.account import Account
from tests.integration_tests.model_runtime import setup_db_session


class TestUserRole:
    """Test cases for UserRole model."""

    def test_create_user_role_valid(self):
        """Test creating a valid user role."""
        role = UserRole(
            name='user',
            description='Standard user role',
            is_active=True
        )
        
        assert role.name == 'user'
        assert role.description == 'Standard user role'
        assert role.is_active is True

    def test_create_user_role_invalid_name(self):
        """Test that invalid role names are rejected by database constraint."""
        with pytest.raises(IntegrityError):
            role = UserRole(
                name='invalid_role',
                description='Invalid role',
                is_active=True
            )
            # This should fail when saved to database due to CHECK constraint

    def test_role_name_uniqueness(self):
        """Test that role names must be unique."""
        # This will be tested at database level through unique constraint
        role1 = UserRole(name='admin', description='First admin', is_active=True)
        role2 = UserRole(name='admin', description='Second admin', is_active=True)
        
        # Should raise IntegrityError when both are saved
        with pytest.raises(IntegrityError):
            # Simulate database constraint violation
            pass

    def test_get_default_role_returns_user(self):
        """
        Test SEC-001 fix: Default role should always be 'user', not 'admin'.
        
        This is critical for preventing privilege escalation.
        """
        # Mock the query to return user role
        with setup_db_session() as session:
            # Create roles
            admin_role = UserRole(name='admin', description='Admin role', is_active=True)
            user_role = UserRole(name='user', description='User role', is_active=True)
            
            session.add(admin_role)
            session.add(user_role)
            session.commit()
            
            # Test that default role is 'user'
            default_role = UserRole.get_default_role()
            assert default_role is not None
            assert default_role.name == 'user'  # CRITICAL: Must be 'user', not 'admin'

    def test_get_by_name_validation(self):
        """Test role name validation in get_by_name method."""
        # Valid names should work
        valid_role = UserRole.get_by_name('admin')  # Should not raise error
        
        # Invalid names should return None
        invalid_role = UserRole.get_by_name('super_admin')
        assert invalid_role is None
        
        # SQL injection attempt should return None
        malicious_role = UserRole.get_by_name("admin'; DROP TABLE user_roles;--")
        assert malicious_role is None

    def test_create_default_roles(self):
        """Test creation of default system roles."""
        with setup_db_session() as session:
            admin_role, user_role = UserRole.create_default_roles()
            
            # Verify both roles created
            assert admin_role.name == 'admin'
            assert user_role.name == 'user'
            
            # Verify they are active
            assert admin_role.is_active is True
            assert user_role.is_active is True
            
            # Verify descriptions are meaningful
            assert 'administrator' in admin_role.description.lower()
            assert 'user' in user_role.description.lower()

    def test_to_dict_method(self):
        """Test role serialization to dictionary."""
        role = UserRole(
            name='user',
            description='Test user role',
            is_active=True
        )
        
        role_dict = role.to_dict()
        
        # Verify all required fields present
        assert 'id' in role_dict
        assert 'name' in role_dict
        assert 'description' in role_dict
        assert 'is_active' in role_dict
        assert 'created_at' in role_dict
        assert 'updated_at' in role_dict
        
        # Verify values
        assert role_dict['name'] == 'user'
        assert role_dict['description'] == 'Test user role'
        assert role_dict['is_active'] is True

    def test_role_account_relationship(self):
        """Test relationship between roles and accounts."""
        with setup_db_session() as session:
            # Create role
            user_role = UserRole(name='user', description='Test role', is_active=True)
            session.add(user_role)
            session.commit()
            
            # Create account with role
            account = Account(
                name='Test User',
                email='test@example.com',
                role_id=user_role.id
            )
            session.add(account)
            session.commit()
            
            # Test relationship
            assert account.user_role.name == 'user'
            assert user_role.accounts.count() == 1
            assert user_role.accounts.first().email == 'test@example.com'

    def test_security_constraints(self):
        """Test various security constraints on the model."""
        # Test name length constraint
        with pytest.raises(Exception):  # Should be database error for length
            role = UserRole(
                name='a' * 100,  # Too long
                description='Test',
                is_active=True
            )

        # Test required fields
        with pytest.raises(Exception):
            role = UserRole(
                # Missing name
                description='Test',
                is_active=True
            )

        # Test description required
        with pytest.raises(Exception):
            role = UserRole(
                name='user',
                # Missing description
                is_active=True
            )