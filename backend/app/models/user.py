from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from typing import Optional, List
from app.db.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    TRAVELLER = "TRAVELLER"
    GUIDE = "GUIDE"
    ADMIN = "ADMIN"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.TRAVELLER, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    traveller_profile = relationship("TravellerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    guide_profile = relationship("GuideProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    emergency_contacts = relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    sos_events = relationship("EmergencySosEvent", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
