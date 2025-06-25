"""
Slug Utilities

Utilities for generating URL-safe slugs for projects and other entities.
"""

import re
import uuid
from typing import Type
from sqlalchemy.orm import Session


def slugify(text: str) -> str:
    """
    Convert a string to a URL-safe slug.

    Args:
        text: The text to convert to a slug

    Returns:
        URL-safe slug string
    """
    if not text:
        return ""

    # Convert to lowercase
    text = text.lower()

    # Replace spaces and underscores with hyphens
    text = re.sub(r"[\s_]+", "-", text)

    # Remove non-alphanumeric characters except hyphens
    text = re.sub(r"[^a-z0-9\-]", "", text)

    # Remove multiple consecutive hyphens
    text = re.sub(r"-+", "-", text)

    # Remove leading and trailing hyphens
    text = text.strip("-")

    # Ensure the slug is not empty
    if not text:
        text = "project"

    return text


def generate_unique_slug(
    db: Session, model: Type, base_slug: str, user_id: str, max_length: int = 50
) -> str:
    """
    Generate a unique slug for a model within a user's scope.

    Args:
        db: Database session
        model: SQLAlchemy model class
        base_slug: Base slug to make unique
        user_id: User ID for scoping
        max_length: Maximum length of the slug

    Returns:
        Unique slug string
    """
    # Truncate base slug if too long
    if len(base_slug) > max_length - 10:  # Leave room for suffix
        base_slug = base_slug[: max_length - 10]

    slug = base_slug
    counter = 1

    while True:
        # Check if slug already exists for this user
        existing = (
            db.query(model).filter(model.slug == slug, model.user_id == user_id).first()
        )

        if not existing:
            return slug

        # Generate next variant
        suffix = f"-{counter}"
        max_base_length = max_length - len(suffix)

        if len(base_slug) > max_base_length:
            truncated_base = base_slug[:max_base_length]
        else:
            truncated_base = base_slug

        slug = f"{truncated_base}{suffix}"
        counter += 1

        # Safety check to prevent infinite loops
        if counter > 1000:
            # Fall back to UUID-based slug
            return f"{base_slug[:20]}-{str(uuid.uuid4())[:8]}"
