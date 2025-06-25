import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)  # Store complete name from Clerk
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    username = Column(String, nullable=True, index=True)
    profile_image_url = Column(String, nullable=True)

    # GitHub Integration
    github_username = Column(String, nullable=True, index=True)
    github_id = Column(String, nullable=True)
    github_avatar_url = Column(String, nullable=True)

    # Google Cloud Integration
    gcp_project_id = Column(String, nullable=True)
    gcp_service_account_key = Column(Text, nullable=True)  # Encrypted JSON
    gcp_default_region = Column(String, default="us-central1")
    gcp_connected_at = Column(DateTime(timezone=True), nullable=True)

    # User preferences and settings
    preferred_cloud_provider = Column(String, default="gcp")  # 'gcp', 'aws', 'azure'
    default_deployment_region = Column(String, default="us-central1")

    # Account status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    projects = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )
    repositories = relationship(
        "Repository", back_populates="user", cascade="all, delete-orphan"
    )
    github_installations = relationship(
        "GitHubInstallation", back_populates="user", cascade="all, delete-orphan"
    )
    agent_sessions = relationship(
        "AgentSession", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
