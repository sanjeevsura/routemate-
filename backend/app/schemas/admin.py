from typing import List, Optional
from pydantic import BaseModel
from app.schemas.user import UserRead
from app.schemas.sos import SosEventRead


class AdminOverviewStats(BaseModel):
    total_travellers: int
    total_guides: int
    verified_guides: int
    pending_verifications: int
    active_sessions: int
    route_memories_active: int
    emergency_alerts_count: int


class AdminOverviewResponse(BaseModel):
    success: bool
    stats: AdminOverviewStats
    guides: List[UserRead]
    recent_sos: List[SosEventRead]


class AdminGuideVerificationRequest(BaseModel):
    guide_id: str
    action: str  # 'APPROVE' | 'REJECT'
