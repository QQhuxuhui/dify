# Dify Brownfield Architecture Document

## Introduction

This document captures the **CURRENT STATE** of the Dify platform codebase, including technical patterns, architectural decisions, and real-world implementation details. It serves as a reference for AI agents working on the page-level permission control enhancement.

### Document Scope

**Focused on areas relevant to**: Page-level permission control system implementation for role-based access (admin vs regular users)

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-02 | 1.0 | Initial brownfield analysis focused on permission control | Winston (Architect) |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

**Backend (Python/Flask)**:
- **Main Entry**: `api/app.py` - Flask application factory
- **Authentication Core**: `api/extensions/ext_login.py` - Flask-Login integration
- **User Models**: `api/models/account.py` - User accounts and authentication
- **Login Controllers**: `api/controllers/console/auth/login.py` - Login/logout endpoints
- **Configuration**: `api/configs/app_config.py` - Application configuration

**Frontend (Next.js/React)**:
- **Main Layout**: `web/app/(commonLayout)/layout.tsx` - Main application layout
- **App Context**: `web/context/app-context.tsx` - Global application state
- **Header Navigation**: `web/app/components/header/index.tsx` - Main navigation bar
- **App Sidebar**: `web/app/components/app-sidebar/index.tsx` - Application sidebar navigation

### Enhancement Impact Areas

Based on the PRD for page-level permission control, these files will be affected:

**Backend Changes Required**:
- `api/models/account.py` - Add role field to Account model
- `api/extensions/ext_login.py` - Include role in user session
- `api/controllers/console/auth/login.py` - Return role information on login
- New: `api/decorators/permission.py` - Permission validation decorators
- New: `api/migrations/versions/add_user_roles.py` - Database migration

**Frontend Changes Required**:
- `web/context/app-context.tsx` - Add role information to context
- `web/app/components/header/index.tsx` - Role-based navigation display
- `web/app/(commonLayout)/layout.tsx` - Route protection logic
- New: `web/components/auth/ProtectedRoute.tsx` - Route protection component
- New: `web/hooks/usePermission.tsx` - Permission checking hook

## High Level Architecture

### Technical Summary

Dify is a **monorepo** containing a Flask-based API backend and Next.js-based frontend, deployed as separate services but sharing the same repository. The architecture follows a traditional client-server pattern with JSON REST APIs.

**Current Authentication Pattern**: 
- Uses Flask-Login for session management
- JWT-based token authentication for API access
- Role information exists at workspace level but no user-level roles
- **CONSTRAINT**: Current role system is workspace-centric, not user-centric

### Actual Tech Stack (from package.json/pyproject.toml)

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| **Backend Runtime** | Python | 3.11-3.12 | Strict version requirements |
| **Backend Framework** | Flask | 3.1.0 | With Flask-Login 0.6.3 for auth |
| **Database ORM** | SQLAlchemy | 2.0.29 | With Flask-SQLAlchemy 3.1.1 |
| **Authentication** | Flask-Login + JWT | 0.6.3 + 2.8.0 | Custom passport service |
| **Database** | PostgreSQL | 13+ | Via psycopg2-binary 2.9.6 |
| **Cache/Sessions** | Redis | 5.0.3 | With hiredis for performance |
| **Frontend Runtime** | Node.js | >=18.18.0 | Strict minimum version |
| **Frontend Framework** | Next.js | 15.2.3 | App Router architecture |
| **UI Library** | React | 19.0.0 | Latest version with TypeScript |
| **State Management** | Zustand | 4.5.2 | With React Query 5.60.5 |
| **UI Components** | Tailwind CSS | 3.4.14 | With Headless UI 2.2.0 |
| **Build Tools** | TypeScript | 4.9.5 | With strict mode enabled |

### Repository Structure Reality Check

- **Type**: Monorepo with clear separation
- **Package Manager**: pnpm (frontend), Poetry (backend) 
- **Notable**: Clean separation between `/api` and `/web` directories
- **Deployment**: Docker-based with multi-stage builds

## Source Tree and Module Organization

### Project Structure (Actual)

