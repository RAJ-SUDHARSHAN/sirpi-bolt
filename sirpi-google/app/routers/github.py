"""GitHub App integration router for repository management."""

import json
import jwt
import time
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import uuid

from fastapi import APIRouter, Request, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

from app.config import settings
from app.database import get_db
from app.auth import get_current_user_id_from_token, optional_auth
from app.models.github_installation import GitHubInstallation
from app.models.user import User
from app.services.github_service import (
    create_installation,
    get_installation_by_user_id,
    get_installation_by_installation_id,
    get_user_by_clerk_id,
)
from app.schemas.github import (
    GitHubInstallationCreate,
    GitHubInstallationRead,
    GitHubConnectionStatus,
    GitHubRepository,
)
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/github", tags=["github"])


@router.get("/install")
async def github_install():
    """Redirect user to GitHub App installation page."""
    # Use the configured GitHub App name
    github_app_url = (
        f"https://github.com/apps/{settings.GITHUB_APP_NAME}/installations/new"
    )
    return RedirectResponse(url=github_app_url)


logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def get_current_user_database_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> str:
    """Get current user's database UUID from JWT token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Get Clerk user ID from token
    clerk_user_id = get_current_user_id_from_token(credentials)

    # Look up user in database
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

    if not user:
        # Auto-create user if they don't exist
        import jwt

        token = credentials.credentials
        payload = jwt.decode(token, options={"verify_signature": False})

        user = User(
            clerk_user_id=clerk_user_id,
            email=payload.get("email", f"{clerk_user_id}@unknown.com"),
            first_name=payload.get("given_name"),
            last_name=payload.get("family_name"),
            username=payload.get("username"),
            profile_image_url=payload.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Auto-created user for Clerk ID: {clerk_user_id}")

    return str(user.id)


async def get_github_app_token() -> str:
    """Generate GitHub App JWT token for authentication."""
    now = int(time.time())
    payload = {
        "iat": now,
        "exp": now + 600,  # 10 minutes
        "iss": settings.GITHUB_APP_ID,
    }

    # Decode the private key
    private_key = settings.GITHUB_APP_PRIVATE_KEY.replace("\\n", "\n")

    token = jwt.encode(payload, private_key, algorithm="RS256")
    return token


async def get_installation_access_token(installation_id: int) -> str:
    """Get installation access token for GitHub API calls."""
    app_token = await get_github_app_token()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.github.com/app/installations/{installation_id}/access_tokens",
            headers={
                "Accept": "application/vnd.github.v3+json",
                "Authorization": f"Bearer {app_token}",
            },
        )

        if response.status_code != 201:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to get installation token: {response.text}",
            )

        token_data = response.json()
        return token_data["token"]


@router.get("/callback")
async def github_callback(
    installation_id: Optional[int] = Query(None),
    setup_action: Optional[str] = Query(None),
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),  # Can contain user info
    db: Session = Depends(get_db),
):
    """Handle GitHub App installation callback."""
    logger.info(
        f"GitHub callback: installation_id={installation_id}, setup_action={setup_action}, state={state}"
    )

    if not installation_id:
        logger.error("GitHub callback missing installation_id")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/projects/import?error=github_auth_failed&detail=missing_installation_id"
        )

    try:
        # Get installation details from GitHub API
        app_token = await get_github_app_token()

        async with httpx.AsyncClient() as client:
            # Get installation info
            install_response = await client.get(
                f"https://api.github.com/app/installations/{installation_id}",
                headers={
                    "Accept": "application/vnd.github.v3+json",
                    "Authorization": f"Bearer {app_token}",
                },
            )

            if install_response.status_code != 200:
                logger.error(
                    f"Failed to get installation info: {install_response.text}"
                )
                raise HTTPException(
                    status_code=400, detail="Failed to get installation info"
                )

            installation_data = install_response.json()
            account = installation_data["account"]

            logger.info(
                f"GitHub installation data: account={account['login']}, type={account['type']}"
            )

            # For now, redirect with success - the frontend will handle associating with user session
            # When the user is logged in and visits the frontend, they can associate this installation
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/projects/import?github_connected=true&installation_id={installation_id}&account={account['login']}"
            )

    except Exception as e:
        logger.error(f"GitHub callback error: {str(e)}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/projects/import?error=github_auth_failed&detail={str(e)}"
        )


@router.post("/webhooks")
async def github_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle GitHub App webhooks."""
    return await github_webhook_handler(request, db)


# Also handle webhooks at the root level (in case GitHub is configured differently)
@router.post("/webhook")
async def github_webhook_single(request: Request, db: Session = Depends(get_db)):
    """Handle GitHub App webhook (alternative endpoint)."""
    return await github_webhook_handler(request, db)


