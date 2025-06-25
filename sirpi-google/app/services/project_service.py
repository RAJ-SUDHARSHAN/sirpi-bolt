"""
Project Service

Service layer for project-related business logic including:
- Project creation and configuration
- Framework detection and analysis
- Multi-agent workflow management
- Project lifecycle management
"""

import logging
import uuid
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.models.project import Project, ProjectStatus, FrameworkType, DeploymentStatus
from app.models.repository import Repository
from app.models.user import User
from app.utils.slug import slugify, generate_unique_slug

logger = logging.getLogger(__name__)


class ProjectService:
    """Service for managing projects and their workflows"""

    def __init__(self, db: Session):
        self.db = db

    async def create_project(
        self,
        user_id: str,
        repository_id: str,
        name: str,
        description: Optional[str] = None,
        template_id: Optional[str] = None,
    ) -> Project:
        """
        Create a new project from an imported repository.

        Args:
            user_id: ID of the user creating the project
            repository_id: ID of the imported repository
            name: Name of the project
            description: Optional project description
            template_id: Deployment template to use

        Returns:
            Created project instance

        Raises:
            ValueError: If repository not found or already has a project
        """
        try:
            # Validate repository exists and belongs to user
            repository = (
                self.db.query(Repository)
                .filter(
                    and_(Repository.id == repository_id, Repository.user_id == user_id)
                )
                .first()
            )

            if not repository:
                raise ValueError("Repository not found or access denied")

            # Check if project already exists for this repository
            existing_project = (
                self.db.query(Project)
                .filter(Project.repository_id == repository_id)
                .first()
            )

            if existing_project:
                raise ValueError("Project already exists for this repository")

            # Generate unique slug
            base_slug = slugify(name)
            slug = generate_unique_slug(self.db, Project, base_slug, user_id)

            # Detect framework from repository
            framework, framework_version = await self._detect_framework(repository)

            # Create project
            project = Project(
                id=uuid.uuid4(),
                user_id=user_id,
                repository_id=repository_id,
                name=name.strip(),
                slug=slug,
                description=description.strip() if description else None,
                status=ProjectStatus.INITIALIZING,
                framework=framework,
                framework_version=framework_version,
                template_id=template_id or "gcp-cloud-run",
                cloud_provider="gcp",
                cloud_region="us-central1",
                deployment_status=DeploymentStatus.NOT_STARTED,
            )

            self.db.add(project)
            self.db.commit()
            self.db.refresh(project)

            logger.info(f"Created project {project.id} for repository {repository_id}")
            return project

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating project: {e}")
            raise

    async def list_user_projects(
        self, user_id: str, skip: int = 0, limit: int = 50
    ) -> Tuple[List[Project], int]:
        """
        List projects for a user with pagination.

        Args:
            user_id: ID of the user
            skip: Number of projects to skip
            limit: Maximum number of projects to return

        Returns:
            Tuple of (projects list, total count)
        """
        try:
            # Get total count
            total = self.db.query(Project).filter(Project.user_id == user_id).count()

            # Get paginated projects
            projects = (
                self.db.query(Project)
                .filter(Project.user_id == user_id)
                .order_by(desc(Project.updated_at))
                .offset(skip)
                .limit(limit)
                .all()
            )

            return projects, total

        except Exception as e:
            logger.error(f"Error listing projects for user {user_id}: {e}")
            raise

    async def get_project(self, project_id: str, user_id: str) -> Optional[Project]:
        """
        Get a specific project by ID.

        Args:
            project_id: ID of the project
            user_id: ID of the user (for access control)

        Returns:
            Project instance or None if not found
        """
        try:
            project = (
                self.db.query(Project)
                .filter(and_(Project.id == project_id, Project.user_id == user_id))
                .first()
            )

            return project

        except Exception as e:
            logger.error(f"Error fetching project {project_id}: {e}")
            raise

    async def update_project(
        self, project_id: str, user_id: str, updates: Dict[str, Any]
    ) -> Optional[Project]:
        """
        Update project configuration.

        Args:
            project_id: ID of the project
            user_id: ID of the user (for access control)
            updates: Dictionary of fields to update

        Returns:
            Updated project instance or None if not found
        """
        try:
            project = await self.get_project(project_id, user_id)
            if not project:
                return None

            # Update allowed fields
            for field, value in updates.items():
                if hasattr(project, field):
                    setattr(project, field, value)

            self.db.commit()
            self.db.refresh(project)

            logger.info(f"Updated project {project_id}")
            return project

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating project {project_id}: {e}")
            raise

    async def delete_project(self, project_id: str, user_id: str) -> bool:
        """
        Delete a project and all associated resources.

        Args:
            project_id: ID of the project
            user_id: ID of the user (for access control)

        Returns:
            True if deleted, False if not found
        """
        try:
            project = await self.get_project(project_id, user_id)
            if not project:
                return False

            # Delete project (cascades to related records)
            self.db.delete(project)
            self.db.commit()

            logger.info(f"Deleted project {project_id}")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting project {project_id}: {e}")
            raise

    async def start_workflow(
        self, project_id: str, user_id: str, workflow_config: Dict[str, Any]
    ) -> bool:
        """
        Start the multi-agent infrastructure workflow for a project.

        Args:
            project_id: ID of the project
            user_id: ID of the user (for access control)
            workflow_config: Configuration for the workflow

        Returns:
            True if workflow started, False if not found or already running
        """
        try:
            project = await self.get_project(project_id, user_id)
            if not project:
                return False

            # Check if workflow is already running
            if project.status in [
                ProjectStatus.ANALYZING,
                ProjectStatus.PLANNING,
                ProjectStatus.GENERATING,
                ProjectStatus.DEPLOYING,
            ]:
                logger.warning(f"Workflow already running for project {project_id}")
                return False

            # Update project status and workflow state
            project.status = ProjectStatus.ANALYZING
            project.current_agent = "repository_analyzer"
            project.workflow_phase = "analysis"
            project.agent_coordination_data = {
                "workflow_started": True,
                "workflow_config": workflow_config,
                "phase_history": ["analysis"],
            }

            self.db.commit()

            # TODO: Trigger actual multi-agent workflow
            # This would integrate with your agent orchestration system

            logger.info(f"Started workflow for project {project_id}")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error starting workflow for project {project_id}: {e}")
            raise

    async def get_workflow_status(
        self, project_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the current workflow status for a project.

        Args:
            project_id: ID of the project
            user_id: ID of the user (for access control)

        Returns:
            Workflow status information or None if not found
        """
        try:
            project = await self.get_project(project_id, user_id)
            if not project:
                return None

            return {
                "project_id": str(project.id),
                "current_agent": project.current_agent,
                "workflow_phase": project.workflow_phase,
                "status": project.status.value,
                "agent_coordination_data": project.agent_coordination_data,
                "last_updated": project.updated_at,
            }

        except Exception as e:
            logger.error(
                f"Error fetching workflow status for project {project_id}: {e}"
            )
            raise

    async def _detect_framework(
        self, repository: Repository
    ) -> Tuple[Optional[FrameworkType], Optional[str]]:
        """
        Detect the framework and version from a repository.

        This is a simplified implementation. In practice, you would
        analyze the repository files to detect the framework.

        Args:
            repository: Repository to analyze

        Returns:
            Tuple of (framework_type, version)
        """
        try:
            # Simple detection based on repository language
            # In practice, you'd analyze package.json, requirements.txt, etc.

            if not repository.language:
                return None, None

            language_lower = repository.language.lower()

            # JavaScript/TypeScript projects
            if language_lower in ["javascript", "typescript"]:
                # Would check package.json for framework
                return FrameworkType.NEXTJS, None

            # Python projects
            elif language_lower == "python":
                # Would check requirements.txt, setup.py, etc.
                return FrameworkType.FASTAPI, None

            # Go projects
            elif language_lower == "go":
                return FrameworkType.GO, None

            # Java projects
            elif language_lower == "java":
                return FrameworkType.JAVA, None

            # Rust projects
            elif language_lower == "rust":
                return FrameworkType.RUST, None

            else:
                return FrameworkType.OTHER, None

        except Exception as e:
            logger.error(
                f"Error detecting framework for repository {repository.id}: {e}"
            )
            return None, None
