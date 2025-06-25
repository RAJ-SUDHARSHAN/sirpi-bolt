"""GitHub service functions for managing installations and repositories."""

import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.github_installation import GitHubInstallation
from app.models.user import User
from app.schemas.github import GitHubInstallationCreate, GitHubInstallationUpdate


async def create_installation(
    db: Session, installation_data: GitHubInstallationCreate
) -> GitHubInstallation:
    """
    Create a new GitHub installation record.
    Handles duplicates gracefully by checking for existing installations.
    """
    # Check if installation already exists
    existing_installation = get_installation_by_installation_id(
        db, installation_data.installation_id
    )
    if existing_installation:
        # If it exists and belongs to the same user, return it
        if existing_installation.user_id == installation_data.user_id:
            return existing_installation
        else:
            raise ValueError(
                f"Installation {installation_data.installation_id} already exists for different user"
            )

    # Check if user already has an active installation
    existing_user_installation = get_installation_by_user_id(
        db, installation_data.user_id
    )
    if existing_user_installation:
        # Deactivate the old installation
        existing_user_installation.is_active = False
        db.commit()

    try:
        # installation_data.user_id is already a UUID object from Pydantic
        db_installation = GitHubInstallation(
            installation_id=installation_data.installation_id,
            user_id=installation_data.user_id,
            account_name=installation_data.account_name,
            account_type=installation_data.account_type,
            account_avatar_url=installation_data.account_avatar_url,
            is_active=True,
        )
        db.add(db_installation)
        db.commit()
        db.refresh(db_installation)
        return db_installation
    except IntegrityError as e:
        db.rollback()
        # Try to get existing installation again in case of race condition
        existing_installation = get_installation_by_installation_id(
            db, installation_data.installation_id
        )
        if (
            existing_installation
            and str(existing_installation.user_id) == installation_data.user_id
        ):
            return existing_installation
        else:
            raise e


def get_installation_by_user_id(
    db: Session, user_id: uuid.UUID
) -> Optional[GitHubInstallation]:
    """Get a GitHub installation by user ID."""
    return (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.user_id == user_id,
            GitHubInstallation.is_active == True,
        )
        .first()
    )


def get_installation_by_installation_id(
    db: Session, installation_id: str
) -> Optional[GitHubInstallation]:
    """Get a GitHub installation by installation ID."""
    return (
        db.query(GitHubInstallation)
        .filter(
            GitHubInstallation.installation_id == installation_id,
            GitHubInstallation.is_active == True,
        )
        .first()
    )


def update_installation(
    db: Session, installation_id: str, installation_data: GitHubInstallationUpdate
) -> Optional[GitHubInstallation]:
    """Update a GitHub installation."""
    db_installation = (
        db.query(GitHubInstallation)
        .filter(GitHubInstallation.id == installation_id)
        .first()
    )
    if not db_installation:
        return None

    # Update fields if provided
    update_data = installation_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_installation, key, value)

    db.commit()
    db.refresh(db_installation)
    return db_installation


def delete_installation(db: Session, installation_id: str) -> bool:
    """Delete a GitHub installation (set is_active to False)."""
    db_installation = (
        db.query(GitHubInstallation)
        .filter(GitHubInstallation.id == installation_id)
        .first()
    )
    if not db_installation:
        return False

    db_installation.is_active = False
    db.commit()
    return True


def get_user_by_clerk_id(db: Session, clerk_user_id: str) -> Optional[User]:
    """Get a user by their Clerk user ID."""
    return db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
