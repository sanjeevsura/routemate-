from sqlalchemy import String, Integer, Float, Boolean, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from typing import Optional, List
from app.db.base import Base, TimestampMixin


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class TravellerProfile(Base, TimestampMixin):
    __tablename__ = "traveller_profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    preferred_language: Mapped[str] = mapped_column(String(64), default="English")
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    user = relationship("User", back_populates="traveller_profile")


class GuideProfile(Base, TimestampMixin):
    __tablename__ = "guide_profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    specialty: Mapped[str] = mapped_column(String(255), default="Field Navigator")
    years_experience: Mapped[int] = mapped_column(Integer, default=1)
    route_experience_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    languages: Mapped[List[str]] = mapped_column(JSON, default=lambda: ["English"])
    coverage_radius_km: Mapped[float] = mapped_column(Float, default=15.0)
    rate_per_session_inr: Mapped[float] = mapped_column(Float, default=150.0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False, index=True
    )
    rating: Mapped[float] = mapped_column(Float, default=5.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    verified_trips: Mapped[int] = mapped_column(Integer, default=0)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    user = relationship("User", back_populates="guide_profile")
