import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Integer,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class GeneratedFile(Base):
    __tablename__ = "generated_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    # File Details
    file_path = Column(
        String, nullable=False, index=True
    )  # Relative path within project
    file_name = Column(String, nullable=False, index=True)  # Just the filename
    file_type = Column(
        String, nullable=False, index=True
    )  # 'terraform', 'dockerfile', 'config', 'script', 'yaml'
    file_content = Column(Text, nullable=False)  # Actual file content
    file_size = Column(Integer, nullable=True)  # Size in bytes
    file_hash = Column(String, nullable=True)  # SHA256 hash for deduplication

    # Generation Metadata
    generated_by_agent = Column(
        String, nullable=False, index=True
    )  # Which agent generated this
    generation_prompt = Column(Text, nullable=True)  # Prompt used to generate
    generation_model = Column(
        String, nullable=True
    )  # Model used (e.g., 'gpt-4', 'claude-3')
    generation_context = Column(JSON, nullable=True)  # Context used for generation

    # Template and customization
    template_used = Column(String, nullable=True)  # Base template if any
    user_modifications = Column(JSON, nullable=True)  # User customizations applied

    # Version Control
    version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True)  # Current active version
    parent_file_id = Column(
        UUID(as_uuid=True), ForeignKey("generated_files.id"), nullable=True
    )  # Previous version
    change_summary = Column(Text, nullable=True)  # What changed in this version

    # Cloud Storage (Optional - for large files)
    gcs_bucket = Column(String, nullable=True)  # GCS bucket if stored externally
    gcs_object_path = Column(String, nullable=True)  # GCS object path
    is_stored_externally = Column(Boolean, default=False)  # Whether content is in GCS

    # File Status and Validation
    is_valid = Column(Boolean, default=True)  # Whether file passed validation
    validation_errors = Column(JSON, nullable=True)  # Validation error details
    syntax_check_passed = Column(Boolean, nullable=True)  # Syntax validation result

    # Usage and Dependencies
    dependencies = Column(JSON, nullable=True)  # Files this depends on
    dependents = Column(JSON, nullable=True)  # Files that depend on this
    usage_count = Column(Integer, default=0)  # How many times this file was used

    # Deployment tracking
    is_deployed = Column(
        Boolean, default=False
    )  # Whether this file is currently deployed
    deployed_at = Column(DateTime(timezone=True), nullable=True)  # When it was deployed
    deployment_status = Column(String, nullable=True)  # 'pending', 'deployed', 'failed'

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project = relationship("Project", back_populates="generated_files")
    parent_file = relationship("GeneratedFile", remote_side=[id])
    child_files = relationship("GeneratedFile", remote_side=[parent_file_id])

    def __repr__(self):
        return f"<GeneratedFile(id={self.id}, file_path={self.file_path}, file_type={self.file_type})>"
