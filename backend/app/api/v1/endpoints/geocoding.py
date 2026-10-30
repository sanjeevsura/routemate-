from fastapi import APIRouter, Query
from app.services.geocoding_service import GeocodingService
from app.schemas.route import GeocodingResponse

router = APIRouter()


@router.get("/search", response_model=GeocodingResponse)
async def search_places(
    q: str = Query("", description="Query place or address"),
    limit: int = Query(6, ge=1, le=15)
):
    return await GeocodingService.search(q, limit=limit)


@router.get("/nearby")
async def search_nearby_essentials(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    category: str = Query("hospital", description="hospital | pharmacy | fuel | hotel | restaurant | police | emergency | atm | cafe | repair"),
    limit: int = Query(10, ge=1, le=25)
):
    return await GeocodingService.search_nearby(lat=lat, lon=lon, category=category, limit=limit)
