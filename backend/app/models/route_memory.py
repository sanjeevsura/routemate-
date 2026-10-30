from sqlalchemy import String, Integer, Float, Enum, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import enum
from typing import Optional, List
from app.db.base import Base, TimestampMixin


class MemoryCategory(str, enum.Enum):
    HAZARD = "HAZARD"
    DETOUR = "DETOUR"
    ROAD_CLOSURE = "ROAD_CLOSURE"
    FLOOD = "FLOOD"
    BRIDGE = "BRIDGE"
    CONSTRUCTION = "CONSTRUCTION"
    FUEL = "FUEL"
    HOSPITAL = "HOSPITAL"
    POLICE = "POLICE"
    LANDMARK = "LANDMARK"
    OTHER = "OTHER"


class MemoryStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CLEARED = "CLEARED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    AGING = "AGING"
    EXPIRED = "EXPIRED"


class RouteMemory(Base, TimestampMixin):
    __tablename__ = "route_memories"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[MemoryCategory] = mapped_column(Enum(MemoryCategory), default=MemoryCategory.HAZARD, index=True)
    status: Mapped[MemoryStatus] = mapped_column(Enum(MemoryStatus), default=MemoryStatus.ACTIVE, index=True)
    route_corridor: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    kilometer_marker: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    reported_by_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reported_by_name: Mapped[str] = mapped_column(String(255), nullable=False)
    confirmations: Mapped[int] = mapped_column(Integer, default=1)
    confidence_percent: Mapped[int] = mapped_column(Integer, default=70)
    last_confirmed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    confirmations_log = relationship("RouteMemoryConfirmation", back_populates="memory", cascade="all, delete-orphan")


class RouteMemoryConfirmation(Base, TimestampMixin):
    __tablename__ = "route_memory_confirmations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    memory_id: Mapped[str] = mapped_column(String(64), ForeignKey("route_memories.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    action: Mapped[str] = mapped_column(String(32), nullable=False)  # 'STILL_THERE' or 'REPORT_CLEARED'

    memory = relationship("RouteMemory", back_populates="confirmations_log")
