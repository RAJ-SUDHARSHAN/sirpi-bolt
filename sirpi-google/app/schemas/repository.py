"""Repository-related Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RepositoryBase(BaseModel):
    """Base schema for repository."""

    github_id: str
    name: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    clone_url: Optional[str] = None
    ssh_url: Optional[str] = None
    language: Optional[str] = None
    default_branch: str = "main"
    is_private: bool = False
    is_fork: bool = False


class RepositoryCreate(RepositoryBase):
    """Schema for creating a repository."""

    user_id: uuid.UUID


class RepositoryUpdate(BaseModel):
    """Schema for updating a repository."""

    name: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    default_branch: Optional[str] = None
    is_connected: Optional[bool] = None
    framework_detected: Optional[str] = None
    package_manager: Optional[str] = None
    build_tool: Optional[str] = None
    analysis_results: Optional[str] = None


class RepositoryRead(RepositoryBase):
    """Schema for reading a repository."""

    id: uuid.UUID
    user_id: uuid.UUID
    framework_detected: Optional[str] = None
    package_manager: Optional[str] = None
    build_tool: Optional[str] = None
    last_analyzed_at: Optional[datetime] = None
    analysis_results: Optional[str] = None
    is_connected: bool = True
    connection_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GitHubRepositoryImport(BaseModel):
    """Schema for importing a GitHub repository."""

    full_name: str  # Format: "owner/repo"
    description: Optional[str] = None
