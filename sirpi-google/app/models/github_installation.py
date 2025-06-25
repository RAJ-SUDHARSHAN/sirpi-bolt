"""GitHub Installation model for storing GitHub App installations."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class GitHubInstallation(Base):
    """
    Model for storing GitHub App installations linked to users.
    This stores the connection between a user and their GitHub installation.
    """

    __tablename__ = "github_installations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    installation_id = Column(String, nullable=False, index=True, unique=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # GitHub account information
    account_name = Column(String, nullable=True)  # GitHub username/org name
    account_type = Column(String, nullable=True)  # 'User' or 'Organization'
    account_avatar_url = Column(String, nullable=True)

    # Installation state
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="github_installations")
