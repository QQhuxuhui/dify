"""
User Role Service Errors

Custom exceptions for user role operations.
"""


class UserRoleError(Exception):
    """Base exception for user role errors."""
    pass


class UserRoleNotFoundError(UserRoleError):
    """Raised when a user role is not found."""
    def __init__(self, role_id: str):
        self.role_id = role_id
        super().__init__(f"User role not found: {role_id}")


class InvalidRoleError(UserRoleError):
    """Raised when an invalid role is specified."""
    def __init__(self, role_name: str):
        self.role_name = role_name
        super().__init__(f"Invalid role name: {role_name}")


class InsufficientPermissionsError(UserRoleError):
    """Raised when user lacks sufficient permissions for role operation."""
    def __init__(self, action: str):
        self.action = action
        super().__init__(f"Insufficient permissions for action: {action}")


class RoleAssignmentError(UserRoleError):
    """Raised when role assignment fails."""
    def __init__(self, user_id: str, role_name: str):
        self.user_id = user_id
        self.role_name = role_name
        super().__init__(f"Failed to assign role '{role_name}' to user {user_id}")