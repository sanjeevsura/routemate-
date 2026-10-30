from sqlalchemy import String, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.db.base import Base, TimestampMixin


class SessionMessage(Base, TimestampMixin):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sender_role: Mapped[str] = mapped_column(String(32), nullable=False)  # 'TRAVELLER', 'GUIDE', 'SYSTEM'
    sender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    session = relationship("AssistanceSession", back_populates="messages")
