from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Optional
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.session import AssistanceSession, SessionStatus
from app.models.message import SessionMessage
from app.schemas.session import SessionRead, MessageCreate, MessageRead
from app.websocket.manager import manager

router = APIRouter()


@router.get("/{session_id}", response_model=SessionRead)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(AssistanceSession)
        .options(selectinload(AssistanceSession.messages))
        .where(AssistanceSession.id == session_id)
    )
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.id not in [session.traveller_id, session.guide_id] and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")

    return session


@router.post("/{session_id}/messages", response_model=MessageRead)
async def send_message(
    session_id: str,
    body: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AssistanceSession).where(AssistanceSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.id not in [session.traveller_id, session.guide_id]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")

    msg = SessionMessage(
        id=f"msg-{uuid.uuid4().hex[:12]}",
        session_id=session_id,
        sender_id=current_user.id,
        sender_role=current_user.role.value,
        sender_name=current_user.full_name,
        text=body.text,
        latitude=body.latitude,
        longitude=body.longitude
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # Broadcast to active WebSocket clients
    await manager.broadcast_to_session(
        session_id=session_id,
        message={
            "type": "NEW_MESSAGE",
            "message": {
                "id": msg.id,
                "session_id": msg.session_id,
                "sender_id": msg.sender_id,
                "sender_role": msg.sender_role,
                "sender_name": msg.sender_name,
                "text": msg.text,
                "latitude": msg.latitude,
                "longitude": msg.longitude,
                "created_at": msg.created_at.isoformat()
            }
        }
    )

    return msg


@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AssistanceSession).where(AssistanceSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.id not in [session.traveller_id, session.guide_id]:
        raise HTTPException(status_code=403, detail="Unauthorized to end this session")

    session.status = SessionStatus.COMPLETED
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()

    await manager.broadcast_to_session(
        session_id=session_id,
        message={"type": "SESSION_ENDED", "session_id": session_id}
    )

    return {"success": True, "message": "Session completed"}


from pydantic import BaseModel, Field

class SessionReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None

@router.post("/{session_id}/review")
async def review_session(
    session_id: str,
    body: SessionReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.review import GuideReview
    from app.models.profile import GuideProfile
    import uuid

    stmt = select(AssistanceSession).where(AssistanceSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.id != session.traveller_id:
        raise HTTPException(status_code=403, detail="Only the traveller can submit a review for this session")

    # Check if review already exists
    existing_stmt = select(GuideReview).where(GuideReview.session_id == session_id)
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A review has already been submitted for this session")

    review = GuideReview(
        id=f"rev-{uuid.uuid4().hex[:12]}",
        session_id=session_id,
        guide_id=session.guide_id,
        traveller_id=current_user.id,
        traveller_name=current_user.full_name,
        rating=body.rating,
        review_text=body.review_text
    )
    db.add(review)

    # Update Guide's rolling rating
    gp_stmt = select(GuideProfile).where(GuideProfile.user_id == session.guide_id)
    gp_res = await db.execute(gp_stmt)
    guide_profile = gp_res.scalar_one_or_none()
    if guide_profile:
        current_count = guide_profile.review_count or 0
        current_rating = guide_profile.rating or 5.0
        new_count = current_count + 1
        new_rating = round(((current_rating * current_count) + body.rating) / new_count, 2)
        guide_profile.rating = new_rating
        guide_profile.review_count = new_count
        guide_profile.verified_trips = (guide_profile.verified_trips or 0) + 1

    await db.commit()
    return {
        "success": True,
        "review_id": review.id,
        "rating": review.rating,
        "message": "Thank you for your feedback!"
    }
