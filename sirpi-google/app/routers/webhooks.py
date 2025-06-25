"""Webhook handlers for external services."""

import logging
import json
from fastapi import APIRouter, Request, Response, status, Depends, Header
from sqlalchemy.orm import Session
from svix.webhooks import Webhook, WebhookVerificationError
import hmac
import hashlib

from app.database import get_db
from app.config import settings
from app.models.user import User

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def extract_user_data(webhook_data: dict) -> dict | None:
    """Extract user data from Clerk webhook payload."""
    if not webhook_data.get("data") or not webhook_data["data"].get("id"):
        logger.error("No user data found in webhook payload")
        return None

    user_data = webhook_data["data"]

    # Extract email
    email_addresses = user_data.get("email_addresses", [])
    primary_email = next(
        (
            email
            for email in email_addresses
            if email.get("id") == user_data.get("primary_email_address_id")
        ),
        None,
    )
    if not primary_email or not primary_email.get("email_address"):
        logger.error("No primary email found for user")
        return None

    # Extract GitHub social account information from external_accounts
    external_accounts = user_data.get("external_accounts", [])
    github_account = None
    github_username = None
    github_id = None
    github_avatar_url = None

    for account in external_accounts:
        if account.get("provider") == "oauth_github":
            github_account = account
            github_username = account.get("username")
            github_id = account.get("provider_user_id")
            github_avatar_url = account.get("avatar_url")
            break

    # Store all social accounts for future reference
    social_accounts = {"github": github_account} if github_account else None

    # Generate full_name from first_name and last_name
    full_name = None
    if user_data.get("first_name") or user_data.get("last_name"):
        parts = []
        if user_data.get("first_name"):
            parts.append(user_data["first_name"])
        if user_data.get("last_name"):
            parts.append(user_data["last_name"])
        full_name = " ".join(parts)

    logger.info(
        f"Extracted user data for ID: {user_data['id']}, Email: {primary_email['email_address']}, GitHub: {github_username}, Full Name: {full_name}"
    )

    return {
        "id": user_data["id"],
        "email": primary_email["email_address"],
        "full_name": full_name,
        "first_name": user_data.get("first_name"),
        "last_name": user_data.get("last_name"),
        "profile_image_url": user_data.get("profile_image_url"),
        "github_username": github_username,
        "github_id": github_id,
        "github_avatar_url": github_avatar_url,
        "social_accounts": social_accounts,
    }


@router.post("/clerk", status_code=status.HTTP_204_NO_CONTENT)
async def handle_clerk_webhook(
    request: Request, response: Response, db: Session = Depends(get_db)
):
    """Handle Clerk webhooks for user management."""
    logger.info("Received Clerk webhook request")
    payload = await request.body()
    headers = request.headers
    secret = settings.CLERK_WEBHOOK_SIGNING_SECRET

    try:
        wh = Webhook(secret)
        webhook_data = wh.verify(payload, headers)
        event_type = webhook_data.get("type")
        logger.info(f"Processing Clerk webhook event: {event_type}")

        if event_type == "user.created":
            user_data = extract_user_data(webhook_data)
            if user_data:
                logger.info(f"Creating user with ID: {user_data['id']}")

                # Check if user already exists
                existing_user = (
                    db.query(User).filter(User.clerk_user_id == user_data["id"]).first()
                )
                if existing_user:
                    logger.info(f"User with Clerk ID {user_data['id']} already exists")
                else:
                    # Create new user
                    new_user = User(
                        clerk_user_id=user_data["id"],
                        email=user_data["email"],
                        full_name=user_data["full_name"],
                        first_name=user_data["first_name"],
                        last_name=user_data["last_name"],
                        profile_image_url=user_data["profile_image_url"],
                        github_username=user_data["github_username"],
                        github_avatar_url=user_data["github_avatar_url"],
                        # Set default GCP settings
                        gcp_project_id=None,
                        gcp_service_account_key=None,
                        gcp_default_region="us-central1",
                    )

                    db.add(new_user)
                    db.commit()
                    db.refresh(new_user)

                    logger.info(
                        f"Created user with ID: {new_user.id} for Clerk ID: {user_data['id']}"
                    )
            else:
                logger.warning("Failed to extract user data for user.created event")

        elif event_type == "user.updated":
            user_data = extract_user_data(webhook_data)
            if user_data:
                logger.info(f"Updating user with ID: {user_data['id']}")
                existing_user = (
                    db.query(User).filter(User.clerk_user_id == user_data["id"]).first()
                )
                if existing_user:
                    # Update user data
                    existing_user.email = user_data["email"]
                    existing_user.full_name = user_data["full_name"]
                    existing_user.first_name = user_data["first_name"]
                    existing_user.last_name = user_data["last_name"]
                    existing_user.profile_image_url = user_data["profile_image_url"]
                    existing_user.github_username = user_data["github_username"]
                    existing_user.github_avatar_url = user_data["github_avatar_url"]

                    db.commit()
                    logger.info(f"Updated user with Clerk ID: {user_data['id']}")
                else:
                    logger.warning(
                        f"User with Clerk ID {user_data['id']} not found for update"
                    )
            else:
                logger.warning("Failed to extract user data for user.updated event")

        elif event_type == "user.deleted":
            user_id = webhook_data.get("data", {}).get("id")
            if user_id:
                logger.info(f"Deleting user with ID: {user_id}")
                existing_user = (
                    db.query(User).filter(User.clerk_user_id == user_id).first()
                )
                if existing_user:
                    # Soft delete or mark as inactive
                    existing_user.is_active = False
                    db.commit()
                    logger.info(f"Deactivated user with Clerk ID: {user_id}")
                else:
                    logger.warning(
                        f"User with Clerk ID {user_id} not found for deletion"
                    )
            else:
                logger.warning("No user ID found for user.deleted event")
        else:
            logger.info(f"No action taken for event type: {event_type}")

    except WebhookVerificationError as e:
        logger.error(f"Webhook signature verification failed: {str(e)}")
        response.status_code = status.HTTP_400_BAD_REQUEST
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


