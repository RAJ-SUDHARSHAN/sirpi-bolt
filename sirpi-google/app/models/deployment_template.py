import uuid
from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class DeploymentTemplate(Base):
    __tablename__ = "deployment_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Template Identity
    template_id = Column(
        String, unique=True, nullable=False, index=True
    )  # Unique identifier like 'nextjs-gcp-basic'
    name = Column(String, nullable=False, index=True)  # Human-readable name
    display_name = Column(String, nullable=False)  # Display name for UI
    description = Column(Text, nullable=True)  # Template description

    # Template Categorization
    category = Column(
        String, nullable=False, index=True
    )  # 'web', 'api', 'fullstack', 'microservice'
    framework = Column(
        String, nullable=False, index=True
    )  # 'nextjs', 'react', 'python', etc.
    cloud_provider = Column(
        String, nullable=False, index=True
    )  # 'gcp', 'aws', 'azure', 'multi'

    # Template Configuration
    template_config = Column(JSON, nullable=False)  # Full template configuration
    default_variables = Column(JSON, nullable=True)  # Default template variables
    required_variables = Column(JSON, nullable=True)  # Required user inputs
    optional_variables = Column(JSON, nullable=True)  # Optional customizations

    # Infrastructure Definition
    infrastructure_files = Column(
        JSON, nullable=False
    )  # Template files (Terraform, etc.)
    application_config = Column(
        JSON, nullable=True
    )  # Application configuration templates
    deployment_scripts = Column(JSON, nullable=True)  # Deployment scripts and commands

    # Template Metadata
    version = Column(String, default="1.0.0")  # Template version
    author = Column(String, nullable=True)  # Template author
    tags = Column(JSON, nullable=True)  # Template tags for filtering

    # Requirements and Compatibility
    min_requirements = Column(JSON, nullable=True)  # Minimum resource requirements
    supported_regions = Column(JSON, nullable=True)  # Supported cloud regions
    prerequisites = Column(JSON, nullable=True)  # Prerequisites for using this template

    # Cost Information
    estimated_cost_range = Column(
        JSON, nullable=True
    )  # Cost estimates {"min": 10, "max": 50, "currency": "USD"}
    cost_factors = Column(JSON, nullable=True)  # Factors affecting cost

    # Usage and Popularity
    usage_count = Column(Integer, default=0)  # How many times this template was used
    success_rate = Column(Integer, default=100)  # Success rate percentage
    average_deployment_time = Column(
        Integer, nullable=True
    )  # Average deployment time in minutes

    # Template Status
    is_active = Column(Boolean, default=True)  # Whether template is available for use
    is_featured = Column(Boolean, default=False)  # Featured template
    is_official = Column(Boolean, default=False)  # Official Sirpi template
    is_community = Column(Boolean, default=False)  # Community-contributed template

    # Documentation and Support
    documentation_url = Column(String, nullable=True)  # Link to documentation
    example_projects = Column(
        JSON, nullable=True
    )  # Example projects using this template
    troubleshooting_guide = Column(Text, nullable=True)  # Common issues and solutions

    # Validation and Testing
    last_tested_at = Column(
        DateTime(timezone=True), nullable=True
    )  # When template was last tested
    test_results = Column(JSON, nullable=True)  # Latest test results
    validation_status = Column(
        String, default="pending"
    )  # 'pending', 'validated', 'failed'

    # Template Evolution
    parent_template_id = Column(
        String, nullable=True
    )  # If this is derived from another template
    changelog = Column(JSON, nullable=True)  # Version changelog
    deprecation_notice = Column(
        Text, nullable=True
    )  # Deprecation information if applicable

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    published_at = Column(
        DateTime(timezone=True), nullable=True
    )  # When template was published

    def __repr__(self):
        return f"<DeploymentTemplate(id={self.id}, template_id={self.template_id}, name={self.name})>"