```text
dify/
├── api/                          # Flask Backend API
│   ├── app.py                   # Main Flask application entry point
│   ├── app_factory.py           # Application factory pattern
│   ├── extensions/              # Flask extensions (auth, db, etc)
│   │   └── ext_login.py         # Flask-Login configuration - KEY FOR ENHANCEMENT
│   ├── models/                  # SQLAlchemy data models
│   │   └── account.py           # User account model - NEEDS ROLE FIELD
│   ├── controllers/             # API route controllers
│   │   └── console/auth/        # Authentication endpoints
│   │       └── login.py         # Login/logout logic - MODIFY FOR ROLE RETURN
│   ├── services/                # Business logic services
│   ├── configs/                 # Configuration management
│   └── migrations/              # Database migration scripts
├── web/                         # Next.js Frontend
│   ├── app/                     # Next.js App Router structure
│   │   ├── (commonLayout)/      # Main app layout with navigation
│   │   │   └── layout.tsx       # MODIFY: Add route protection
│   │   └── components/          # React components
│   │       ├── header/          # Main navigation header
│   │       │   └── index.tsx    # MODIFY: Role-based menu display
│   │       └── app-sidebar/     # Application sidebar navigation
│   ├── context/                 # React context providers
│   │   └── app-context.tsx      # MODIFY: Add role information
│   └── hooks/                   # Custom React hooks
├── docker/                      # Docker configuration
└── docs/                        # Documentation (our target)
```

### Key Modules and Their Purpose

**Authentication & User Management**:
- **Account Management**: `api/models/account.py` - Current user model with workspace roles only
- **Authentication Flow**: `api/extensions/ext_login.py` - Flask-Login integration with custom token validation
- **Login Controllers**: `api/controllers/console/auth/login.py` - Login/logout endpoints returning user info
- **LIMITATION**: No user-level role system, only workspace-level permissions

**Frontend Navigation & State**:
- **Global State**: `web/context/app-context.tsx` - Includes workspace role checks (`isCurrentWorkspaceManager`, etc.)
- **Main Navigation**: `web/app/components/header/index.tsx` - Currently shows all nav items to all users
- **Route Structure**: Next.js App Router with layout-based organization
- **PATTERN**: Role checking exists for workspace operations but not for UI display

## Data Models and APIs

### Data Models

**Current User Model** (api/models/account.py):
- **User Account**: Basic user information with workspace associations
- **Workspace Roles**: `owner`, `admin`, `editor`, `dataset_operator` - workspace-centric
- **Authentication**: Flask-Login UserMixin integration with current_tenant property
- **CONSTRAINT**: No user-level roles, roles are tied to workspace membership

**Required Enhancement**:
```python
# New field needed in Account model
role = db.Column(db.String(16), nullable=False, default='user')  # 'admin' or 'user'
```

### API Specifications

**Authentication APIs** (api/controllers/console/auth/login.py):
- **POST /login**: Returns user info with workspace details
- **GET /logout**: Standard logout functionality
- **ENHANCEMENT NEEDED**: Include user role in login response

**Current Response Format**:
```json
{
  "result": "success", 
  "data": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

**Enhanced Response Format Needed**:
```json
{
  "result": "success",
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {
      "id": "...",
      "role": "admin"  // NEW FIELD
    }
  }
}
```

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Workspace-Centric Role System**: Current role system is workspace-focused, not user-focused
   - **Impact**: Need to add parallel user-level role system without breaking workspace roles
   - **Location**: `api/models/account.py`, workspace role checks throughout codebase
   - **Workaround**: Maintain both systems during transition

2. **No Route-Level Protection**: Frontend routes are not protected, only individual API endpoints
   - **Impact**: Need to implement page-level access control from scratch
   - **Location**: Next.js routing structure lacks permission middleware
   - **Technical Debt**: All routes currently accessible to authenticated users

3. **Hardcoded Navigation**: Navigation menus show all items regardless of user permissions
   - **Location**: `web/app/components/header/index.tsx`
   - **Current State**: Uses workspace roles for some checks but not comprehensive
   - **Pattern**: Conditional rendering exists but not role-based

### Workarounds and Gotchas

- **Workspace Role Complexity**: Workspace roles (`isCurrentWorkspaceManager`, etc.) are computed properties, not database fields
  - **Implication**: New user roles must coexist with existing workspace role logic
- **Token Structure**: Passport service expects specific token format for user identification
  - **Location**: `api/libs/passport.py` and `api/extensions/ext_login.py`
  - **Constraint**: Cannot change token structure without breaking existing integrations
- **Context State Management**: AppContext uses complex workspace state management
  - **Location**: `web/context/app-context.tsx`
  - **Gotcha**: Adding role state must not interfere with existing workspace state

## Integration Points and External Dependencies

### Internal Integration Points

**Frontend-Backend Communication**:
- **Authentication**: REST API with Bearer token authentication
- **Session Management**: Flask-Login sessions with JWT tokens
- **State Synchronization**: Frontend context syncs with API user profile endpoint

**Current User Profile Flow**:
1. User logs in via `/login` endpoint
2. Frontend fetches user profile via `/account/profile`
3. AppContext stores user and workspace information
4. Navigation components use workspace role checks

**Required Enhancement Integration**:
1. Add role field to user profile API response
2. Update AppContext to include role information
3. Add role-based route protection middleware
4. Implement role-based navigation rendering

### Database Integration Constraints

**Migration Requirements**:
- Must use Flask-Migrate for schema changes
- Existing users need default role assignment (suggest 'admin' to preserve access)
- Cannot modify existing workspace role functionality

**Current Migration Pattern** (api/migrations/):
```python
# Standard Alembic migration pattern used
def upgrade():
    op.add_column('accounts', sa.Column('role', sa.String(16), nullable=False, server_default='admin'))

