from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.request import GuideRequest, RequestStatus
from app.models.session import AssistanceSession, SessionStatus, SessionMode
from app.models.message import SessionMessage
from app.models.user import User
from app.models.profile import GuideProfile, VerificationStatus
from app.schemas.request import GuideRequestRead
import uuid


class RequestService:
    @staticmethod
    async def create_request(
        db: AsyncSession,
        traveller: User,
        guide_id: str,
        origin_name: str,
        destination_name: str,
        distance_km: float = 0.0
    ) -> GuideRequest:
        # Verify target guide exists and is verified
        stmt = (
            select(User, GuideProfile)
            .join(GuideProfile, User.id == GuideProfile.user_id)
            .where(User.id == guide_id)
        )
        res = await db.execute(stmt)
        guide_row = res.first()
        if not guide_row:
            raise ValueError("Target guide not found")
        guide_user, guide_profile = guide_row
        status_val = guide_profile.verification_status.value if hasattr(guide_profile.verification_status, 'value') else str(guide_profile.verification_status)
        if status_val != "VERIFIED":
            raise ValueError("Guide account is not verified for navigation dispatch")

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=30)  # Server-authoritative 30s TTL

        request_obj = GuideRequest(
            id=f"req-{uuid.uuid4().hex[:12]}",
            traveller_id=traveller.id,
            traveller_name=traveller.full_name,
            guide_id=guide_user.id,
            origin_name=origin_name,
            destination_name=destination_name,
            distance_km=distance_km,
            offered_price_inr=guide_profile.rate_per_session_inr,
            status=RequestStatus.PENDING,
            expires_at=expires_at
        )

        db.add(request_obj)
        await db.commit()
        await db.refresh(request_obj)
        return request_obj

    @staticmethod
    async def respond_to_request(
        db: AsyncSession,
        request_id: str,
        guide_user: User,
        action: str
    ) -> tuple[GuideRequest, AssistanceSession | None]:
        stmt = select(GuideRequest).where(GuideRequest.id == request_id)
        res = await db.execute(stmt)
        req = res.scalar_one_or_none()

        if not req:
            raise ValueError("Request not found")
        if req.guide_id != guide_user.id:
            raise PermissionError("Unauthorized to respond to this request")

        now = datetime.now(timezone.utc)
        req_exp = req.expires_at
        if req_exp.tzinfo is None:
            req_exp = req_exp.replace(tzinfo=timezone.utc)
        if now > req_exp:
            req.status = RequestStatus.EXPIRED
            await db.commit()
            raise TimeoutError("Guide request has expired (30s window exceeded)")

        if req.status != RequestStatus.PENDING:
            raise ValueError(f"Request is already {req.status.value}")

        created_session = None

        if action.upper() == "ACCEPT":
            req.status = RequestStatus.ACCEPTED
            session_id = f"sess-{uuid.uuid4().hex[:12]}"
            created_session = AssistanceSession(
                id=session_id,
                traveller_id=req.traveller_id,
                traveller_name=req.traveller_name,
                guide_id=req.guide_id,
                guide_name=guide_user.full_name,
                route_corridor=f"{req.origin_name} → {req.destination_name}",
                status=SessionStatus.ACTIVE,
                mode=SessionMode.VOICE
            )
            db.add(created_session)

            # Initial system message
            sys_msg = SessionMessage(
                id=f"msg-{uuid.uuid4().hex[:12]}",
                session_id=session_id,
                sender_id="SYSTEM",
                sender_role="SYSTEM",
                sender_name="RouteMate Engine",
                text=f"Guidance channel established with {guide_user.full_name}. Real-time telemetry linked."
            )
            db.add(sys_msg)
        else:
            req.status = RequestStatus.DECLINED

        await db.commit()
        await db.refresh(req)
        if created_session:
            await db.refresh(created_session)

        return req, created_session
