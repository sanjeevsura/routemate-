from sqlalchemy import String, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
import enum
from app.db.base import Base, TimestampMixin

class ComplaintCategory(str, enum.Enum):
    GUIDE_BEHAVIOUR = "GUIDE_BEHAVIOUR"
    SAFETY_CONCERN = "SAFETY_CONCERN"
    INCORRECT_INFO = "INCORRECT_INFO"
    ROUTE_PROBLEM = "ROUTE_PROBLEM"
    SERVICE_ISSUE = "SERVICE_ISSUE"
    HARASSMENT = "HARASSMENT"
    OTHER = "OTHER"

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    complainant_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    complainant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    category: Mapped[ComplaintCategory] = mapped_column(Enum(ComplaintCategory), default=ComplaintCategory.OTHER, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False, index=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    complainant = relationship("User", foreign_keys=[complainant_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    session = relationship("AssistanceSession")
