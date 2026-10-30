from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class StepManeuver(BaseModel):
    instruction: str
    distance_m: float
    duration_sec: float
    name: str


class DirectionsResponse(BaseModel):
    success: bool
    provider: str
    distance_km: float
    duration_min: int
    geometry: Dict[str, Any]
    steps: List[StepManeuver]


class GeocodingFeature(BaseModel):
    name: str
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: float
    longitude: float
    formatted: str


class GeocodingResponse(BaseModel):
    results: List[GeocodingFeature]
