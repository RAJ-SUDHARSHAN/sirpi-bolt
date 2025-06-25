"""
Project Schemas

Pydantic models for project-related API requests and responses.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from app.models.project import ProjectStatus, FrameworkType, DeploymentStatus


class ProjectCreateRequest(BaseModel):
    """Request model for creating a new project"""

    repository_id: str = Field(..., description="ID of the imported repository")
    name: str = Field(..., min_length=1, max_length=100, description="Project name")
    description: Optional[str] = Field(
        None, max_length=500, description="Project description"
    )
    template_id: Optional[str] = Field(
        "gcp-cloud-run", description="Deployment template ID"
    )

    @validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Project name cannot be empty")
        return v.strip()


class ProjectUpdateRequest(BaseModel):
    """Request model for updating project configuration"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    install_command: Optional[str] = None
    environment_variables: Optional[Dict[str, Any]] = None
    cloud_provider: Optional[str] = Field(None, pattern="^(gcp|aws|azure)$")
    cloud_region: Optional[str] = None


class WorkflowStartRequest(BaseModel):
    """Request model for starting a project workflow"""

    workflow_type: str = Field(
        "full_deployment", description="Type of workflow to start"
    )
    cloud_provider: Optional[str] = Field("gcp", pattern="^(gcp|aws|azure)$")
    deployment_config: Optional[Dict[str, Any]] = None


class FrameworkInfoResponse(BaseModel):
    """Framework information for a project"""

    framework: str
    display_name: str
    icon: str
    version: Optional[str] = None

    class Config:
        from_attributes = True


class CloudResourceResponse(BaseModel):
    """Cloud resource information"""

    id: str
    resource_type: str
    resource_name: Optional[str]
    cloud_provider: str
    status: str
    metadata: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    """Response model for project data"""

    id: str
    name: str
    slug: str
    description: Optional[str]
    repository_id: str
    repository_name: Optional[str] = None

    # Status and framework
    status: ProjectStatus
    framework: Optional[FrameworkType]
    framework_version: Optional[str]
    framework_info: Optional[FrameworkInfoResponse] = None

    # Workflow state
    current_agent: Optional[str]
    workflow_phase: Optional[str]
    agent_coordination_data: Optional[Dict[str, Any]]

    # Configuration
    build_command: Optional[str]
    start_command: Optional[str]
    install_command: Optional[str]
    environment_variables: Optional[Dict[str, Any]]

    # Cloud and deployment
    cloud_provider: str = "gcp"
    cloud_region: str = "us-central1"
    cloud_project_id: Optional[str]
    deployment_status: DeploymentStatus
    deployment_url: Optional[str]
    deployment_endpoints: Optional[Dict[str, Any]]
    deployment_config: Optional[Dict[str, Any]]

    # Template and customization
    template_id: Optional[str]
    template_customizations: Optional[Dict[str, Any]]

    # Cost tracking
    estimated_monthly_cost: Optional[float]
    actual_monthly_cost: Optional[float]

    # Resources
    resources: List[CloudResourceResponse] = []

    # Timestamps
    deployed_at: Optional[datetime]
    last_deployment_attempt: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, project):
        """Create response from ORM model with proper field mapping"""

        # Build framework info if framework is detected
        framework_info = None
        if project.framework:
            framework_info = FrameworkInfoResponse(
                framework=project.framework.value,
                display_name=project.framework.value.title(),
                icon=f"{project.framework.value}.svg",
                version=project.framework_version,
            )

        # Map cloud resources
        resources = []
        if hasattr(project, "cloud_resources"):
            resources = [
                CloudResourceResponse.from_orm(resource)
                for resource in project.cloud_resources
            ]

        # Get repository name if available
        repository_name = None
        if hasattr(project, "repository") and project.repository:
            repository_name = project.repository.name

        return cls(
            id=str(project.id),
            name=project.name,
            slug=project.slug,
            description=project.description,
            repository_id=str(project.repository_id),
            repository_name=repository_name,
            status=project.status,
            framework=project.framework,
            framework_version=project.framework_version,
            framework_info=framework_info,
            current_agent=project.current_agent,
            workflow_phase=project.workflow_phase,
            agent_coordination_data=project.agent_coordination_data,
            build_command=project.build_command,
            start_command=project.start_command,
            install_command=project.install_command,
            environment_variables=project.environment_variables,
            cloud_provider=project.cloud_provider,
            cloud_region=project.cloud_region,
            cloud_project_id=project.cloud_project_id,
            deployment_status=project.deployment_status,
            deployment_url=project.deployment_url,
            deployment_endpoints=project.deployment_endpoints,
            deployment_config=project.deployment_config,
            template_id=project.template_id,
            template_customizations=project.template_customizations,
            estimated_monthly_cost=float(project.estimated_monthly_cost)
            if project.estimated_monthly_cost
            else None,
            actual_monthly_cost=float(project.actual_monthly_cost)
            if project.actual_monthly_cost
            else None,
            resources=resources,
            deployed_at=project.deployed_at,
            last_deployment_attempt=project.last_deployment_attempt,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )


class ProjectListResponse(BaseModel):
    """Response model for project list with pagination"""

    projects: List[ProjectResponse]
    total: int
    skip: int
    limit: int

    class Config:
        from_attributes = True


class WorkflowStatusResponse(BaseModel):
    """Response model for workflow status"""

    project_id: str
    current_agent: Optional[str]
    workflow_phase: Optional[str]
    status: ProjectStatus
    agent_coordination_data: Optional[Dict[str, Any]]
    last_updated: datetime

    class Config:
        from_attributes = True