@router.post("/github", status_code=status.HTTP_204_NO_CONTENT)
async def handle_github_webhook(
    request: Request,
    response: Response,
    x_github_event: str = Header(None),
    x_github_delivery: str = Header(None),
    x_hub_signature_256: str = Header(None),
    db: Session = Depends(get_db),
):
    """Handle GitHub webhooks for installation events."""
    logger.info(
        f"Received GitHub webhook request: Event={x_github_event}, Delivery={x_github_delivery}"
    )

    if not all([x_github_event, x_github_delivery, x_hub_signature_256]):
        logger.error("Missing required GitHub webhook headers")
        response.status_code = status.HTTP_400_BAD_REQUEST
        return

    payload_bytes = await request.body()
    try:
        signature = x_hub_signature_256.split("=")[1]
        expected_signature = hmac.new(
            settings.GITHUB_WEBHOOK_SECRET.encode(), payload_bytes, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            logger.error("GitHub webhook signature verification failed")
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return

        webhook_data = json.loads(payload_bytes)
        logger.info(f"Processing GitHub webhook event: {x_github_event}")

        if x_github_event == "installation":
            action = webhook_data.get("action")
            installation_payload = webhook_data.get("installation", {})
            installation_id = str(installation_payload.get("id"))

            if action == "created":
                logger.info(
                    f"GitHub App installation '{action}' event for installation_id: {installation_id}"
                )
                # Installation creation is handled in the callback endpoint
                # This webhook just confirms the installation

            elif action == "deleted":
                logger.info(
                    f"GitHub App installation '{action}' event for installation_id: {installation_id}"
                )
                # Handle installation deletion - mark as inactive in database
                # TODO: Implement installation deletion logic when we have the installation model

            elif action in ["suspend", "unsuspend"]:
                logger.info(
                    f"GitHub App installation '{action}' event for installation_id: {installation_id}"
                )
                # Handle suspension/unsuspension
                # TODO: Implement suspension handling when we have the installation model

            else:
                logger.info(
                    f"Unhandled GitHub installation action: {action} for installation_id: {installation_id}"
                )

        response.status_code = status.HTTP_204_NO_CONTENT

    except json.JSONDecodeError as e:
        logger.error(
            f"GitHub webhook payload JSON decoding error: {str(e)}", exc_info=True
        )
        response.status_code = status.HTTP_400_BAD_REQUEST
        return
    except Exception as e:
        logger.error(f"GitHub webhook processing error: {str(e)}", exc_info=True)
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return
