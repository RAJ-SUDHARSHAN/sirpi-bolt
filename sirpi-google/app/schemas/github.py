"""GitHub-related Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GitHubInstallationBase(BaseModel):
    """Base schema for GitHub installation."""

    installation_id: str
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    account_avatar_url: Optional[str] = None


class GitHubInstallationCreate(GitHubInstallationBase):
    """Schema for creating a GitHub installation."""

    user_id: uuid.UUID


class GitHubInstallationUpdate(BaseModel):
    """Schema for updating a GitHub installation."""

    account_name: Optional[str] = None
    account_type: Optional[str] = None
    account_avatar_url: Optional[str] = None
    is_active: Optional[bool] = None


class GitHubInstallationRead(GitHubInstallationBase):
    """Schema for reading a GitHub installation."""

    id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GitHubRepository(BaseModel):
    """Schema for GitHub repository data."""

    id: int
    name: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    private: bool
    default_branch: str
    language: Optional[str] = None
    fork: bool
    created_at: str
    updated_at: str
    pushed_at: Optional[str] = None
    size: int
    stargazers_count: int
    watchers_count: int
    forks_count: int
    open_issues_count: int


class GitHubRepositoryImport(BaseModel):
    """Schema for importing a GitHub repository."""

    full_name: str  # owner/repo format
    description: Optional[str] = None


class GitHubConnectionStatus(BaseModel):
    """Schema for GitHub connection status."""

    connected: bool
    installation_id: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    repositories_count: Optional[int] = None
