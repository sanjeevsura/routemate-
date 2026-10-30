from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.TRAVELLER
    phone: Optional[str] = None
    
    # Traveller fields
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_language: Optional[str] = "English"

    # Guide fields
    specialty: Optional[str] = "Field Navigator"
    years_experience: Optional[int] = 1
    languages: Optional[List[str]] = None
    coverage_radius_km: Optional[float] = 15.0
    rate_per_session_inr: Optional[float] = 150.0
    route_experience_description: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class VerifyResetOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

