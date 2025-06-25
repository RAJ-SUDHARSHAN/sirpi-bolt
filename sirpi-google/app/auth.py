"""Authentication utilities for JWT token validation and user extraction."""

import logging
from typing import Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def get_current_user_id_from_token(credentials: HTTPAuthorizationCredentials) -> str:
    """Extract user ID from JWT token without full validation (for development)."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    token = credentials.credentials

    # For development, we'll extract the sub claim without full validation
    # In production, you'd want to validate the token signature
    try:
        import jwt

        # Decode without verification for development
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401, detail="Invalid token: missing user ID"
            )

        return user_id
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


def get_clerk_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """Get Clerk user ID from JWT token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    return get_current_user_id_from_token(credentials)


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """Get current user's Clerk ID from JWT token (for compatibility with existing routers)."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    return get_current_user_id_from_token(credentials)


def create_get_current_user_id(get_db):
    """Factory function to create get_current_user_id dependency with database access."""

    def get_current_user_id_with_db(
        clerk_user_id: str = Depends(get_clerk_user_id),
        db: Session = Depends(get_db),
    ) -> str:
        """Get current user's database UUID from JWT token."""
        from app.models.user import User

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

        if not user:
            # Auto-create user if they don't exist
            user = User(
                clerk_user_id=clerk_user_id,
                email=f"{clerk_user_id}@unknown.com",
                first_name=None,
                last_name=None,
                username=None,
                profile_image_url=None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Auto-created user for Clerk ID: {clerk_user_id}")

        return str(user.id)  # Return database UUID as string

    return get_current_user_id_with_db


def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[str]:
    """Optional authentication dependency that returns user ID if authenticated, None otherwise."""
    if not credentials:
        return None

    try:
        return get_current_user_id_from_token(credentials)
    except HTTPException:
        return None
