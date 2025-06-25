"""
Projects API Router

This module handles all project-related API endpoints including:
- Creating new projects from imported repositories
- Managing project lifecycle and configuration
- Starting and monitoring multi-agent workflows
- Project CRUD operations
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import create_get_current_user_id
from app.models.project import Project
from app.services.project_service import ProjectService
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectListResponse,
    ProjectUpdateRequest,
    WorkflowStartRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Create the dependency with database access
get_current_user_id = create_get_current_user_id(get_db)


@router.post("", response_model=ProjectResponse)
async def create_project(
    request: ProjectCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Create a new project from an imported repository.

    This endpoint:
    1. Creates a project record linked to a repository
    2. Generates a unique slug for the project
    3. Initializes project with default configuration
    4. Sets up basic framework detection
    """
    try:
        logger.info(f"Creating project '{request.name}' for user {current_user_id}")

        project_service = ProjectService(db)
        project = await project_service.create_project(
            user_id=current_user_id,
            repository_id=request.repository_id,
            name=request.name,
            description=request.description,
            template_id=request.template_id,
        )

        logger.info(f"Successfully created project {project.id}")
        return ProjectResponse.from_orm(project)

    except ValueError as e:
        logger.error(f"Validation error creating project: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project",
        )


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    skip: int = 0,
    limit: int = 50,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    List all projects for the current user with pagination.
    """
    try:
        project_service = ProjectService(db)
        projects, total = await project_service.list_user_projects(
            user_id=current_user_id, skip=skip, limit=limit
        )

        return ProjectListResponse(
            projects=[ProjectResponse.from_orm(p) for p in projects],
            total=total,
            skip=skip,
            limit=limit,
        )

    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch projects",
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get a specific project by ID.
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.get_project(
            project_id=project_id, user_id=current_user_id
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        return ProjectResponse.from_orm(project)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch project",
        )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    request: ProjectUpdateRequest,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Update project configuration.
    """
    try:
        project_service = ProjectService(db)
        project = await project_service.update_project(
            project_id=project_id,
            user_id=current_user_id,
            updates=request.dict(exclude_unset=True),
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        return ProjectResponse.from_orm(project)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project",
        )


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Delete a project and all associated resources.
    """
    try:
        project_service = ProjectService(db)
        success = await project_service.delete_project(
            project_id=project_id, user_id=current_user_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        return {"message": "Project deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project",
        )


@router.post("/{project_id}/workflow/start")
async def start_workflow(
    project_id: str,
    request: WorkflowStartRequest,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Start the multi-agent infrastructure workflow for a project.

    This initiates the automated process of:
    1. Repository analysis
    2. Infrastructure planning
    3. Code generation
    4. Deployment preparation
    """
    try:
        project_service = ProjectService(db)
        success = await project_service.start_workflow(
            project_id=project_id,
            user_id=current_user_id,
            workflow_config=request.dict(exclude_unset=True),
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or workflow already running",
            )

        return {"message": "Workflow started successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting workflow for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start workflow",
        )


@router.get("/{project_id}/workflow/status")
async def get_workflow_status(
    project_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get the current status of the project's workflow.
    """
    try:
        project_service = ProjectService(db)
        status_info = await project_service.get_workflow_status(
            project_id=project_id, user_id=current_user_id
        )

        if not status_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        return status_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workflow status for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workflow status",
        )
