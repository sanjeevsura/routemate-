import math
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole
from app.models.profile import GuideProfile, VerificationStatus
from app.schemas.guide import GuideSearchResult, GuideSearchResponse


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)


class GuideService:
    @staticmethod
    async def discover_guides(
        db: AsyncSession,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        radius_km: float = 15.0,
        filter_mode: str = "all"  # 'all', 'nearby', 'remote'
    ) -> GuideSearchResponse:
        # Query verified guides only
        stmt = (
            select(User, GuideProfile)
            .join(GuideProfile, User.id == GuideProfile.user_id)
            .where(
                User.role == UserRole.GUIDE,
                User.is_active == True,
                GuideProfile.verification_status == VerificationStatus.VERIFIED
            )
        )
        result = await db.execute(stmt)
        rows = result.all()

        guides: List[GuideSearchResult] = []

        for user, profile in rows:
            dist = 0.0
            if lat is not None and lon is not None and profile.latitude is not None and profile.longitude is not None:
                dist = calculate_haversine_distance(lat, lon, profile.latitude, profile.longitude)

            is_remote = profile.coverage_radius_km > 25.0

            # Match score formula
            familiarity = min(100, (profile.verified_trips or 0) * 5)
            rating_score = ((profile.rating or 5.0) / 5.0) * 100.0
            proximity_score = max(0.0, 100.0 - (dist * 4.0))
            availability_score = 100.0 if profile.is_available else 20.0
            
            score = int(round(
                familiarity * 0.35 +
                availability_score * 0.15 +
                rating_score * 0.15 +
                proximity_score * 0.20 +
                15.0 # baseline reliability & verification
            ))

            item = GuideSearchResult(
                id=profile.id,
                user_id=user.id,
                name=user.full_name,
                specialty=profile.specialty,
                years_experience=profile.years_experience,
                rating=profile.rating,
                review_count=profile.review_count,
                status="AVAILABLE" if profile.is_available else "OFFLINE",
                coverage_radius_km=profile.coverage_radius_km,
                is_remote_expert=is_remote,
                latitude=profile.latitude,
                longitude=profile.longitude,
                route_familiarity_percent=familiarity,
                verified_trips=profile.verified_trips,
                languages=profile.languages if isinstance(profile.languages, list) else ["English"],
                rate_per_session_inr=profile.rate_per_session_inr,
                verification_status=profile.verification_status,
                calculated_distance_km=dist,
                match_score=min(99, max(1, score))
            )

            # Apply filters
            if filter_mode == "nearby" and (is_remote or dist > radius_km):
                continue
            elif filter_mode == "remote" and not is_remote:
                continue

            guides.append(item)

        # Sort descending by match score
        guides.sort(key=lambda g: g.match_score, reverse=True)

        return GuideSearchResponse(
            success=True,
            scanned_radius_km=radius_km,
            total_guides_found=len(guides),
            guides=guides
        )
