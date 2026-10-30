from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.session import SessionStatus, SessionMode


class MessageCreate(BaseModel):
    text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MessageRead(BaseModel):
    id: str
    session_id: str
    sender_id: str
    sender_role: str
    sender_name: str
    text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionRead(BaseModel):
    id: str
    traveller_id: str
    traveller_name: str
    guide_id: str
    guide_name: str
    route_corridor: str
    status: SessionStatus
    mode: SessionMode
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_muted: bool
    messages: List[MessageRead] = []

    class Config:
        from_attributes = True
