from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.user import User, UserRole
from app.models.profile import GuideProfile, VerificationStatus
from app.models.session import AssistanceSession, SessionStatus
from app.models.route_memory import RouteMemory, MemoryStatus
from app.models.sos import EmergencySosEvent
from app.schemas.admin import AdminOverviewResponse, AdminOverviewStats, AdminGuideVerificationRequest
from app.schemas.user import UserRead
from app.schemas.sos import SosEventRead

router = APIRouter()


@router.get("/overview")
async def get_admin_overview(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Real live database counts
    travellers_count = await db.scalar(select(func.count(User.id)).where(User.role == UserRole.TRAVELLER)) or 0
    guides_count = await db.scalar(select(func.count(User.id)).where(User.role == UserRole.GUIDE)) or 0
    
    verified_count = await db.scalar(
        select(func.count(GuideProfile.id)).where(GuideProfile.verification_status == VerificationStatus.VERIFIED)
    ) or 0
    
    pending_count = await db.scalar(
        select(func.count(GuideProfile.id)).where(GuideProfile.verification_status == VerificationStatus.PENDING)
    ) or 0

    active_sessions_count = await db.scalar(
        select(func.count(AssistanceSession.id)).where(AssistanceSession.status == SessionStatus.ACTIVE)
    ) or 0

    active_memories_count = await db.scalar(
        select(func.count(RouteMemory.id)).where(RouteMemory.status == MemoryStatus.ACTIVE)
    ) or 0

    sos_count = await db.scalar(select(func.count(EmergencySosEvent.id))) or 0

    # Fetch guides
    guides_res = await db.execute(select(User).where(User.role == UserRole.GUIDE).order_by(User.created_at.desc()))
    guides = list(guides_res.scalars().all())

    # Fetch recent SOS events
    sos_res = await db.execute(select(EmergencySosEvent).order_by(EmergencySosEvent.activated_at.desc()).limit(10))
    recent_sos = list(sos_res.scalars().all())

    return {
        "success": True,
        "stats": {
            "total_travellers": travellers_count,
            "total_guides": guides_count,
            "verified_guides": verified_count,
            "pending_verifications": pending_count,
            "active_sessions": active_sessions_count,
            "route_memories_active": active_memories_count,
            "emergency_alerts_count": sos_count
        },
        "guides": [
            {
                "id": g.id,
                "email": g.email,
                "full_name": g.full_name,
                "role": g.role.value,
                "phone": g.phone,
                "is_active": g.is_active,
                "created_at": g.created_at.isoformat()
            }
            for g in guides
        ],
        "recent_sos": [
            {
                "id": s.id,
                "user_id": s.user_id,
                "user_name": s.user_name,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "elevation_msl": s.elevation_msl,
                "status": s.status.value,
                "activated_at": s.activated_at.isoformat()
            }
            for s in recent_sos
        ]
    }


@router.post("/verify-guide")
async def verify_guide(
    req: AdminGuideVerificationRequest,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(GuideProfile).where(GuideProfile.user_id == req.guide_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Guide profile not found")

    new_status = VerificationStatus.VERIFIED if req.action.upper() == "APPROVE" else VerificationStatus.REJECTED
    profile.verification_status = new_status
    if req.action.upper() == "APPROVE":
        profile.is_available = True
    elif req.action.upper() == "REJECT":
        profile.is_available = False

    await db.commit()
    return {
        "success": True,
        "guide_id": req.guide_id,
        "verification_status": new_status.value,
        "message": f"Guide status updated to {new_status.value}"
    }


from app.models.complaint import Complaint, ComplaintStatus
from pydantic import BaseModel

class AdminComplaintAction(BaseModel):
    status: ComplaintStatus
    admin_notes: Optional[str] = None

@router.get("/complaints")
async def get_all_complaints(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Complaint).order_by(Complaint.created_at.desc())
    res = await db.execute(stmt)
    complaints = res.scalars().all()
    return [
        {
            "id": c.id,
            "complainant_id": c.complainant_id,
            "complainant_name": c.complainant_name,
            "target_user_id": c.target_user_id,
            "session_id": c.session_id,
            "category": c.category.value,
            "description": c.description,
            "status": c.status.value,
            "admin_notes": c.admin_notes,
            "created_at": c.created_at.isoformat()
        }
        for c in complaints
    ]

@router.post("/complaints/{complaint_id}/respond")
async def respond_to_complaint(
    complaint_id: str,
    body: AdminComplaintAction,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Complaint).where(Complaint.id == complaint_id)
    res = await db.execute(stmt)
    complaint = res.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = body.status
    if body.admin_notes:
        complaint.admin_notes = body.admin_notes

    await db.commit()
    return {
        "success": True,
        "complaint_id": complaint.id,
        "status": complaint.status.value,
        "message": f"Complaint status updated to {complaint.status.value}"
    }

class GuideStatusUpdate(BaseModel):
    action: str  # 'VERIFY' | 'REJECT' | 'SUSPEND' | 'REACTIVATE'

@router.post("/guides/{guide_id}/status")
async def update_guide_status(
    guide_id: str,
    body: GuideStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(GuideProfile).where(GuideProfile.user_id == guide_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Guide profile not found")

    action = body.action.upper()
    if action == "VERIFY":
        profile.verification_status = VerificationStatus.VERIFIED
    elif action == "REJECT":
        profile.verification_status = VerificationStatus.REJECTED
        profile.is_available = False
    elif action == "SUSPEND":
        profile.verification_status = VerificationStatus.SUSPENDED
        profile.is_available = False
    elif action == "REACTIVATE":
        profile.verification_status = VerificationStatus.VERIFIED
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    await db.commit()
    return {
        "success": True,
        "guide_id": guide_id,
        "verification_status": profile.verification_status.value
    }
