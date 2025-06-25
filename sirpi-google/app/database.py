import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# SQLAlchemy setup for PostgreSQL connection with transaction pooler
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=20,  # Good for transaction pooler
    max_overflow=0,  # No overflow for pooled connections
    echo=False,  # Disable SQL logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables defined in models."""
    # Import all models here so they're registered with Base
    from app.models.user import User  # noqa
    from app.models.project import Project  # noqa
    from app.models.repository import Repository  # noqa
    from app.models.agent_session import AgentSession  # noqa
    from app.models.agent_event import AgentEvent  # noqa
    from app.models.generated_file import GeneratedFile  # noqa
    from app.models.cloud_resource import CloudResource  # noqa
    from app.models.deployment_template import DeploymentTemplate  # noqa

    Base.metadata.create_all(bind=engine)
