from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid
from app.models.sos import EmergencySosEvent, EmergencyContact, SosStatus
from app.models.user import User


class SosService:
    @staticmethod
    async def broadcast_sos(
        db: AsyncSession,
        user: User,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        elevation_msl: Optional[float] = None
    ) -> tuple[EmergencySosEvent, List[EmergencyContact]]:
        event = EmergencySosEvent(
            id=f"sos-{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            user_name=user.full_name,
            latitude=latitude,
            longitude=longitude,
            elevation_msl=elevation_msl,
            status=SosStatus.ACTIVE,
            activated_at=datetime.now(timezone.utc)
        )
        db.add(event)

        # Fetch configured emergency contacts
        stmt = select(EmergencyContact).where(EmergencyContact.user_id == user.id)
        res = await db.execute(stmt)
        contacts = list(res.scalars().all())

        await db.commit()
        await db.refresh(event)
        return event, contacts
