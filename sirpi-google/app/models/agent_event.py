import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Integer,
    Numeric,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class AgentEvent(Base):
    __tablename__ = "agent_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("agent_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Event Details
    event_type = Column(
        String, nullable=False, index=True
    )  # 'message', 'function_call', 'tool_use', 'state_change', 'handoff'
    agent_name = Column(
        String, nullable=False, index=True
    )  # Which agent generated this event
    event_data = Column(JSON, nullable=False)  # Full event payload

    # Message/Interaction Details
    user_message = Column(Text, nullable=True)  # User input that triggered this event
    agent_response = Column(Text, nullable=True)  # Agent's response
    system_message = Column(Text, nullable=True)  # System-generated message

    # Function/Tool Usage
    function_calls = Column(JSON, nullable=True)  # Tool/function calls made
    tool_results = Column(JSON, nullable=True)  # Results from tool executions
    tool_errors = Column(JSON, nullable=True)  # Any errors from tool usage

    # Agent Coordination
    source_agent = Column(String, nullable=True)  # Agent that initiated this event
    target_agent = Column(String, nullable=True)  # Agent that should handle this event
    handoff_reason = Column(Text, nullable=True)  # Why agent handed off to another
    coordination_context = Column(JSON, nullable=True)  # Context for agent coordination

    # Event Status and Results
    event_status = Column(
        String, default="completed"
    )  # 'pending', 'processing', 'completed', 'failed'
    success = Column(String, nullable=True)  # 'true', 'false', 'partial'
    error_message = Column(Text, nullable=True)  # Error details if failed
    retry_count = Column(Integer, default=0)  # Number of retries attempted

    # Performance Metrics
    processing_time_ms = Column(Integer, nullable=True)  # Time taken to process
    tokens_used = Column(Integer, nullable=True)  # Tokens consumed for this event
    cost_usd = Column(Numeric(10, 6), nullable=True)  # Cost for this specific event
    model_used = Column(String, nullable=True)  # Which model was used

    # Context and State
    conversation_context = Column(
        JSON, nullable=True
    )  # Conversation context at time of event
    agent_state_before = Column(JSON, nullable=True)  # Agent state before event
    agent_state_after = Column(JSON, nullable=True)  # Agent state after event

    # Metadata
    event_sequence = Column(Integer, nullable=True)  # Order of events in session
    parent_event_id = Column(
        UUID(as_uuid=True), ForeignKey("agent_events.id"), nullable=True
    )  # Parent event if this is a sub-event

    # Timestamps
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("AgentSession", back_populates="agent_events")
    project = relationship("Project")
    parent_event = relationship("AgentEvent", remote_side=[id])
    child_events = relationship("AgentEvent", remote_side=[parent_event_id])

    def __repr__(self):
        return f"<AgentEvent(id={self.id}, event_type={self.event_type}, agent_name={self.agent_name})>"
