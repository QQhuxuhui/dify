# Dify Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the Dify codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements.

Dify is an open-source LLM application development platform that combines the concepts of Backend-as-a-Service and LLMOps, covering the core tech stack required for building generative AI-native applications.

### Document Scope

Comprehensive documentation of entire system for brownfield development and feature enhancements.

### Change Log

| Date   | Version | Description                 | Author    |
| ------ | ------- | --------------------------- | --------- |
| 2025-09-21 | 1.0     | Initial brownfield analysis | BMad Master |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

**API (Backend)**:
- **Main Entry**: `api/app.py` - Flask application entry point
- **App Factory**: `api/app_factory.py` - Application configuration and setup
- **Configuration**: `api/configs/` - System configuration modules
- **Core Business Logic**: `api/core/` - Core AI workflow and model logic
- **API Controllers**: `api/controllers/` - HTTP request handlers
- **Database Models**: `api/models/` - SQLAlchemy database models
- **Services**: `api/services/` - Business logic services

**Web (Frontend)**:
- **Main Entry**: `web/app/` - Next.js application structure
- **Configuration**: `web/next.config.js`, `web/.env.local`
- **Components**: `web/components/` - React UI components
- **Pages**: `web/app/` - Next.js app router pages
- **Services**: `web/service/` - API client services
- **Utils**: `web/utils/` - Utility functions

**Infrastructure**:
- **Docker Setup**: `docker/docker-compose.yaml` - Multi-service orchestration
- **Nginx**: `nginx/` - Reverse proxy configuration
- **Scripts**: `scripts/` - Deployment and utility scripts

## High Level Architecture

### Technical Summary

Dify is a microservices-based platform with the following key components:

1. **Web Frontend** - Next.js React application
2. **API Backend** - Python Flask application with SQLAlchemy
3. **Worker Processes** - Celery-based background job processing
4. **Database** - PostgreSQL for primary data storage
5. **Cache/Queue** - Redis for caching and message queuing
6. **Vector Database** - Weaviate/Qdrant for embeddings storage
7. **File Storage** - Local/S3 compatible storage for files

### Actual Tech Stack

| Category  | Technology | Version | Notes                      |
| --------- | ---------- | ------- | -------------------------- |
| Runtime (API) | Python | >=3.11,<3.13 | Poetry for dependency management |
| Framework (API) | Flask | ~3.1.0 | RESTful API with SQLAlchemy ORM |
| Runtime (Web) | Node.js | >=18.18.0 | pnpm package manager |
| Framework (Web) | Next.js | 14.x | App router architecture |
| UI Library | React | 18.x | TypeScript implementation |
| Database | PostgreSQL | - | Primary data storage |
| Cache/Queue | Redis | - | Session storage and Celery broker |
| Vector DB | Weaviate/Qdrant | - | Embedding storage |
| Task Queue | Celery | ~5.4.0 | Background job processing |
| Styling | Tailwind CSS | - | Utility-first CSS framework |

### Repository Structure Reality Check

- **Type**: Monorepo with clear service separation
- **Package Manager**: Poetry (API), pnpm (Web)
- **Notable**: Custom Docker builds for different environments

## Source Tree and Module Organization

### Project Structure (Actual)

```text
dify/
├── api/                     # Python Flask backend
│   ├── configs/            # Configuration modules
│   ├── controllers/        # HTTP request handlers
│   ├── core/              # Core AI/LLM logic
│   ├── models/            # SQLAlchemy database models
│   ├── services/          # Business logic services
│   ├── libs/              # Utility libraries
│   ├── extensions/        # Flask extensions setup
│   ├── tasks/             # Celery background tasks
│   ├── migrations/        # Database migration scripts
│   └── app.py             # Application entry point
├── web/                    # Next.js React frontend
│   ├── app/               # App router pages and layouts
│   ├── components/        # React UI components
│   ├── service/           # API client services
│   ├── utils/             # Utility functions
│   ├── hooks/             # React custom hooks
│   ├── context/           # React context providers
│   ├── types/             # TypeScript type definitions
│   └── i18n/              # Internationalization
├── docker/                 # Docker Compose setup
├── nginx/                  # Nginx reverse proxy config
├── scripts/               # Deployment and utility scripts
├── volumes/               # Docker volume data
└── docs/                  # Documentation
```

