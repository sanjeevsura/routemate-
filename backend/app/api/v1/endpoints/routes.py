from fastapi import APIRouter, HTTPException, Query
from app.services.routing_service import RoutingService
from app.schemas.route import DirectionsResponse

router = APIRouter()


@router.get("/directions", response_model=DirectionsResponse)
async def get_directions(
    from_coord: str = Query(..., alias="from", description="origin latitude,longitude e.g. 10.0102,77.4768"),
    to_coord: str = Query(..., alias="to", description="destination latitude,longitude e.g. 10.0889,77.0595")
):
    try:
        from_lat, from_lon = map(float, from_coord.split(","))
        to_lat, to_lon = map(float, to_coord.split(","))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Parameters 'from' and 'to' must be formatted as 'latitude,longitude'"
        )

    try:
        return await RoutingService.get_directions(from_lat, from_lon, to_lat, to_lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Routing provider error: {str(e)}")
