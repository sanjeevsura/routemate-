from sqlalchemy import String, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.db.base import Base, TimestampMixin

class GuideReview(Base, TimestampMixin):
    __tablename__ = "guide_reviews"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), unique=True, index=True)
    guide_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    traveller_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    traveller_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False) # 1 to 5
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    session = relationship("AssistanceSession")
    guide = relationship("User", foreign_keys=[guide_id])
    traveller = relationship("User", foreign_keys=[traveller_id])
