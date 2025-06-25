# Sirpi Google ADK Backend

Multi-Agent Infrastructure Deployment Platform using Google Cloud Agent Development Kit (ADK).

## 🎯 Overview

This backend powers a deployment-as-a-service platform that uses multiple AI agents to automate the entire software deployment lifecycle - from repository analysis to cloud infrastructure deployment on Google Cloud Platform.

### Key Features

- **Multi-Agent Architecture**: Stateless agents that coordinate to handle complex deployment workflows
- **Google Cloud ADK Integration**: Uses Vertex AI Agent Engine for session management and agent coordination
- **Deployment Templates**: Customizable templates for different frameworks and deployment patterns
- **Real-time Monitoring**: Track deployment progress, costs, and resource health
- **PostgreSQL Database**: Direct SQLAlchemy integration with Supabase PostgreSQL
- **Portkey + OpenRouter**: LLM integration with multiple model support

## 🏗️ Architecture

### Agent System
- **Infrastructure Analyzer Agent**: Analyzes repositories and detects frameworks
- **Deployment Planner Agent**: Creates deployment plans and infrastructure designs
- **Code Generator Agent**: Generates Terraform, Dockerfiles, and configuration files
- **Deployment Orchestrator Agent**: Manages the actual deployment process

### Database Schema
- **Users**: User accounts with Google Cloud integration
- **Projects**: Deployment projects with multi-agent workflow tracking
- **Agent Sessions**: Vertex AI Agent Engine session management
- **Agent Events**: Detailed logging of all agent interactions
- **Generated Files**: Version-controlled generated infrastructure files
- **Cloud Resources**: Tracking of deployed cloud resources
- **Deployment Templates**: Reusable deployment patterns

## 🚀 Quick Start

### Prerequisites

1. **Python 3.11+**
2. **Supabase Account** - For PostgreSQL database (using Transaction Pooler)
3. **Google Cloud Project** - With Vertex AI API enabled
4. **Portkey Account** - For LLM integration
5. **OpenRouter Account** - For model access
6. **Clerk Account** - For authentication

### Supabase Database Setup

1. Create a new Supabase project
2. Go to **Project Settings > Database**
3. Under **Connection pooling**, choose **Transaction** mode
4. Copy the connection details:
   - Host: `aws-0-us-east-2.pooler.supabase.com`
   - Port: `6543`
   - User: `postgres.xxxxxxxxxxxxxxxxxxxxx`
   - Password: Your database password

### Installation

#### Option 1: Quick Setup (Recommended)
```bash
cd sirpi-google
python scripts/setup.py
```

This will automatically:
- Install `uv` if not present
- Create virtual environment
- Install all dependencies
- Create `.env` file from template
- Set up database migrations

#### Option 2: Manual Setup
1. **Clone and setup**:
```bash
cd sirpi-google

# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

2. **Environment Configuration**:
```bash
cp env.example .env
# Edit .env with your actual values
```

3. **Database Setup**:
```bash
# Create initial migration
uv run alembic revision --autogenerate -m "Initial migration"

# Apply migrations
uv run alembic upgrade head
```

4. **Test database connection**:
```bash
# Test your database configuration
uv run python -m app.utils.db_test
```

5. **Run the application**:
```bash
# Development
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Development with extra dependencies
uv pip install -e ".[dev]"
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uv pip install -e ".[production]"
uv run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🔧 Configuration

### Required Environment Variables

#### Database Configuration
```env
# Transaction Pooler (Recommended for FastAPI)
DB_USER=postgres.xxxxxxxxxxxxxxxxxxxxx
DB_PASSWORD=your-database-password
DB_HOST=aws-0-us-east-2.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres

# Alternative: Direct Connection URL
# DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

#### Google Cloud Configuration
```env
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_DEFAULT_REGION=us-central1
GCS_BUCKET_NAME=sirpi-generated-files
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_AGENT_ENGINE_PROJECT=your-gcp-project-id
```

#### LLM Configuration
```env
PORTKEY_API_KEY=your-portkey-api-key
PORTKEY_OPENROUTER_VIRTUAL_KEY=your-openrouter-virtual-key
ANALYZER_MODEL=anthropic/claude-3-sonnet-20240229
PLANNER_MODEL=openai/gpt-4-turbo-preview
GENERATOR_MODEL=anthropic/claude-3-sonnet-20240229
DEPLOYER_MODEL=openai/gpt-4-turbo-preview
```

#### Authentication
```env
CLERK_WEBHOOK_SIGNING_SECRET=your-clerk-webhook-secret
CLERK_SECRET_KEY=your-clerk-secret-key
```

## 🤖 Agent Development Kit Integration

### Session Management
The platform uses Vertex AI Agent Engine for managing agent sessions:

```python
# Create a new agent session
session = await create_agent_session(
    user_id=user_id,
    project_id=project_id,
    session_name=f"deployment-{project_id}"
)

# Agents coordinate through the session
analyzer_result = await analyzer_agent.analyze(session_id=session.vertex_session_id)
planner_result = await planner_agent.plan(session_id=session.vertex_session_id, analysis=analyzer_result)
```

### Agent Coordination
Agents hand off work to each other based on workflow phases:

1. **Analysis Phase**: Repository analysis and framework detection
2. **Planning Phase**: Infrastructure design and resource planning
3. **Generation Phase**: Code and configuration generation
4. **Deployment Phase**: Infrastructure provisioning and application deployment

## 📊 Database Migrations

### Creating Migrations
```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Create empty migration
alembic revision -m "Description of changes"
```

### Applying Migrations
```bash
# Apply all pending migrations
alembic upgrade head

# Apply specific migration
alembic upgrade revision_id

# Rollback to previous migration
alembic downgrade -1
```

## 🔍 API Documentation

When running in development mode (`DEBUG=true`), API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

- `GET /health` - Health check
- `POST /api/projects` - Create new deployment project
- `GET /api/projects/{project_id}/status` - Get project status
- `POST /api/agents/sessions` - Create agent session
- `GET /api/templates` - List deployment templates

## 🧪 Testing

```bash
# Install dev dependencies
uv pip install -e ".[dev]"

# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov=app

# Run specific test file
uv run pytest tests/test_agents.py

# Run linting and formatting
uv run black .
uv run isort .
uv run ruff check .
uv run mypy .
```

## 📦 Deployment

### Docker Deployment
```dockerfile
FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy project files
COPY pyproject.toml ./
COPY app/ ./app/

# Install dependencies
RUN uv pip install --system -e ".[production]"

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### Google Cloud Run
```bash
# Build and deploy
gcloud run deploy sirpi-google-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔐 Security

- All sensitive data is encrypted using `ENCRYPTION_KEY`
- JWT tokens for API authentication
- Clerk integration for user management
- Google Cloud IAM for resource access
- Input validation and sanitization

## 📈 Monitoring

- Application logs via Python logging
- Request timing middleware
- Cost tracking for LLM usage
- Cloud resource monitoring
- Agent performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

Built for the **Agent Development Kit Hackathon with Google Cloud** 🚀 