### Key Modules and Their Purpose

**API Core Modules**:
- **Workflow Engine**: `api/core/workflow/` - AI workflow execution logic
- **Model Management**: `api/core/model_runtime/` - LLM provider integrations
- **App Management**: `api/core/app/` - Application lifecycle management
- **Tools**: `api/core/tools/` - External tool integrations
- **Agent Runtime**: `api/core/agent/` - AI agent execution
- **File Processing**: `api/core/file/` - Document upload and processing

**Web Core Modules**:
- **App Studio**: `web/app/(commonLayout)/app/` - Application builder UI
- **Datasets**: `web/app/(commonLayout)/datasets/` - Knowledge base management
- **Tools**: `web/app/(commonLayout)/tools/` - Tool configuration UI
- **Auth**: `web/app/(commonLayout)/signin/` - Authentication pages
- **Chat Interface**: `web/app/components/app/` - Chat UI components

## Data Models and APIs

### Data Models

Key database models are defined in `api/models/`:

- **Account/User Models**: `api/models/account.py` - User authentication and accounts
- **App Models**: `api/models/model.py` - Application definitions
- **Dataset Models**: `api/models/dataset.py` - Knowledge base and document storage
- **Conversation Models**: `api/models/conversation.py` - Chat history and sessions
- **Workflow Models**: `api/models/workflow.py` - Workflow definitions
- **Tool Models**: `api/models/tools.py` - External tool configurations

### API Specifications

- **API Routes**: Defined in `api/controllers/` by module
- **OpenAPI**: Auto-generated from Flask-RESTful decorators
- **Authentication**: JWT-based with workspace/account scoping
- **Rate Limiting**: Implemented per endpoint with Redis backing

**Key API Endpoints**:
- `/v1/apps/` - Application management
- `/v1/datasets/` - Knowledge base operations
- `/v1/workflows/` - Workflow execution
- `/v1/tools/` - Tool management
- `/v1/chat-messages/` - Chat interface

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Model Provider Complexity**: Multiple provider integrations in `api/core/model_runtime/` create maintenance overhead
2. **Workflow State Management**: Complex state handling in workflow execution can lead to race conditions
3. **File Upload Handling**: Large file processing can cause memory issues without proper streaming
4. **Database Migration**: Some manual schema changes required for upgrades

### Workarounds and Gotchas

- **Environment Variables**: Extensive configuration through environment variables (see `.env.example` files)
- **Docker Compose**: Development vs production configurations differ significantly
- **Volume Mounting**: Persistent storage requires careful volume configuration
- **Memory Usage**: Vector operations can consume significant memory during processing

## Integration Points and External Dependencies

### External Services

| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| OpenAI   | LLM Provider | REST API | `api/core/model_runtime/model_providers/openai/` |
| Anthropic | LLM Provider | REST API | `api/core/model_runtime/model_providers/anthropic/` |
| Azure    | LLM Provider | SDK | `api/core/model_runtime/model_providers/azure_openai/` |
| AWS Bedrock | LLM Provider | SDK | `api/core/model_runtime/model_providers/bedrock/` |
| Weaviate | Vector DB | REST API/SDK | `api/core/rag/datasource/vdb/weaviate/` |
| Qdrant   | Vector DB | REST API/SDK | `api/core/rag/datasource/vdb/qdrant/` |

### Internal Integration Points

- **API-Web Communication**: REST API on configurable port (default 5001)
- **Background Jobs**: Celery workers for async processing
- **File Storage**: Configurable storage backend (local/S3)
- **Database**: PostgreSQL with connection pooling
- **Cache Layer**: Redis for sessions and temporary data

## Development and Deployment

### Local Development Setup

**Prerequisites**:
- Docker and Docker Compose
- Python 3.11+ (for API development)
- Node.js 18+ (for web development)

**Quick Start**:
```bash
cd dify/docker
cp .env.example .env
docker compose up -d
```

**Individual Service Development**:

**API Development**:
```bash
cd api
poetry install
poetry shell
python app.py
```

**Web Development**:
```bash
cd web
pnpm install
pnpm dev
```

### Build and Deployment Process

- **Development**: Docker Compose with hot reloading
- **Production**: Multi-stage Docker builds
- **Custom Builds**: Scripts for custom Docker images
- **Environment Management**: Separate configs for dev/staging/prod

