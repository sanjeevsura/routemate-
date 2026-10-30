from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.profile import GuideProfile
from app.schemas.guide import GuideSearchResponse, GuideAvailabilityUpdate
from app.services.guide_service import GuideService

router = APIRouter()


@router.get("", response_model=GuideSearchResponse)
async def get_guides(
    lat: Optional[float] = Query(None, description="Traveller latitude"),
    lon: Optional[float] = Query(None, description="Traveller longitude"),
    radius: float = Query(15.0, description="Search radius in km"),
    filter: str = Query("all", description="all | nearby | remote"),
    db: AsyncSession = Depends(get_db)
):
    return await GuideService.discover_guides(
        db=db,
        lat=lat,
        lon=lon,
        radius_km=radius,
        filter_mode=filter
    )


@router.post("/availability")
async def update_availability(
    req: GuideAvailabilityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.GUIDE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only guide accounts can toggle availability"
        )

    stmt = select(GuideProfile).where(GuideProfile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Guide profile not found")

    profile.is_available = req.is_available
    if req.latitude is not None:
        profile.latitude = req.latitude
    if req.longitude is not None:
        profile.longitude = req.longitude

    await db.commit()
    return {
        "success": True,
        "is_available": profile.is_available,
        "latitude": profile.latitude,
        "longitude": profile.longitude
    }