async def github_webhook_handler(request: Request, db: Session = Depends(get_db)):
    """Handle GitHub App webhooks."""
    # Verify webhook signature
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    body = await request.body()

    # Verify the signature
    import hmac
    import hashlib

    expected_signature = (
        "sha256="
        + hmac.new(
            settings.GITHUB_WEBHOOK_SECRET.encode(), body, hashlib.sha256
        ).hexdigest()
    )

    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Parse webhook payload
    payload = json.loads(body.decode())
    event_type = request.headers.get("X-GitHub-Event")

    if event_type == "installation":
        action = payload.get("action")
        installation_id = payload["installation"]["id"]
        account = payload["installation"]["account"]

        if action == "created":
            # New installation - store in database
            print(
                f"New GitHub App installation: {installation_id} for {account['login']}"
            )

        elif action == "deleted":
            # Installation removed - clean up database
            print(f"GitHub App installation removed: {installation_id}")

    elif event_type == "installation_repositories":
        # Repositories added/removed from installation
        action = payload.get("action")
        installation_id = payload["installation"]["id"]

        if action == "added":
            repositories = payload.get("repositories_added", [])
            print(
                f"Repositories added to installation {installation_id}: {len(repositories)}"
            )

        elif action == "removed":
            repositories = payload.get("repositories_removed", [])
            print(
                f"Repositories removed from installation {installation_id}: {len(repositories)}"
            )

    return {"status": "ok"}


@router.post("/connect")
async def connect_github_installation(
    installation_data: dict,
    user_id: str = Depends(get_current_user_database_id),
    db: Session = Depends(get_db),
):
    """Connect a GitHub App installation to the current user."""
    try:
        installation_id = installation_data.get("installation_id")
        if not installation_id:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Missing installation_id"},
            )

        logger.info(
            f"Connecting installation {installation_id} to user {user_id} (type: {type(user_id)})"
        )

        # Get installation details from GitHub API
        logger.info("Getting GitHub App token...")
        app_token = await get_github_app_token()
        logger.info("Got GitHub App token successfully")

        async with httpx.AsyncClient() as client:
            install_response = await client.get(
                f"https://api.github.com/app/installations/{installation_id}",
                headers={
                    "Accept": "application/vnd.github.v3+json",
                    "Authorization": f"Bearer {app_token}",
                },
            )

            if install_response.status_code != 200:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": "Failed to verify installation",
                    },
                )

            installation_data = install_response.json()
            account = installation_data["account"]

            logger.info(
                f"Creating installation record with user_id: {user_id} (type: {type(user_id)})"
            )

            # Create installation record
            installation_create = GitHubInstallationCreate(
                installation_id=str(installation_id),
                user_id=user_id,
                account_name=account["login"],
                account_type=account["type"],
                account_avatar_url=account.get("avatar_url"),
            )

            logger.info("Calling create_installation service...")
            installation = await create_installation(db, installation_create)

            logger.info(
                f"Connected GitHub installation {installation_id} to user {user_id}"
            )

            return JSONResponse(
                content={
                    "success": True,
                    "data": {
                        "installation_id": installation.installation_id,
                        "account_name": installation.account_name,
                        "account_type": installation.account_type,
                    },
                }
            )

    except Exception as e:
        logger.error(f"Error connecting GitHub installation: {str(e)}")
        logger.error(f"Exception type: {type(e)}")
        import traceback

        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Failed to connect installation"},
        )


@router.get("/status")
async def github_status(
    user_id: str = Depends(get_current_user_database_id),
    db: Session = Depends(get_db),
):
    """Get GitHub connection status for the current user."""
    try:
        # Convert string UUID to UUID object
        user_uuid = uuid.UUID(user_id)
        installation = get_installation_by_user_id(db, user_uuid)

        if not installation:
            return JSONResponse(
                content={
                    "success": True,
                    "data": {
                        "connected": False,
                        "installation_id": None,
                        "account_name": None,
                        "account_type": None,
                        "repositories_count": 0,
                    },
                }
            )

        # Get repository count
        try:
            access_token = await get_installation_access_token(
                int(installation.installation_id)
            )
            async with httpx.AsyncClient() as client:
                repos_response = await client.get(
                    "https://api.github.com/installation/repositories",
                    headers={
                        "Accept": "application/vnd.github.v3+json",
                        "Authorization": f"token {access_token}",
                    },
                )
                repos_count = 0
                if repos_response.status_code == 200:
                    repos_data = repos_response.json()
                    repos_count = repos_data.get("total_count", 0)
        except Exception:
            repos_count = 0

        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "connected": True,
                    "installation_id": installation.installation_id,
                    "account_name": installation.account_name,
                    "account_type": installation.account_type,
                    "repositories_count": repos_count,
                },
            }
        )

    except Exception as e:
        logger.error(f"Error getting GitHub status: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Failed to get GitHub status"},
        )


