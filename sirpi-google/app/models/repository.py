import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # GitHub repository details
    github_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    full_name = Column(String, nullable=False, index=True)  # owner/repo
    description = Column(Text, nullable=True)
    html_url = Column(String, nullable=False)
    clone_url = Column(String, nullable=True)
    ssh_url = Column(String, nullable=True)

    # Repository metadata
    language = Column(String, nullable=True)
    default_branch = Column(String, default="main")
    is_private = Column(Boolean, default=False)
    is_fork = Column(Boolean, default=False)

    # Repository analysis cache
    framework_detected = Column(String, nullable=True)  # Detected framework
    package_manager = Column(String, nullable=True)  # npm, pip, etc.
    build_tool = Column(String, nullable=True)  # webpack, vite, etc.
    last_analyzed_at = Column(DateTime(timezone=True), nullable=True)
    analysis_results = Column(Text, nullable=True)  # JSON string of analysis

    # Connection status
    is_connected = Column(Boolean, default=True)
    connection_error = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="repositories")
    projects = relationship(
        "Project", back_populates="repository", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Repository(id={self.id}, full_name={self.full_name})>"
