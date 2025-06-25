import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Numeric,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class CloudResource(Base):
    __tablename__ = "cloud_resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Resource Details
    resource_type = Column(
        String, nullable=False, index=True
    )  # 'compute_instance', 'load_balancer', 'database', 'storage'
    resource_name = Column(String, nullable=False, index=True)  # Human-readable name
    resource_id = Column(
        String, nullable=False, index=True
    )  # Cloud provider resource ID
    resource_arn = Column(String, nullable=True)  # AWS ARN or GCP resource name

    # Cloud Provider Details
    cloud_provider = Column(String, nullable=False, index=True)  # 'gcp', 'aws', 'azure'
    cloud_region = Column(String, nullable=False)  # Region where resource is deployed
    cloud_zone = Column(String, nullable=True)  # Specific zone if applicable
    cloud_project_id = Column(String, nullable=True)  # GCP project ID or AWS account ID

    # Resource Configuration
    resource_config = Column(JSON, nullable=True)  # Full resource configuration
    resource_specs = Column(
        JSON, nullable=True
    )  # Technical specifications (CPU, memory, etc.)
    resource_tags = Column(JSON, nullable=True)  # Resource tags/labels

    # Network and Access
    public_ip = Column(String, nullable=True)  # Public IP if applicable
    private_ip = Column(String, nullable=True)  # Private IP
    dns_name = Column(String, nullable=True)  # DNS name or endpoint
    ports = Column(JSON, nullable=True)  # Open ports and protocols

    # Cost and Billing
    estimated_hourly_cost = Column(
        Numeric(10, 4), nullable=True
    )  # Estimated cost per hour
    estimated_monthly_cost = Column(
        Numeric(10, 2), nullable=True
    )  # Estimated monthly cost
    actual_cost_to_date = Column(Numeric(10, 2), nullable=True)  # Actual cost incurred
    billing_account = Column(String, nullable=True)  # Billing account ID

    # Resource Status and Health
    resource_status = Column(
        String, nullable=False, index=True
    )  # 'creating', 'running', 'stopped', 'error', 'terminated'
    health_status = Column(String, nullable=True)  # 'healthy', 'unhealthy', 'unknown'
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    status_message = Column(Text, nullable=True)  # Additional status information

    # Terraform Integration
    terraform_resource_address = Column(
        String, nullable=True, index=True
    )  # Terraform resource address
    terraform_state = Column(JSON, nullable=True)  # Terraform state for this resource
    terraform_plan_hash = Column(
        String, nullable=True
    )  # Hash of the plan that created this

    # Dependencies and Relationships
    depends_on = Column(JSON, nullable=True)  # Resources this depends on
    dependents = Column(JSON, nullable=True)  # Resources that depend on this
    resource_group = Column(String, nullable=True)  # Logical grouping of resources

    # Monitoring and Alerts
    monitoring_enabled = Column(Boolean, default=False)
    alert_rules = Column(JSON, nullable=True)  # Alert configurations
    metrics_config = Column(JSON, nullable=True)  # Monitoring metrics configuration

    # Backup and Recovery
    backup_enabled = Column(Boolean, default=False)
    backup_schedule = Column(String, nullable=True)  # Backup schedule if applicable
    last_backup_at = Column(DateTime(timezone=True), nullable=True)

    # Security
    security_groups = Column(JSON, nullable=True)  # Security groups or firewall rules
    encryption_enabled = Column(Boolean, default=False)
    encryption_key = Column(String, nullable=True)  # Encryption key reference

    # Lifecycle Management
    auto_scaling_enabled = Column(Boolean, default=False)
    auto_scaling_config = Column(JSON, nullable=True)
    scheduled_actions = Column(JSON, nullable=True)  # Scheduled start/stop actions

    # Timestamps
    provisioned_at = Column(
        DateTime(timezone=True), nullable=True
    )  # When resource was created
    last_modified_at = Column(
        DateTime(timezone=True), nullable=True
    )  # Last configuration change
    terminated_at = Column(
        DateTime(timezone=True), nullable=True
    )  # When resource was terminated
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project = relationship("Project", back_populates="cloud_resources")

    def __repr__(self):
        return f"<CloudResource(id={self.id}, resource_type={self.resource_type}, resource_name={self.resource_name}, status={self.resource_status})>"
