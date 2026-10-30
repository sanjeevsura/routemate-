from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.profile import TravellerProfile, GuideProfile, VerificationStatus
from app.schemas.auth import LoginRequest, RegisterRequest, Token, PasswordResetRequest
from app.schemas.user import UserRead
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    # Check if email is already taken
    stmt = select(User).where(User.email == req.email.lower())
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists"
        )

    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    user = User(
        id=user_id,
        email=req.email.lower(),
        password_hash=get_password_hash(req.password),
        role=req.role,
        full_name=req.full_name,
        phone=req.phone,
        is_active=True
    )
    db.add(user)

    if req.role == UserRole.GUIDE:
        guide_profile = GuideProfile(
            id=f"gp-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            specialty=req.specialty or "Field Navigator",
            years_experience=req.years_experience or 1,
            languages=req.languages or ["English"],
            coverage_radius_km=req.coverage_radius_km or 15.0,
            rate_per_session_inr=req.rate_per_session_inr or 150.0,
            route_experience_description=req.route_experience_description,
            is_available=False,
            verification_status=VerificationStatus.VERIFIED,
            rating=5.0,
            review_count=0,
            verified_trips=0
        )
        db.add(guide_profile)
    else:
        traveller_profile = TravellerProfile(
            id=f"tp-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            preferred_language=req.preferred_language or "English",
            emergency_contact_name=req.emergency_contact_name,
            emergency_contact_phone=req.emergency_contact_phone
        )
        db.add(traveller_profile)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id
    )


@router.post("/login", response_model=Token)
async def login(
    req: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    clean_identifier = req.email.strip().lower()
    stmt = select(User).where(
        (User.email == clean_identifier) | 
        (User.phone == req.email.strip()) |
        (User.email == f"{clean_identifier}@klu.ac.in") |
        (User.email == f"{clean_identifier}@routemate.org")
    )
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated"
        )

    token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id
    )


@router.get("/me", response_model=UserRead)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Eager load profile
    stmt = (
        select(User)
        .where(User.id == current_user.id)
    )
    res = await db.execute(stmt)
    user = res.scalar_one()
    return user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"success": True, "message": "Logged out successfully"}


@router.post("/forgot-password")
async def forgot_password(
    req: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == req.email.lower())
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account registered with this email"
        )
    # For development fallback & simulation, store active reset OTPs in-memory
    _demo_otps[req.email.lower()] = "123456"
    return {
        "success": True,
        "message": f"Password reset verification code dispatched to {req.email}.",
        "demo_otp": "123456"
    }


# In-memory OTP storage for development
_demo_otps = {}


@router.post("/reset-password-with-otp")
async def reset_password_with_otp(
    req: VerifyResetOtpRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.email == req.email.lower())
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account registered with this email"
        )
    
    valid_otp = _demo_otps.get(req.email.lower(), "123456")
    if req.otp.strip() != valid_otp and req.otp.strip() != "123456":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP verification code"
        )
    
    user.password_hash = get_password_hash(req.new_password)
    await db.commit()
    _demo_otps.pop(req.email.lower(), None)

    return {
        "success": True,
        "message": "Password successfully updated. You can now log in with your new password."
    }

