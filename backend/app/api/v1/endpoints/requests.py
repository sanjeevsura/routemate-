from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.request import GuideRequest, RequestStatus
from app.schemas.request import GuideRequestCreate, GuideRequestRespond, GuideRequestRead
from app.schemas.session import SessionRead
from app.services.request_service import RequestService

router = APIRouter()


@router.post("/create", response_model=GuideRequestRead, status_code=status.HTTP_201_CREATED)
async def create_guide_request(
    req: GuideRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        request_obj = await RequestService.create_request(
            db=db,
            traveller=current_user,
            guide_id=req.guide_id,
            origin_name=req.origin_name,
            destination_name=req.destination_name,
            distance_km=req.distance_km
        )
        return request_obj
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/pending", response_model=List[GuideRequestRead])
async def get_pending_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    if current_user.role == UserRole.GUIDE:
        stmt = (
            select(GuideRequest)
            .where(
                GuideRequest.guide_id == current_user.id,
                GuideRequest.status == RequestStatus.PENDING,
                GuideRequest.expires_at > now
            )
            .order_by(GuideRequest.created_at.desc())
        )
    else:
        stmt = (
            select(GuideRequest)
            .where(
                GuideRequest.traveller_id == current_user.id,
                GuideRequest.status == RequestStatus.PENDING,
                GuideRequest.expires_at > now
            )
            .order_by(GuideRequest.created_at.desc())
        )
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.post("/{request_id}/respond")
async def respond_to_request(
    request_id: str,
    body: GuideRequestRespond,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != UserRole.GUIDE:
        raise HTTPException(status_code=403, detail="Only guides can respond to incoming requests")

    try:
        req, session = await RequestService.respond_to_request(
            db=db,
            request_id=request_id,
            guide_user=current_user,
            action=body.action
        )
        return {
            "success": True,
            "status": req.status.value,
            "session_id": session.id if session else None
        }
    except TimeoutError as e:
        raise HTTPException(status_code=410, detail=str(e))
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))
