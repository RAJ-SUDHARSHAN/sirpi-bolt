import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Integer,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Vertex AI Agent Engine Integration
    vertex_session_id = Column(String, unique=True, nullable=False, index=True)
    session_name = Column(String, nullable=False)
    session_state = Column(JSON, nullable=True)  # Current conversation state
    memory_data = Column(JSON, nullable=True)  # Cross-session memory

    # Multi-Agent Orchestration
    active_agents = Column(JSON, nullable=True)  # List of currently active agents
    agent_hierarchy = Column(JSON, nullable=True)  # Agent coordination structure
    current_phase = Column(
        String, nullable=True
    )  # 'analyzing', 'planning', 'generating', 'deploying'

    # Session workflow tracking
    workflow_steps = Column(JSON, nullable=True)  # Completed and pending steps
    current_step = Column(String, nullable=True)  # Current workflow step
    step_progress = Column(Integer, default=0)  # Progress percentage (0-100)

    # Agent coordination
    lead_agent = Column(String, nullable=True)  # Primary agent for this session
    agent_handoffs = Column(JSON, nullable=True)  # History of agent handoffs
    coordination_rules = Column(JSON, nullable=True)  # Rules for agent coordination

    # Session metadata
    session_type = Column(
        String, default="deployment"
    )  # 'deployment', 'analysis', 'troubleshooting'
    priority = Column(String, default="normal")  # 'low', 'normal', 'high', 'urgent'

    # Session management
    is_active = Column(Boolean, default=True)
    is_paused = Column(Boolean, default=False)
    pause_reason = Column(Text, nullable=True)

    # Performance tracking
    total_tokens_used = Column(Integer, default=0)
    total_cost_usd = Column(String, default="0.00")  # Store as string for precision
    average_response_time_ms = Column(Integer, nullable=True)

    # Timestamps
    last_interaction_at = Column(DateTime(timezone=True), server_default=func.now())
    session_started_at = Column(DateTime(timezone=True), server_default=func.now())
    session_ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="agent_sessions")
    project = relationship("Project", back_populates="agent_sessions")
    agent_events = relationship(
        "AgentEvent", back_populates="session", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<AgentSession(id={self.id}, vertex_session_id={self.vertex_session_id}, current_phase={self.current_phase})>"
