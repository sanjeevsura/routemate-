from sqlalchemy import String, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List, Dict, Any
from app.db.base import Base, TimestampMixin


class Route(Base, TimestampMixin):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    origin_name: Mapped[str] = mapped_column(String(255), nullable=False)
    destination_name: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    geometry_geojson: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)

    segments = relationship("RouteSegment", back_populates="route", cascade="all, delete-orphan", order_by="RouteSegment.sequence_order")


class RouteSegment(Base, TimestampMixin):
    __tablename__ = "route_segments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    route_id: Mapped[str] = mapped_column(String(64), ForeignKey("routes.id", ondelete="CASCADE"), index=True)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_m: Mapped[float] = mapped_column(Float, default=0.0)
    duration_sec: Mapped[float] = mapped_column(Float, default=0.0)
    maneuver_instruction: Mapped[str] = mapped_column(String(500), nullable=False)

    route = relationship("Route", back_populates="segments")
