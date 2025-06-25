from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings that can be loaded from environment variables."""

    # FastAPI settings
    API_TITLE: str = Field(
        "Sirpi Google ADK API", description="API title for documentation"
    )
    API_DESCRIPTION: str = Field(
        "Multi-Agent Infrastructure Deployment Platform using Google Cloud ADK",
        description="API description for documentation",
    )
    API_VERSION: str = Field("1.0.0", description="API version")
    DEBUG: bool = Field(False, description="Debug mode")

    # Database Configuration (Transaction Pooler)
    DATABASE_URL: str = Field(
        ..., description="PostgreSQL connection string with transaction pooler"
    )

    # Google Cloud Configuration
    GOOGLE_CLOUD_PROJECT_ID: str = Field(..., description="Google Cloud Project ID")
    GOOGLE_APPLICATION_CREDENTIALS: str = Field(
        ..., description="Path to GCP service account JSON"
    )
    GCP_DEFAULT_REGION: str = Field("us-central1", description="Default GCP region")

    # Google Cloud Storage
    GCS_BUCKET_NAME: str = Field(
        ..., description="Google Cloud Storage bucket for generated files"
    )

    # Vertex AI Configuration
    VERTEX_AI_LOCATION: str = Field("us-central1", description="Vertex AI location")
    VERTEX_AI_AGENT_ENGINE_PROJECT: str = Field(
        ..., description="Project ID for Vertex AI Agent Engine"
    )

    # Firestore Configuration (for flexible agent data)
    FIRESTORE_DATABASE_ID: str = Field("(default)", description="Firestore database ID")

    # LLM Configuration - Portkey + OpenRouter
    PORTKEY_API_KEY: str = Field(..., description="Portkey API key")
    PORTKEY_OPENROUTER_VIRTUAL_KEY: str = Field(
        ..., description="OpenRouter virtual key in Portkey"
    )

    # Default models for different agents
    ANALYZER_MODEL: str = Field(
        "anthropic/claude-3-sonnet-20240229", description="Model for analyzer agent"
    )
    PLANNER_MODEL: str = Field(
        "openai/gpt-4-turbo-preview", description="Model for planner agent"
    )
    GENERATOR_MODEL: str = Field(
        "anthropic/claude-3-sonnet-20240229", description="Model for generator agent"
    )
    DEPLOYER_MODEL: str = Field(
        "openai/gpt-4-turbo-preview", description="Model for deployer agent"
    )

    # LLM Parameters
    LLM_MAX_TOKENS: int = Field(4000, description="Maximum tokens for LLM responses")
    LLM_TEMPERATURE: float = Field(0.7, description="Temperature for LLM responses")
    LLM_ENABLE_CACHE: bool = Field(True, description="Enable LLM response caching")

    # Authentication - Clerk
    CLERK_WEBHOOK_SIGNING_SECRET: str = Field(
        ..., description="Clerk webhook signing secret"
    )

    # GitHub App Integration (for repository access and file creation)
    GITHUB_APP_ID: str = Field(..., description="GitHub App ID")
    GITHUB_APP_PRIVATE_KEY: str = Field(
        ..., description="GitHub App private key (PEM format)"
    )
    GITHUB_APP_NAME: str = Field(..., description="GitHub App name")
    GITHUB_APP_CLIENT_ID: str = Field(..., description="GitHub App client ID")
    GITHUB_APP_CLIENT_SECRET: str = Field(..., description="GitHub App client secret")
    GITHUB_WEBHOOK_SECRET: str = Field(..., description="GitHub webhook secret")

    # Frontend Configuration
    FRONTEND_URL: str = Field(
        "https://sirpi-frontend.rajs.dev",
        description="Frontend URL for CORS and redirects",
    )
    ALLOWED_ORIGINS: list[str] = Field(
        ["http://localhost:3000", "https://sirpi-frontend.rajs.dev"],
        description="Allowed CORS origins",
    )

    # Security
    SECRET_KEY: str = Field(..., description="Secret key for JWT and encryption")
    ENCRYPTION_KEY: str = Field(..., description="Encryption key for sensitive data")

    # Redis Configuration (for background tasks and caching)
    REDIS_URL: str = Field("redis://localhost:6379", description="Redis connection URL")

    # Agent Configuration
    MAX_CONCURRENT_AGENTS: int = Field(
        5, description="Maximum concurrent agents per session"
    )
    AGENT_TIMEOUT_SECONDS: int = Field(
        300, description="Agent operation timeout in seconds"
    )

    # Deployment Templates
    TEMPLATES_BUCKET: str = Field(
        ..., description="GCS bucket containing deployment templates"
    )

    # Cost Tracking
    ENABLE_COST_TRACKING: bool = Field(
        True, description="Enable cost tracking for LLM and cloud resources"
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