@router.get("/installation")
async def github_installation_info(
    user_id: str = Depends(get_current_user_database_id),
    db: Session = Depends(get_db),
):
    """Get GitHub App installation info for the current user."""
    try:
        # Convert string UUID to UUID object
        user_uuid = uuid.UUID(user_id)
        installation = get_installation_by_user_id(db, user_uuid)

        if not installation:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "No GitHub installation found"},
            )

        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "id": str(installation.id),
                    "installation_id": installation.installation_id,
                    "account_name": installation.account_name,
                    "account_type": installation.account_type,
                    "account_avatar_url": installation.account_avatar_url,
                    "is_active": installation.is_active,
                    "created_at": installation.created_at.isoformat(),
                    "updated_at": installation.updated_at.isoformat(),
                },
            }
        )

    except Exception as e:
        logger.error(f"Error getting installation info: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Failed to get installation info"},
        )


@router.get("/repositories")
async def list_user_repositories(
    user_id: str = Depends(get_current_user_database_id),
    db: Session = Depends(get_db),
):
    """List repositories accessible to the current user."""
    try:
        # Convert string UUID to UUID object
        user_uuid = uuid.UUID(user_id)
        installation = get_installation_by_user_id(db, user_uuid)

        if not installation:
            return JSONResponse(
                content={
                    "success": True,
                    "data": {"repositories": [], "total_count": 0},
                }
            )

        # Get repositories from GitHub API
        access_token = await get_installation_access_token(
            int(installation.installation_id)
        )

        async with httpx.AsyncClient() as client:
            repos_response = await client.get(
                "https://api.github.com/installation/repositories",
                headers={
                    "Accept": "application/vnd.github.v3+json",
                    "Authorization": f"token {access_token}",
                },
            )

            if repos_response.status_code != 200:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "error": "Failed to fetch repositories"},
                )

            repos_data = repos_response.json()
            return JSONResponse(
                content={
                    "success": True,
                    "data": {
                        "repositories": repos_data["repositories"],
                        "total_count": repos_data["total_count"],
                    },
                }
            )

    except Exception as e:
        logger.error(f"Error listing repositories: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Failed to list repositories"},
        )


# ============================================================================
# REPOSITORY MANAGEMENT ENDPOINTS
# ============================================================================


@router.post("/repos/import")
async def import_repository(
    import_data: dict,
    user_id: str = Depends(get_current_user_database_id),
    db: Session = Depends(get_db),
):
    """Import a GitHub repository for the authenticated user."""
    try:
        from app.services.repository_service import import_github_repository
        from app.schemas.repository import GitHubRepositoryImport

        # Validate import data
        if not import_data.get("full_name"):
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Missing full_name field"},
            )

        full_name = import_data["full_name"]
        logger.info(f"Importing repository {full_name} for user {user_id}")

        # Convert string UUID to UUID object
        user_uuid = uuid.UUID(user_id)
        repository = await import_github_repository(db, user_uuid, full_name)

        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "id": str(repository.id),
                    "github_id": repository.github_id,
                    "name": repository.name,
                    "full_name": repository.full_name,
                    "description": repository.description,
                    "html_url": repository.html_url,
                    "language": repository.language,
                    "default_branch": repository.default_branch,
                    "is_private": repository.is_private,
                    "is_fork": repository.is_fork,
                    "created_at": repository.created_at.isoformat(),
                },
            }
        )

    except Exception as e:
        logger.error(
            f"Error importing repository {import_data.get('full_name')}: {str(e)}"
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Failed to import repository: {str(e)}",
            },
        )


@router.get("/repos/imported")
async def get_imported_repositories(
    user_id: str = Depends(get_current_user_database_id),
    db: Session = Depends(get_db),
):
    """Get all imported repositories for the authenticated user."""
    try:
        from app.services.repository_service import get_repositories_by_user_id

        # Convert string UUID to UUID object
        user_uuid = uuid.UUID(user_id)
        repositories = get_repositories_by_user_id(db, str(user_uuid))

        repo_data = []
        for repo in repositories:
            repo_data.append(
                {
                    "id": str(repo.id),
                    "github_id": repo.github_id,
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "html_url": repo.html_url,
                    "language": repo.language,
                    "default_branch": repo.default_branch,
                    "is_private": repo.is_private,
                    "is_fork": repo.is_fork,
                    "framework_detected": repo.framework_detected,
                    "package_manager": repo.package_manager,
                    "is_connected": repo.is_connected,
                    "created_at": repo.created_at.isoformat(),
                    "updated_at": repo.updated_at.isoformat(),
                }
            )

        return JSONResponse(
            content={
                "success": True,
                "data": {"repositories": repo_data, "total_count": len(repo_data)},
            }
        )

    except Exception as e:
        logger.error(f"Error fetching imported repositories: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Failed to fetch repositories"},
        )
