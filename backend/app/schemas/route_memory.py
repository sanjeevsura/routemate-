from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.route_memory import MemoryCategory, MemoryStatus


class RouteMemoryCreate(BaseModel):
    title: str
    category: MemoryCategory = MemoryCategory.HAZARD
    description: str
    route_corridor: str = "Active Route"
    kilometer_marker: float = 0.0
    latitude: float
    longitude: float


class RouteMemoryConfirm(BaseModel):
    action: str  # 'STILL_THERE' | 'REPORT_CLEARED'


class RouteMemoryRead(BaseModel):
    id: str
    title: str
    category: MemoryCategory
    status: MemoryStatus
    route_corridor: str
    kilometer_marker: float
    description: str
    latitude: float
    longitude: float
    reported_by_user_id: Optional[str] = None
    reported_by_name: str
    confirmations: int
    confidence_percent: int
    last_confirmed_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
