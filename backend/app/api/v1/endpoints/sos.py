from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.sos import SosBroadcastRequest, SosEventRead
from app.services.sos_service import SosService

router = APIRouter()


@router.post("/broadcast", status_code=status.HTTP_201_CREATED)
async def broadcast_sos(
    body: SosBroadcastRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    event, contacts = await SosService.broadcast_sos(
        db=db,
        user=current_user,
        latitude=body.latitude,
        longitude=body.longitude,
        elevation_msl=body.elevation_msl
    )

    contact_summaries = [{"name": c.name, "phone": c.phone} for c in contacts]
    return {
        "success": True,
        "event_id": event.id,
        "activated_at": event.activated_at.isoformat(),
        "status": event.status.value,
        "emergency_contacts_notified": contact_summaries,
        "message": f"Distress signal broadcast recorded with coordinates ({event.latitude}, {event.longitude})."
    }
