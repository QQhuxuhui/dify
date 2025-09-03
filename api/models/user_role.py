"""
User Role Model for Role-Based Access Control

This module implements the UserRole model that provides the foundation for
role-based permission control in the system.

SECURITY NOTE: Default role assignment is 'user' to prevent privilege escalation
"""
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from .engine import db
from .types import StringUUID


class UserRole(Base):
    """
    User Role Model
    
    Defines roles that can be assigned to users for permission control.
    Supports only 'admin' and 'user' roles for security.
    """
    __tablename__ = 'user_roles'
    __table_args__ = (
        db.PrimaryKeyConstraint('id', name='user_role_pkey'),
        db.Index('idx_user_roles_name', 'name'),
        db.CheckConstraint("name IN ('admin', 'user')", name='valid_role_name'),
        db.UniqueConstraint('name', name='unique_role_name')
    )

    id: Mapped[str] = mapped_column(StringUUID, server_default=db.text("uuid_generate_v4()"))
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, server_default=db.text("true"))
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.current_timestamp())
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        server_default=func.current_timestamp(), 
        onupdate=func.current_timestamp()
    )

    # Relationship to accounts
    accounts = relationship('Account', back_populates='user_role', lazy='dynamic')

    @classmethod
    def get_default_role(cls) -> 'UserRole':
        """
        Get the default role for new users.
        
        SECURITY: Always returns 'user' role to prevent privilege escalation.
        This addresses SEC-001 security risk identified in QA review.
        """
        return cls.query.filter_by(name='user').first()
    
    @classmethod
    def get_admin_role(cls) -> 'UserRole':
        """Get admin role for explicit admin assignment."""
        return cls.query.filter_by(name='admin').first()
    
    @classmethod
    def get_by_name(cls, name: str) -> Optional['UserRole']:
        """Get role by name with validation."""
        if name not in ('admin', 'user'):
            return None
        return cls.query.filter_by(name=name, is_active=True).first()
    
    @classmethod
    def get_all_active(cls) -> List['UserRole']:
        """Get all active roles."""
        return cls.query.filter_by(is_active=True).order_by(cls.name).all()
    
    @classmethod
    def create_default_roles(cls) -> tuple['UserRole', 'UserRole']:
        """
        Create default system roles.
        
        Returns:
            tuple: (admin_role, user_role)
        """
        admin_role = cls(
            name='admin',
            description='Administrator role with full system access',
            is_active=True
        )
        
        user_role = cls(
            name='user', 
            description='Standard user role with limited system access',
            is_active=True
        )
        
        db.session.add(admin_role)
        db.session.add(user_role)
        db.session.commit()
        
        return admin_role, user_role
    
    def to_dict(self) -> dict:
        """Convert role to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<UserRole {self.name}>'