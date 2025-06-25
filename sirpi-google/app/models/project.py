import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Enum,
    JSON,
    Numeric,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ProjectStatus(enum.Enum):
    INITIALIZING = "initializing"
    ANALYZING = "analyzing"
    PLANNING = "planning"
    GENERATING = "generating"
    CONFIGURING = "configuring"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    FAILED = "failed"
    PAUSED = "paused"


class FrameworkType(enum.Enum):
    NEXTJS = "nextjs"
    REACT = "react"
    VUE = "vue"
    ANGULAR = "angular"
    SVELTE = "svelte"
    NODEJS = "nodejs"
    PYTHON = "python"
    DJANGO = "django"
    FLASK = "flask"
    FASTAPI = "fastapi"
    GO = "go"
    RUST = "rust"
    JAVA = "java"
    OTHER = "other"


class DeploymentStatus(enum.Enum):
    NOT_STARTED = "not_started"
    PLANNING = "planning"
    PROVISIONING = "provisioning"
    CONFIGURING = "configuring"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    FAILED = "failed"
    DESTROYING = "destroying"
    DESTROYED = "destroyed"


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    repository_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Basic project info
    name = Column(String, nullable=False, index=True)
    slug = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Project status and framework
    status = Column(
        Enum(ProjectStatus), default=ProjectStatus.INITIALIZING, nullable=False
    )
    framework = Column(Enum(FrameworkType), nullable=True)
    framework_version = Column(String, nullable=True)
    root_directory = Column(String, default="./")

    # Multi-Agent Workflow State
    current_agent = Column(String, nullable=True)  # Currently active agent
    workflow_phase = Column(String, nullable=True)  # Current workflow phase
    agent_coordination_data = Column(JSON, nullable=True)  # Agent coordination info

    # Build and deployment configuration
    build_command = Column(String, nullable=True)
    start_command = Column(String, nullable=True)
    install_command = Column(String, nullable=True)
    environment_variables = Column(JSON, nullable=True)  # Non-sensitive env vars

    # Cloud Provider Configuration
    cloud_provider = Column(String, default="gcp")  # 'gcp', 'aws', 'azure'
    cloud_region = Column(String, default="us-central1")
    cloud_project_id = Column(String, nullable=True)  # GCP Project ID

    # Deployment Configuration
    deployment_status = Column(
        Enum(DeploymentStatus), default=DeploymentStatus.NOT_STARTED
    )
    deployment_url = Column(String, nullable=True)
    deployment_endpoints = Column(JSON, nullable=True)  # All deployed endpoints
    deployment_config = Column(JSON, nullable=True)  # Deployment-specific config

    # Template and customization
    template_id = Column(String, nullable=True)  # Base template used
    template_customizations = Column(JSON, nullable=True)  # User customizations

    # Cost tracking
    estimated_monthly_cost = Column(Numeric(10, 2), nullable=True)
    actual_monthly_cost = Column(Numeric(10, 2), nullable=True)

    # Timestamps
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    last_deployment_attempt = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="projects")
    repository = relationship("Repository", back_populates="projects")
    agent_sessions = relationship(
        "AgentSession", back_populates="project", cascade="all, delete-orphan"
    )
    generated_files = relationship(
        "GeneratedFile", back_populates="project", cascade="all, delete-orphan"
    )
    cloud_resources = relationship(
        "CloudResource", back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name}, status={self.status})>"
