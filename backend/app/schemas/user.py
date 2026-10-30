from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserRole
from app.models.profile import VerificationStatus


class TravellerProfileRead(BaseModel):
    id: str
    preferred_language: str
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    class Config:
        from_attributes = True


class GuideProfileRead(BaseModel):
    id: str
    specialty: str
    years_experience: int
    languages: List[str]
    coverage_radius_km: float
    rate_per_session_inr: float
    is_available: bool
    verification_status: VerificationStatus
    rating: float
    review_count: int
    verified_trips: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    route_experience_description: Optional[str] = None

    class Config:
        from_attributes = True


class UserRead(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    traveller_profile: Optional[TravellerProfileRead] = None
    guide_profile: Optional[GuideProfileRead] = None

    class Config:
        from_attributes = True
