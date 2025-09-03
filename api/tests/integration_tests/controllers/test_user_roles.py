"""
Integration tests for User Roles API endpoints.

Tests security features:
- SEC-002: Role enumeration prevention
- SEC-003: Rate limiting
- Authentication requirements
- Authorization checks
"""
import json
import time
import pytest
from unittest.mock import patch

from tests.integration_tests.controllers.app_fixture import client, headers_with_auth


class TestUserRolesAPI:
    """Test cases for User Roles API security."""

    def test_roles_list_requires_authentication(self, client):
        """Test that roles list endpoint requires authentication (SEC-002)."""
        response = client.get('/console/api/roles')
        
        # Should return 401 without authentication
        assert response.status_code == 401

    def test_roles_list_with_authentication(self, client, headers_with_auth):
        """Test authenticated access to roles list."""
        response = client.get('/console/api/roles', headers=headers_with_auth)
        
        # Should return 200 with valid authentication
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['result'] == 'success'
        assert 'data' in data
        assert isinstance(data['data'], list)

    def test_role_detail_requires_authentication(self, client):
        """Test that role detail endpoint requires authentication."""
        response = client.get('/console/api/roles/some-role-id')
        
        # Should return 401 without authentication
        assert response.status_code == 401

    def test_role_detail_with_invalid_id(self, client, headers_with_auth):
        """Test role detail with invalid/malicious role ID."""
        # Test various malicious inputs
        malicious_ids = [
            "'; DROP TABLE user_roles;--",  # SQL injection
            "../../../etc/passwd",          # Path traversal
            "a" * 100,                      # Too long
            "",                             # Empty
            "null",                         # Null attempt
            "<script>alert('xss')</script>" # XSS attempt
        ]
        
        for malicious_id in malicious_ids:
            response = client.get(f'/console/api/roles/{malicious_id}', headers=headers_with_auth)
            
            # Should return 400 for invalid format or 404 for not found
            assert response.status_code in [400, 404]
            
            data = json.loads(response.data)
            assert data['result'] == 'error'

    def test_user_role_access_control(self, client, headers_with_auth):
        """Test user role access control - users can only see their own role."""
        # Test as regular user trying to access another user's role
        other_user_id = "different-user-id"
        response = client.get(f'/console/api/users/{other_user_id}/role', headers=headers_with_auth)
        
        # Should return 403 if not admin or not own user
        assert response.status_code == 403
        
        data = json.loads(response.data)
        assert data['result'] == 'error'
        assert 'permissions' in data['message'].lower()

    def test_role_modification_requires_admin(self, client, headers_with_auth):
        """Test that role modification requires admin privileges."""
        user_id = "some-user-id"
        role_data = {"role_name": "admin"}
        
        response = client.put(
            f'/console/api/users/{user_id}/role',
            headers=headers_with_auth,
            data=json.dumps(role_data),
            content_type='application/json'
        )
        
        # Should return 403 for non-admin users
        assert response.status_code == 403
        
        data = json.loads(response.data)
        assert data['result'] == 'error'
        assert 'administrator' in data['message'].lower()

    def test_role_modification_input_validation(self, client, headers_with_auth):
        """Test input validation for role modification."""
        user_id = "test-user-id"
        
        # Test with invalid role names
        invalid_roles = [
            {"role_name": "super_admin"},      # Invalid role
            {"role_name": ""},                 # Empty role
            {"role_name": None},               # Null role
            {"role_name": "admin'; DROP TABLE accounts;--"},  # SQL injection
            {},                                # Missing role_name
        ]
        
        for invalid_data in invalid_roles:
            response = client.put(
                f'/console/api/users/{user_id}/role',
                headers=headers_with_auth,
                data=json.dumps(invalid_data),
                content_type='application/json'
            )
            
            # Should return 400 for invalid input
            assert response.status_code == 400
            
            data = json.loads(response.data)
            assert data['result'] == 'error'

    @pytest.mark.skip(reason="Rate limiting test requires actual rate limiter setup")
    def test_rate_limiting_on_role_endpoints(self, client, headers_with_auth):
        """
        Test rate limiting on role endpoints (SEC-003).
        
        This test is skipped as it requires actual rate limiter configuration.
        In production, this should be tested with load testing tools.
        """
        # Simulate rapid requests to test rate limiting
        for i in range(35):  # Exceed 30/minute limit
            response = client.get('/console/api/roles', headers=headers_with_auth)
            if response.status_code == 429:  # Rate limited
                break
        
        # Should eventually hit rate limit
        assert response.status_code == 429

    def test_error_messages_dont_expose_system_details(self, client, headers_with_auth):
        """Test that error messages don't expose sensitive system information."""
        # Test with non-existent role ID
        response = client.get('/console/api/roles/non-existent-id', headers=headers_with_auth)
        
        assert response.status_code == 404
        data = json.loads(response.data)
        
        # Error message should be generic, not expose database details
        assert 'not found' in data['message'].lower()
        assert 'database' not in data['message'].lower()
        assert 'sql' not in data['message'].lower()
        assert 'exception' not in data['message'].lower()

    def test_role_assignment_security_validation(self, client, headers_with_auth):
        """
        Test security validation for role assignment.
        
        This is critical for preventing SEC-001 type issues.
        """
        user_id = "test-user-id"
        
        # Test that only valid roles can be assigned
        response = client.put(
            f'/console/api/users/{user_id}/role',
            headers=headers_with_auth,
            data=json.dumps({"role_name": "user"}),  # Valid role
            content_type='application/json'
        )
        
        # Even if user lacks admin privileges, should fail with 403, not 400
        # This ensures role validation happens after auth check
        assert response.status_code == 403

    def test_concurrent_role_modifications(self, client, headers_with_auth):
        """Test handling of concurrent role modifications."""
        user_id = "test-user-id"
        
        # This would be better tested with actual concurrency
        # but we can test that the endpoint handles rapid sequential requests
        responses = []
        for i in range(5):
            response = client.put(
                f'/console/api/users/{user_id}/role',
                headers=headers_with_auth,
                data=json.dumps({"role_name": "user"}),
                content_type='application/json'
            )
            responses.append(response)
        
        # All should fail consistently (with 403 for non-admin)
        for response in responses:
            assert response.status_code == 403

    def test_role_api_response_structure(self, client, headers_with_auth):
        """Test that API responses have consistent structure."""
        response = client.get('/console/api/roles', headers=headers_with_auth)
        
        if response.status_code == 200:
            data = json.loads(response.data)
            
            # Verify response structure
            assert 'result' in data
            assert 'data' in data
            assert data['result'] in ['success', 'error']
            
            if data['result'] == 'success':
                assert isinstance(data['data'], list)
                
                # Verify role structure
                for role in data['data']:
                    assert 'id' in role
                    assert 'name' in role
                    assert 'description' in role
                    assert 'is_active' in role
                    
                    # Ensure no sensitive fields exposed
                    assert 'password' not in role
                    assert 'secret' not in role