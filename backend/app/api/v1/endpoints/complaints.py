from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from pydantic import BaseModel
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.complaint import Complaint, ComplaintCategory, ComplaintStatus

router = APIRouter()

class ComplaintCreate(BaseModel):
    category: ComplaintCategory
    description: str
    target_user_id: Optional[str] = None
    session_id: Optional[str] = None

class ComplaintRead(BaseModel):
    id: str
    complainant_id: str
    complainant_name: str
    target_user_id: Optional[str] = None
    session_id: Optional[str] = None
    category: ComplaintCategory
    description: str
    status: ComplaintStatus
    admin_notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    body: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if len(body.description.strip()) < 5:
        raise HTTPException(status_code=400, detail="Description must be at least 5 characters")

    complaint = Complaint(
        id=f"cmp-{uuid.uuid4().hex[:10]}",
        complainant_id=current_user.id,
        complainant_name=current_user.full_name,
        target_user_id=body.target_user_id,
        session_id=body.session_id,
        category=body.category,
        description=body.description,
        status=ComplaintStatus.SUBMITTED
    )
    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)

    return {
        "success": True,
        "complaint_id": complaint.id,
        "status": complaint.status.value,
        "message": f"Complaint recorded with reference ID: {complaint.id}"
    }

@router.get("/my")
async def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Complaint)
        .where(Complaint.complainant_id == current_user.id)
        .order_by(desc(Complaint.created_at))
    )
    res = await db.execute(stmt)
    complaints = res.scalars().all()
    return [
        {
            "id": c.id,
            "category": c.category.value,
            "description": c.description,
            "status": c.status.value,
            "session_id": c.session_id,
            "created_at": c.created_at.isoformat()
        }
        for c in complaints
    ]
