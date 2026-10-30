from sqlalchemy import String, Boolean, Enum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import enum
from typing import Optional, List
from app.db.base import Base, TimestampMixin


class SessionStatus(str, enum.Enum):
    CREATED = "CREATED"
    SEARCHING = "SEARCHING"
    MATCHED = "MATCHED"
    ACCEPTED = "ACCEPTED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAID = "PAID"
    RATED = "RATED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class SessionMode(str, enum.Enum):
    VOICE = "VOICE"
    CHAT = "CHAT"
    MEET = "MEET"
    REMOTE = "REMOTE"


class AssistanceSession(Base, TimestampMixin):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    traveller_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    traveller_name: Mapped[str] = mapped_column(String(255), nullable=False)
    guide_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    guide_name: Mapped[str] = mapped_column(String(255), nullable=False)
    route_corridor: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.ACTIVE, index=True)
    mode: Mapped[SessionMode] = mapped_column(Enum(SessionMode), default=SessionMode.VOICE)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_muted: Mapped[bool] = mapped_column(Boolean, default=False)

    messages = relationship("SessionMessage", back_populates="session", cascade="all, delete-orphan", order_by="SessionMessage.created_at", lazy="selectin")
