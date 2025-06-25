"""Users router for user management and profile endpoints."""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.repository import Repository
from app.models.github_installation import GitHubInstallation
from app.auth import get_current_user_id

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


class UserOverview(BaseModel):
    """User overview response model."""

    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    github_username: Optional[str]
    github_connected: bool
    gcp_project_id: Optional[str]
    gcp_connected: bool
    projects: dict = {"items": [], "total": 0}


async def get_current_user(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
) -> User:
    """Get current user from database."""
    user = db.query(User).filter(User.clerk_user_id == user_id).first()

    if not user:
        # User not found - this should not happen if webhook is properly configured
        logger.error(
            f"User {user_id} not found in database. Webhook may not have fired."
        )
        raise HTTPException(
            status_code=404,
            detail="User not found. Please contact support if this persists.",
        )

    return user


@router.get("/me/overview")
async def get_user_overview(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    """Get current user overview with projects and connection status."""
    try:
        user = await get_current_user(user_id, db)

        # Check GitHub connection via installations
        github_installations = (
            db.query(GitHubInstallation)
            .filter(
                GitHubInstallation.user_id == user.id,
                GitHubInstallation.is_active == True,
            )
            .all()
        )
        github_connected = len(github_installations) > 0

        # Check GCP connection
        gcp_connected = bool(user.gcp_project_id and user.gcp_service_account_key)

        # Fetch user's projects using the database UUID
        projects = (
            db.query(Project)
            .filter(Project.user_id == str(user.id))
            .order_by(Project.updated_at.desc())
            .all()
        )

        # Fetch user's repositories
        repositories = (
            db.query(Repository)
            .filter(Repository.user_id == str(user.id))
            .order_by(Repository.updated_at.desc())
            .all()
        )

        # Convert repositories to dictionary format expected by frontend
        repositories_data = [
            {
                "id": str(repository.id),
                "name": repository.name,
                "full_name": repository.full_name,
                "description": repository.description,
                "language": repository.language,
                "framework_info": {
                    "framework": repository.framework_detected or "unknown",
                    "display_name": repository.framework_detected.title()
                    if repository.framework_detected
                    else "Unknown",
                    "icon": "📦",  # Default icon
                    "version": None,  # Repository model doesn't have version
                }
                if repository.framework_detected
                else {
                    "framework": "unknown",
                    "display_name": "Unknown",
                    "icon": "📦",
                    "version": None,
                },
                "analysis_status": "completed"
                if repository.last_analyzed_at
                else "pending",
                "is_connected": repository.is_connected,
            }
            for repository in repositories
        ]

        # Convert projects to dictionary format expected by frontend
        projects_data = [
            {
                "id": str(project.id),
                "name": project.name,
                "slug": project.slug,
                "description": project.description,
                "repository_id": str(project.repository_id),
                "repository_name": project.repository.name
                if project.repository
                else None,
                "framework_info": {
                    "framework": project.framework.value
                    if project.framework
                    else "unknown",
                    "display_name": project.framework.value.title()
                    if project.framework
                    else "Unknown",
                    "icon": "📦",  # Default icon
                    "version": project.framework_version,
                }
                if project.framework
                else {
                    "framework": "unknown",
                    "display_name": "Unknown",
                    "icon": "📦",
                    "version": None,
                },
                "current_agent": project.current_agent,
                "workflow_phase": project.workflow_phase or "initializing",
                "agent_coordination_data": project.agent_coordination_data,
                "infrastructure_config": None,  # This field doesn't exist in the model, set to None
                "deployment_config": project.deployment_config,
                "status": project.status.value if project.status else "initializing",
                "resources": [],  # TODO: Add cloud resources if needed
                "created_at": project.created_at.isoformat()
                if project.created_at
                else None,
                "updated_at": project.updated_at.isoformat()
                if project.updated_at
                else None,
            }
            for project in projects
        ]

        # Return the nested structure expected by frontend
        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_image_url": user.profile_image_url,
                "github_username": user.github_username,
                "github_avatar_url": user.github_avatar_url,
                "gcp_project_id": user.gcp_project_id,
                "gcp_region": user.gcp_default_region,
            },
            "github": {
                "connected": github_connected,
                "username": user.github_username,
                "avatar_url": user.github_avatar_url,
                "installation_id": str(github_installations[0].installation_id)
                if github_installations
                else None,
            },
            "repositories": {
                "count": len(repositories),
                "items": repositories_data,
            },
            "projects": {
                "count": len(projects),
                "items": projects_data,
            },
        }

    except Exception as e:
        logger.error(f"Error getting user overview: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user overview")


@router.get("/me")
async def get_current_user_profile(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return {
        "id": str(user.id),
        "clerk_user_id": user.clerk_user_id,
        "email": user.email,
        "full_name": user.full_name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "github_username": user.github_username,
        "gcp_project_id": user.gcp_project_id,
    }
