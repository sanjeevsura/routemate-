from typing import List, Optional
from pydantic import BaseModel
from app.models.profile import VerificationStatus


class GuideSearchResult(BaseModel):
    id: str
    user_id: str
    name: str
    specialty: str
    years_experience: int
    rating: float
    review_count: int
    status: str  # 'AVAILABLE' | 'OFFLINE'
    coverage_radius_km: float
    is_remote_expert: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    route_familiarity_percent: int
    verified_trips: int
    languages: List[str]
    rate_per_session_inr: float
    verification_status: VerificationStatus
    calculated_distance_km: float
    match_score: int


class GuideSearchResponse(BaseModel):
    success: bool
    scanned_radius_km: float
    total_guides_found: int
    guides: List[GuideSearchResult]


class GuideAvailabilityUpdate(BaseModel):
    is_available: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
