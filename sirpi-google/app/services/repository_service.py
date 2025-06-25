"""Repository service for managing GitHub repository imports and operations."""

import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import httpx

from app.models.repository import Repository
from app.models.github_installation import GitHubInstallation
from app.schemas.repository import RepositoryCreate, RepositoryUpdate, RepositoryRead
from app.services.github_service import get_installation_by_user_id
from app.routers.github import get_installation_access_token

logger = logging.getLogger(__name__)


async def create_repository(db: Session, repository: RepositoryCreate) -> Repository:
    """Create a new repository record."""
    # Check if repository already exists
    existing_repo = (
        db.query(Repository)
        .filter(Repository.github_id == repository.github_id)
        .first()
    )
    if existing_repo:
        return existing_repo

    # Get GitHub installation if it exists
    installation = get_installation_by_user_id(db, repository.user_id)

    # Create new repository
    db_repository = Repository(
        github_id=repository.github_id,
        name=repository.name,
        full_name=repository.full_name,
        description=repository.description,
        html_url=repository.html_url,
        clone_url=repository.clone_url,
        ssh_url=repository.ssh_url,
        language=repository.language,
        default_branch=repository.default_branch,
        is_private=repository.is_private,
        is_fork=repository.is_fork,
        is_connected=True,
        user_id=repository.user_id,
    )
    db.add(db_repository)
    db.commit()
    db.refresh(db_repository)
    return db_repository


def get_repository_by_id(db: Session, repository_id: str) -> Optional[Repository]:
    """Get a repository by ID."""
    return db.query(Repository).filter(Repository.id == repository_id).first()


def get_repository_by_github_id(db: Session, github_id: str) -> Optional[Repository]:
    """Get a repository by GitHub ID."""
    return db.query(Repository).filter(Repository.github_id == github_id).first()


def get_repositories_by_user_id(db: Session, user_id: str) -> List[Repository]:
    """Get all repositories for a user."""
    return (
        db.query(Repository)
        .filter(Repository.user_id == user_id, Repository.is_connected == True)
        .order_by(Repository.updated_at.desc())
        .all()
    )


def update_repository(
    db: Session, repository_id: str, repository_update: RepositoryUpdate
) -> Optional[Repository]:
    """Update a repository."""
    repository = get_repository_by_id(db, repository_id)
    if not repository:
        return None

    update_data = repository_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(repository, field, value)

    db.commit()
    db.refresh(repository)
    return repository


def delete_repository(db: Session, repository_id: str) -> Dict[str, Any]:
    """Delete (disconnect) a repository."""
    repository = get_repository_by_id(db, repository_id)
    if not repository:
        return {"success": False, "error": "Repository not found"}

    repository.is_connected = False
    db.commit()

    return {
        "success": True,
        "message": f"Repository {repository.full_name} disconnected successfully",
    }


async def get_repository_details_from_github(
    installation_id: int, repo_full_name: str
) -> Dict[str, Any]:
    """Get repository details from GitHub API using installation token."""
    try:
        # Get installation access token
        access_token = await get_installation_access_token(installation_id)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{repo_full_name}",
                headers={
                    "Accept": "application/vnd.github.v3+json",
                    "Authorization": f"token {access_token}",
                },
            )

            if response.status_code != 200:
                raise Exception(f"Failed to get repository details: {response.text}")

            return response.json()

    except Exception as e:
        logger.error(f"Error getting repository details: {str(e)}")
        raise


async def import_github_repository(
    db: Session, user_id: str, full_name: str
) -> Optional[Repository]:
    """Import a GitHub repository for a user using GitHub App installation."""
    try:
        logger.info(f"Importing repository {full_name} for user {user_id}")

        # Get user's GitHub installation
        installation = get_installation_by_user_id(db, user_id)
        if not installation:
            raise ValueError(
                "No GitHub App installation found. Please connect your GitHub account."
            )

        # Get repository details from GitHub
        repo_data = await get_repository_details_from_github(
            int(installation.installation_id), full_name
        )

        logger.info(f"Successfully fetched repository details: {full_name}")

        # Create repository record
        repository = RepositoryCreate(
            github_id=str(repo_data["id"]),
            name=repo_data["name"],
            full_name=repo_data["full_name"],
            description=repo_data.get("description"),
            html_url=repo_data["html_url"],
            clone_url=repo_data.get("clone_url"),
            ssh_url=repo_data.get("ssh_url"),
            language=repo_data.get("language"),
            default_branch=repo_data.get("default_branch", "main"),
            is_private=repo_data.get("private", False),
            is_fork=repo_data.get("fork", False),
            user_id=user_id,
        )

        # Create the repository
        created_repo = await create_repository(db, repository)

        logger.info(f"Successfully imported repository {full_name} for user {user_id}")
        return created_repo

    except Exception as e:
        logger.error(f"Error importing repository {full_name}: {str(e)}")
        raise
