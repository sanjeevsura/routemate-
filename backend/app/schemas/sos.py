from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.sos import SosStatus


class SosBroadcastRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation_msl: Optional[float] = None


class SosEventRead(BaseModel):
    id: str
    user_id: str
    user_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation_msl: Optional[float] = None
    status: SosStatus
    activated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