**Custom Build Process**:
```bash
./build-custom-images.sh web-opensource  # Build custom web image
./build-custom-images.sh api             # Build custom API image
```

## Testing Reality

### Current Test Coverage

**API Tests**:
- Unit Tests: Limited coverage, primarily in `api/tests/`
- Integration Tests: Minimal, focused on core workflows
- Manual Testing: Primary QA method for complex workflows

**Web Tests**:
- Jest Setup: Configured but minimal test coverage
- Storybook: Available for component development
- E2E Tests: Not implemented

### Running Tests

**API Tests**:
```bash
cd api
poetry run pytest
```

**Web Tests**:
```bash
cd web
pnpm test
```

## Custom Configuration and Extensions

### Current Customizations

Based on the custom branch and build scripts, this installation includes:

1. **Custom User Permissions**: Modified user role system
2. **Custom UI Elements**: Adjusted explore page for different user types
3. **Custom Docker Builds**: Specialized build process for deployment

### Extension Points for New Features

**Backend Extensions**:
- **New Model Providers**: Add to `api/core/model_runtime/model_providers/`
- **Custom Tools**: Implement in `api/core/tools/builtin/`
- **Workflow Nodes**: Add custom nodes in `api/core/workflow/nodes/`
- **API Endpoints**: Create new controllers in `api/controllers/`

**Frontend Extensions**:
- **UI Components**: Add to `web/components/`
- **New Pages**: Create in `web/app/` following app router pattern
- **Custom Hooks**: Add to `web/hooks/`
- **Service Integration**: Extend `web/service/` clients

## Deployment Considerations

### Infrastructure Requirements

- **Minimum Resources**: 4GB RAM, 2 CPU cores
- **Database**: PostgreSQL with sufficient storage for conversations/datasets
- **Cache**: Redis instance for session management
- **Storage**: File system or S3-compatible storage for uploads
- **Network**: Reverse proxy for SSL termination and routing

### Scaling Considerations

- **Horizontal Scaling**: API and Web services can be scaled independently
- **Database**: Consider read replicas for high read workloads
- **Worker Scaling**: Celery workers can be scaled based on job queue size
- **Vector Database**: May require dedicated resources for large datasets

## Security Considerations

### Authentication and Authorization

- **JWT-based Authentication**: Implemented in `api/controllers/console/auth/`
- **Workspace Isolation**: Multi-tenant architecture with workspace scoping
- **Role-based Access**: Custom user permission system
- **API Key Management**: For external API access

### Data Protection

- **Sensitive Data**: Encryption for API keys and secrets
- **File Upload Security**: Validation and sandboxing
- **SQL Injection**: Protected through SQLAlchemy ORM
- **CORS Configuration**: Configured for cross-origin requests

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

**Development**:
```bash
# Start full development environment
cd docker && docker compose up -d

# API development
cd api && poetry run python app.py

# Web development
cd web && pnpm dev

# Custom builds
./build-custom-images.sh web-opensource
```

**Database Operations**:
```bash
# Run migrations
cd api && poetry run flask db upgrade

# Create new migration
cd api && poetry run flask db migrate -m "Description"
```

### Debugging and Troubleshooting

- **API Logs**: Check Docker logs or console output for Flask application
- **Web Logs**: Browser console and Next.js development output
- **Database**: Connect to PostgreSQL container for direct queries
- **Redis**: Use redis-cli for cache/queue debugging
- **Vector DB**: Check Weaviate/Qdrant dashboards for embedding issues

### Performance Monitoring

- **API Performance**: Flask application metrics and response times
- **Database Performance**: PostgreSQL query performance and connections
- **Memory Usage**: Monitor Docker container resource consumption
- **Vector Operations**: Embedding generation and similarity search timing

## Notes for AI Agents

- **Code Quality**: Follows Python PEP 8 and TypeScript/React best practices
- **Architecture Patterns**: Service-oriented with clear separation of concerns
- **Configuration Management**: Extensive use of environment variables
- **Async Processing**: Heavy use of Celery for background tasks
- **Multi-tenancy**: Workspace-based isolation throughout the stack
- **Extensibility**: Plugin-based architecture for models, tools, and workflows