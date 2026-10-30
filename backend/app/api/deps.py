from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload["sub"]
    email = (payload.get("email") or f"{user_id}@supabase.user").lower()
    
    # 1. Look up by user_id
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    # 2. Look up by email if not found by user_id
    if not user:
        stmt_email = select(User).where(User.email == email)
        res_email = await db.execute(stmt_email)
        user = res_email.scalar_one_or_none()

    # 3. Auto-provision if authenticated in Supabase but not yet in RouteMate DB
    if not user:
        user_meta = payload.get("user_metadata", {})
        raw_role = user_meta.get("role", "TRAVELLER").upper()
        admin_emails = ["99240041036@klu.ac.in", "9924051001@klu.ac.in", "9924051001"]
        role_enum = UserRole.ADMIN if (email.lower() in admin_emails or raw_role == "ADMIN") else (UserRole.GUIDE if raw_role == "GUIDE" else UserRole.TRAVELLER)
        full_name = user_meta.get("full_name") or email.split("@")[0].capitalize()

        from app.models.profile import TravellerProfile, GuideProfile, VerificationStatus
        import uuid

        user = User(
            id=user_id,
            email=email,
            password_hash="supabase_managed_auth",
            role=role_enum,
            full_name=full_name,
            phone=user_meta.get("phone"),
            is_active=True
        )
        db.add(user)

        if role_enum == UserRole.GUIDE:
            gp = GuideProfile(
                id=f"gp-{uuid.uuid4().hex[:12]}",
                user_id=user_id,
                specialty=user_meta.get("specialty", "Field Navigator"),
                years_experience=user_meta.get("years_experience", 1),
                languages=user_meta.get("languages", ["English"]),
                coverage_radius_km=user_meta.get("coverage_radius_km", 15.0),
                rate_per_session_inr=user_meta.get("rate_per_session_inr", 150.0),
                is_available=False,
                verification_status=VerificationStatus.PENDING,
                rating=5.0,
                review_count=0,
                verified_trips=0
            )
            db.add(gp)
        else:
            tp = TravellerProfile(
                id=f"tp-{uuid.uuid4().hex[:12]}",
                user_id=user_id,
                preferred_language=user_meta.get("preferred_language", "English"),
                emergency_contact_name=user_meta.get("emergency_contact_name"),
                emergency_contact_phone=user_meta.get("emergency_contact_phone")
            )
            db.add(tp)

        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or suspended",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privilege required"
        )
    return current_user
