"""Add user roles table and role_id to accounts

SECURITY FIX: This migration addresses SEC-001 by assigning 'user' role by default
instead of 'admin' role to prevent privilege escalation.

Revision ID: 8c283d20f7d_20250903_223941
Revises: fecff1c3da27
Create Date: 2025-09-03 22:39:41.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '8c283d20f7d_20250903_223941'
down_revision = 'fecff1c3da27'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade database schema with user roles support.
    
    SECURITY: This migration fixes SEC-001 by ensuring default role is 'user'
    """
    # Phase 1: Create user_roles table
    op.create_table(
        'user_roles',
        sa.Column('id', postgresql.UUID(as_uuid=False), 
                 server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), 
                 server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.CheckConstraint("name IN ('admin', 'user')", name='valid_role_name'),
        sa.PrimaryKeyConstraint('id', name='user_role_pkey'),
        sa.UniqueConstraint('name', name='unique_role_name')
    )
    
    # Create index for performance
    op.create_index('idx_user_roles_name', 'user_roles', ['name'])
    
    # Phase 2: Insert default roles
    # SECURITY FIX: Create both admin and user roles first
    op.execute(text("""
        INSERT INTO user_roles (name, description, is_active) VALUES
        ('admin', 'Administrator role with full system access', true),
        ('user', 'Standard user role with limited system access', true)
    """))
    
    # Phase 3: Add role_id column to accounts table
    # SECURITY FIX: Default to 'user' role instead of 'admin'
    op.add_column('accounts', 
        sa.Column('role_id', postgresql.UUID(as_uuid=False), nullable=True)
    )
    
    # Phase 4: Set default role for existing users to 'user' (SEC-001 FIX)
    op.execute(text("""
        UPDATE accounts 
        SET role_id = (SELECT id FROM user_roles WHERE name = 'user')
        WHERE role_id IS NULL
    """))
    
    # Phase 5: Make role_id NOT NULL after setting defaults
    op.alter_column('accounts', 'role_id', nullable=False)
    
    # Phase 6: Add foreign key constraint and index
    op.create_foreign_key(
        'fk_accounts_role_id', 'accounts', 'user_roles', 
        ['role_id'], ['id'], ondelete='RESTRICT'
    )
    op.create_index('idx_accounts_role_id', 'accounts', ['role_id'])


def downgrade():
    """
    Downgrade database schema - remove user roles support.
    
    WARNING: This will remove all role information from accounts.
    """
    # Remove indexes and constraints
    op.drop_index('idx_accounts_role_id', table_name='accounts')
    op.drop_constraint('fk_accounts_role_id', 'accounts', type_='foreignkey')
    
    # Remove role_id column from accounts
    op.drop_column('accounts', 'role_id')
    
    # Remove user_roles table and its indexes
    op.drop_index('idx_user_roles_name', table_name='user_roles')
    op.drop_table('user_roles')