def downgrade():
    op.drop_column('accounts', 'role')
```

## Development and Deployment

### Local Development Setup

**Backend Setup**:
1. Python 3.11+ with Poetry package manager
2. PostgreSQL database required
3. Redis for session storage
4. Environment variables in `.env` file (see `docker/.env.example`)

**Frontend Setup**:
1. Node.js 18.18.0+ with pnpm package manager  
2. Next.js development server on port 3000
3. API proxy configuration in `next.config.js`

**Known Development Issues**:
- Database must be running before backend starts (no auto-retry)
- Frontend hot reload sometimes breaks with context changes
- CORS configuration hardcoded for development domains

### Build and Deployment Process

**Current Process**:
- **Backend**: Docker multi-stage build with Poetry
- **Frontend**: Next.js static build with standalone output
- **Database**: Migrations run manually via `flask db upgrade`
- **Deployment**: Docker Compose orchestration

**Enhancement Deployment Considerations**:
- Role migration must run before application restart
- Frontend build must include new permission components
- API responses are cached - cache invalidation may be needed

## Enhancement Implementation Strategy

### Files That Will Need Modification

**Backend Core Changes**:
1. `api/models/account.py` - Add role field and related methods
2. `api/extensions/ext_login.py` - Include role in user session
3. `api/controllers/console/auth/login.py` - Return role in login response
4. New: `api/decorators/permission.py` - Role validation decorators

**Frontend Core Changes**:
1. `web/context/app-context.tsx` - Add role state management
2. `web/app/components/header/index.tsx` - Role-based navigation
3. `web/app/(commonLayout)/layout.tsx` - Route protection integration
4. New: `web/components/auth/ProtectedRoute.tsx` - Route guard component
5. New: `web/hooks/usePermission.tsx` - Permission checking utilities

### New Files/Modules Needed

**Backend**:
- `api/decorators/permission.py` - Role-based API endpoint protection
- `api/migrations/versions/add_user_roles.py` - Database migration
- `api/services/permission_service.py` - Permission checking business logic

**Frontend**:
- `web/components/auth/ProtectedRoute.tsx` - Route protection wrapper
- `web/hooks/usePermission.tsx` - Role checking hook
- `web/types/permission.ts` - Permission-related TypeScript types

### Integration Considerations

**Must Maintain Compatibility**:
- Existing workspace role system continues to function
- Current API response formats preserved (only additions)
- Navigation behavior for admin users unchanged
- Database rollback capability preserved

**Performance Considerations**:
- Role information cached in user session
- Navigation rendering optimized to avoid re-renders
- Permission checks implemented client-side and server-side

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

**Backend Development**:
```bash
cd api
poetry install                    # Install dependencies
poetry run flask db upgrade      # Run database migrations  
poetry run python -m flask run   # Start development server
poetry run flask db revision     # Create new migration
```

**Frontend Development**:
```bash
cd web
pnpm install                     # Install dependencies
pnpm dev                         # Start development server
pnpm build                       # Production build
pnpm type-check                  # TypeScript validation
```

### Debugging and Troubleshooting

**Common Issues**:
- **Database Connection**: Check PostgreSQL service and connection string in `.env`
- **Authentication Failures**: Clear browser tokens and Redis session cache
- **Type Errors**: Run `pnpm type-check` for TypeScript validation
- **Permission Context**: Use browser dev tools to inspect AppContext state

**Debug Mode**:
- Backend: Set `FLASK_DEBUG=1` for detailed error messages
- Frontend: Check browser console for React dev tools warnings
- Database: Enable query logging in PostgreSQL for debugging migrations

---

*This document reflects the actual current state of the Dify platform as of September 2025, including technical debt and real-world constraints that must be considered for the page-level permission control enhancement.*